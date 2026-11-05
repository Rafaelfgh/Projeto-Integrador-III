-- Dependências do condomínio e reservas (pedido do dono, 04/11/2026)
-- Master cadastra as dependências (no cadastro do condomínio, opcional, ou depois, como os blocos):
--   nome; tipo de agendamento 'dia' (dia inteiro) ou 'horario' (faixas de horário definidas por ele);
--   dias da semana em que funciona (0 = domingo ... 6 = sábado).
-- Morador (e síndico) reserva um dia ou uma faixa de horário; fica bloqueado para os outros
-- até quem reservou cancelar. Fica guardado quem reservou, o dia e o horário.

create table if not exists public.dependencias (
  id            bigint generated always as identity primary key,
  condominio_id bigint not null references public."Condominios"(id) on delete cascade,
  nome          text not null check (char_length(btrim(nome)) between 1 and 60),
  tipo          text not null check (tipo in ('dia', 'horario')),
  dias_semana   smallint[] not null
                check (cardinality(dias_semana) between 1 and 7 and dias_semana <@ array[0,1,2,3,4,5,6]::smallint[]),
  horarios      jsonb not null default '[]'::jsonb,   -- [{"inicio":"08:00","fim":"12:00"}, ...]
  ativa         boolean not null default true,         -- "remover" só desativa: as reservas antigas ficam
  created_at    timestamptz not null default now()
);
create unique index if not exists dependencias_nome_unico
  on public.dependencias (condominio_id, lower(btrim(nome))) where ativa;

-- Confere as faixas de horário: formato HH:MM, início antes do fim e sem sobreposição
create or replace function private.tg_validar_dependencia()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  f record;
  ant time;
begin
  new.nome := btrim(new.nome);
  if new.tipo = 'dia' then
    new.horarios := '[]'::jsonb;
    return new;
  end if;
  if jsonb_typeof(new.horarios) is distinct from 'array' or jsonb_array_length(new.horarios) = 0 then
    raise exception 'Adicione pelo menos um horário.' using errcode = '23514', hint = 'horarios';
  end if;
  for f in
    select (h ->> 'inicio')::time as inicio, (h ->> 'fim')::time as fim
      from jsonb_array_elements(new.horarios) h
     order by 1
  loop
    if f.inicio is null or f.fim is null or f.inicio >= f.fim then
      raise exception 'Cada horário precisa ter início antes do fim.' using errcode = '23514', hint = 'horarios';
    end if;
    if ant is not null and f.inicio < ant then
      raise exception 'Os horários não podem se sobrepor.' using errcode = '23514', hint = 'horarios';
    end if;
    ant := f.fim;
  end loop;
  -- guarda em ordem e só com início/fim
  new.horarios := (select jsonb_agg(jsonb_build_object('inicio', to_char((h ->> 'inicio')::time, 'HH24:MI'),
                                                       'fim',    to_char((h ->> 'fim')::time, 'HH24:MI'))
                                    order by (h ->> 'inicio')::time)
                     from jsonb_array_elements(new.horarios) h);
  return new;
end;
$$;

drop trigger if exists trg_validar_dependencia on public.dependencias;
create trigger trg_validar_dependencia
  before insert or update of tipo, horarios, nome on public.dependencias
  for each row execute function private.tg_validar_dependencia();

alter table public.dependencias enable row level security;
drop policy if exists dependencias_select on public.dependencias;
create policy dependencias_select on public.dependencias for select to authenticated
  using (private.is_membro(condominio_id) or private.is_master(condominio_id) or private.is_dev());
drop policy if exists dependencias_insert on public.dependencias;
create policy dependencias_insert on public.dependencias for insert to authenticated
  with check (private.is_master(condominio_id));
drop policy if exists dependencias_update on public.dependencias;
create policy dependencias_update on public.dependencias for update to authenticated
  using (private.is_master(condominio_id)) with check (private.is_master(condominio_id));

create table if not exists public.reservas (
  id             bigint generated always as identity primary key,
  dependencia_id bigint not null references public.dependencias(id) on delete cascade,
  condominio_id  bigint not null references public."Condominios"(id) on delete cascade,
  morador_id     uuid not null references public."Moradores"(id) on delete cascade,
  data           date not null,
  inicio         time,          -- null quando a dependência é por dia inteiro
  fim            time,
  status         text not null default 'ativa' check (status in ('ativa', 'cancelada')),
  created_at     timestamptz not null default now(),
  cancelada_em   timestamptz
);
-- Um dia (ou uma faixa de horário) só pode ter uma reserva ativa: o banco garante,
-- mesmo se duas pessoas clicarem ao mesmo tempo
create unique index if not exists reservas_sem_conflito
  on public.reservas (dependencia_id, data, coalesce(inicio, '00:00'::time)) where status = 'ativa';
create index if not exists reservas_morador on public.reservas (morador_id, data);

alter table public.reservas enable row level security;
drop policy if exists reservas_select on public.reservas;
create policy reservas_select on public.reservas for select to authenticated
  using (morador_id = (select auth.uid()) or private.is_gestor(condominio_id));
-- Criar e cancelar só pelas funções abaixo (que conferem as regras)

-- Dia de hoje no horário de Brasília
create or replace function private.hoje_br()
returns date language sql stable set search_path = '' as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

-- Dias/horários já reservados (sem dizer quem), para a tela bloquear
create or replace function public.ocupacao_dependencia(p_dependencia bigint, p_de date, p_ate date)
returns table (data date, inicio time)
language plpgsql stable security definer set search_path = ''
as $$
declare v_cond bigint;
begin
  select d.condominio_id into v_cond from public.dependencias d where d.id = p_dependencia;
  if v_cond is null or not (private.is_membro(v_cond) or private.is_master(v_cond)) then
    raise exception 'Dependência não encontrada.' using errcode = '42501';
  end if;
  return query
    select r.data, r.inicio from public.reservas r
     where r.dependencia_id = p_dependencia and r.status = 'ativa'
       and r.data between p_de and p_ate;
end;
$$;

create or replace function public.reservar_dependencia(p_dependencia bigint, p_data date, p_inicio time default null)
returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  dep   record;
  v_fim time;
  v_id  bigint;
  hoje  date := private.hoje_br();
begin
  select * into dep from public.dependencias where id = p_dependencia and ativa;
  if dep.id is null then
    raise exception 'Dependência não encontrada.' using errcode = 'P0001', hint = 'dependencia';
  end if;
  if not private.is_morador(dep.condominio_id) then
    raise exception 'Só moradores com cadastro aprovado podem reservar.' using errcode = '42501';
  end if;
  if p_data < hoje or p_data > hoje + 60 then
    raise exception 'Escolha um dia entre hoje e os próximos 60 dias.' using errcode = 'P0001', hint = 'data';
  end if;
  if not (extract(dow from p_data)::smallint = any (dep.dias_semana)) then
    raise exception 'A dependência não funciona nesse dia da semana.' using errcode = 'P0001', hint = 'data';
  end if;

  if dep.tipo = 'horario' then
    select (h ->> 'fim')::time into v_fim
      from jsonb_array_elements(dep.horarios) h
     where (h ->> 'inicio')::time = p_inicio;
    if p_inicio is null or v_fim is null then
      raise exception 'Escolha um dos horários disponíveis.' using errcode = 'P0001', hint = 'horario';
    end if;
    if p_data = hoje and p_inicio <= (now() at time zone 'America/Sao_Paulo')::time then
      raise exception 'Esse horário já começou.' using errcode = 'P0001', hint = 'horario';
    end if;
  else
    p_inicio := null;
  end if;

  begin
    insert into public.reservas (dependencia_id, condominio_id, morador_id, data, inicio, fim)
    values (dep.id, dep.condominio_id, auth.uid(), p_data, p_inicio, v_fim)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'Esse % acabou de ser reservado por outra pessoa.', case when dep.tipo = 'dia' then 'dia' else 'horário' end
      using errcode = 'P0001', hint = 'ocupado';
  end;
  return v_id;
end;
$$;

-- Cancela a própria reserva (só as que ainda não começaram)
create or replace function public.cancelar_reserva(p_reserva bigint)
returns void
language plpgsql security definer set search_path = ''
as $$
declare r record;
begin
  select * into r from public.reservas where id = p_reserva and status = 'ativa';
  if r.id is null or r.morador_id is distinct from auth.uid() then
    raise exception 'Reserva não encontrada.' using errcode = 'P0001', hint = 'reserva';
  end if;
  if r.data < private.hoje_br()
     or (r.data = private.hoje_br() and coalesce(r.inicio, '00:00'::time) <= (now() at time zone 'America/Sao_Paulo')::time and r.inicio is not null) then
    raise exception 'Essa reserva já começou ou já passou.' using errcode = 'P0001', hint = 'passou';
  end if;
  update public.reservas set status = 'cancelada', cancelada_em = now() where id = r.id;
end;
$$;

revoke all on function public.ocupacao_dependencia(bigint, date, date) from public, anon;
revoke all on function public.reservar_dependencia(bigint, date, time) from public, anon;
revoke all on function public.cancelar_reserva(bigint) from public, anon;
grant execute on function public.ocupacao_dependencia(bigint, date, date) to authenticated;
grant execute on function public.reservar_dependencia(bigint, date, time) to authenticated;
grant execute on function public.cancelar_reserva(bigint) to authenticated;

-- Cadastro do condomínio: dependências opcionais junto com os blocos
create or replace function private.tg_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta    jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_cond  bigint;
begin
  if meta ->> 'tipo' = 'morador' then
    perform private.criar_morador(new.id, meta);

  elsif meta ->> 'tipo' = 'master' then
    if jsonb_typeof(meta -> 'blocos') is distinct from 'array' or jsonb_array_length(meta -> 'blocos') = 0 then
      raise exception 'Cadastre pelo menos um bloco.' using errcode = '23514';
    end if;

    insert into public."Masters" (id, nome, telefone, cpf_ou_cnpj)
    values (
      new.id,
      nullif(btrim(meta ->> 'nome'), ''),
      nullif(btrim(meta ->> 'telefone'), ''),
      nullif(btrim(meta ->> 'documento'), '')
    );

    insert into public."Condominios" (nome, endereco, cidade, estado, master_id, status)
    values (
      nullif(btrim(meta ->> 'condominio_nome'), ''),
      nullif(btrim(meta ->> 'endereco'), ''),
      nullif(btrim(meta ->> 'cidade'), ''),
      nullif(btrim(meta ->> 'estado'), ''),
      new.id,
      'PENDENTE'
    )
    returning id into v_cond;

    insert into public.blocos (condominio_id, nome, andares, aptos_por_andar)
    select v_cond, b ->> 'nome', (b ->> 'andares')::int, (b ->> 'aptos_por_andar')::int
      from jsonb_array_elements(meta -> 'blocos') b;

    if jsonb_typeof(meta -> 'dependencias') = 'array' then
      insert into public.dependencias (condominio_id, nome, tipo, dias_semana, horarios)
      select v_cond, d ->> 'nome', d ->> 'tipo',
             array(select (x)::smallint from jsonb_array_elements_text(d -> 'dias_semana') x),
             coalesce(d -> 'horarios', '[]'::jsonb)
        from jsonb_array_elements(meta -> 'dependencias') d;
    end if;

    update public."Masters" set condominio_id = v_cond where id = new.id;
  end if;

  return new;
end;
$$;
