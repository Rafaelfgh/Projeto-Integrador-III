-- =============================================================================
-- Perfil "Dev" (equipe Habitare) e aprovação de novos condomínios
--  * Novo condomínio nasce PENDENTE: o master não acessa nada até ser aprovado
--    e moradores não conseguem se cadastrar nele.
--  * O Dev vê as solicitações, abre a ficha (condomínio + master) e aprova ou
--    recusa (com motivo). O master é notificado da decisão.
--  * Contas Dev são criadas pelo painel do Supabase e liberadas por SQL
--    (insert em public.desenvolvedores) — não há cadastro público.
-- =============================================================================

-- 1. Tabela do perfil Dev -----------------------------------------------------
create table if not exists public.desenvolvedores (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text not null,
  created_at timestamptz not null default now()
);
alter table public.desenvolvedores enable row level security;
revoke all on public.desenvolvedores from anon;
create policy desenvolvedores_select_proprio on public.desenvolvedores
  for select to authenticated using (id = (select auth.uid()));

create or replace function private.is_dev() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.desenvolvedores d where d.id = auth.uid());
$$;

-- 2. Situação do condomínio ---------------------------------------------------
alter table public."Condominios"
  add column if not exists status        text not null default 'ATIVO'
    check (status in ('PENDENTE', 'ATIVO', 'RECUSADO')),
  add column if not exists decidido_em   timestamptz,
  add column if not exists decidido_por  uuid references auth.users (id) on delete set null,
  add column if not exists motivo_recusa text check (char_length(motivo_recusa) <= 500);

-- Os que já existiam ficam ativos; daqui para frente nascem pendentes
alter table public."Condominios" alter column status set default 'PENDENTE';
-- Condomínio criado no teste de 25/09/2026 volta para a fila de aprovação
update public."Condominios" set status = 'PENDENTE' where id = 6;

-- Só o Dev muda a situação (o master não se aprova sozinho)
create or replace function private.tg_condominio_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not private.is_dev() then
    new.status        := old.status;
    new.decidido_em   := old.decidido_em;
    new.decidido_por  := old.decidido_por;
    new.motivo_recusa := old.motivo_recusa;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_condominios_guard on public."Condominios";
create trigger trg_condominios_guard
  before update on public."Condominios"
  for each row execute function private.tg_condominio_guard();

-- Master só tem poderes num condomínio aprovado
create or replace function private.is_master(cond bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public."Condominios" c
    where c.id = cond and c.master_id = auth.uid() and c.status = 'ATIVO'
  );
$$;

-- Listagem: visitante e usuários veem só os ativos; o master vê o próprio; o Dev vê todos
drop policy if exists condominios_select on public."Condominios";
create policy condominios_select_anon on public."Condominios"
  for select to anon using (status = 'ATIVO');
create policy condominios_select on public."Condominios"
  for select to authenticated
  using (status = 'ATIVO' or master_id = (select auth.uid()) or private.is_dev());

-- 3. Cadastro: condomínio nasce pendente; morador só entra em condomínio ativo --
create or replace function private.tg_novo_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta   jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_cond bigint;
begin
  if meta ->> 'tipo' = 'morador' then
    if not exists (
      select 1 from public."Condominios" c
      where c.id = (meta ->> 'condominio_id')::bigint and c.status = 'ATIVO'
    ) then
      raise exception 'Condomínio indisponível para cadastro' using errcode = '23514';
    end if;

    insert into public."Moradores" (id, nome, cpf, telefone, bloco, apartamento, condominio_id, status)
    values (
      new.id,
      nullif(btrim(meta ->> 'nome'), ''),
      nullif(btrim(meta ->> 'cpf'), ''),
      nullif(btrim(meta ->> 'telefone'), ''),
      upper(nullif(btrim(meta ->> 'bloco'), '')),
      nullif(btrim(meta ->> 'apartamento'), ''),
      (meta ->> 'condominio_id')::bigint,
      'PENDENTE'
    );

  elsif meta ->> 'tipo' = 'master' then
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

    update public."Masters" set condominio_id = v_cond where id = new.id;
  end if;

  return new;
end;
$$;

-- Nova solicitação de condomínio: avisa a equipe Dev
create or replace function private.tg_condominio_solicitado() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  dev uuid;
begin
  if new.status = 'PENDENTE' then
    for dev in select d.id from public.desenvolvedores d loop
      perform private.notificar(
        dev, new.id, 'NOVO_CONDOMINIO', 'Novo condomínio aguardando aprovação',
        format('%s — %s/%s.', new.nome, new.cidade, new.estado),
        'condominio', new.id::text, 'normal', new.master_id, 'Cadastro de condomínio');
    end loop;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_condominios_solicitado on public."Condominios";
create trigger trg_condominios_solicitado
  after insert on public."Condominios"
  for each row execute function private.tg_condominio_solicitado();

-- 4. RPCs do Dev ----------------------------------------------------------------
-- Ficha completa: condomínio + master (inclui e-mail, que fica em auth.users)
create or replace function public.condominios_para_revisao()
returns table (
  id bigint, nome text, endereco text, cidade text, estado text, status text,
  criado_em timestamptz, decidido_em timestamptz, motivo_recusa text,
  master_id uuid, master_nome text, master_email text, master_telefone text,
  master_documento text, master_criado_em timestamptz, total_moradores bigint
)
language sql stable security definer set search_path = '' as $$
  select c.id, c.nome::text, c.endereco::text, c.cidade, c.estado, c.status,
         c.created_at, c.decidido_em, c.motivo_recusa,
         m.id, m.nome::text, u.email::text, m.telefone::text, m.cpf_ou_cnpj::text, m.created_at,
         (select count(*) from public."Moradores" mo where mo.condominio_id = c.id)
  from public."Condominios" c
  left join public."Masters" m on m.id = c.master_id
  left join auth.users u on u.id = c.master_id
  where private.is_dev()
  order by c.created_at desc;
$$;

create or replace function public.decidir_condominio(p_condominio_id bigint, p_aprovar boolean, p_motivo text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  c      record;
  motivo text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
  if not private.is_dev() then
    raise exception 'Apenas a equipe Habitare pode aprovar condomínios' using errcode = '42501';
  end if;

  select * into c from public."Condominios" where id = p_condominio_id;
  if c.id is null then
    raise exception 'Condomínio não encontrado' using errcode = 'P0002';
  end if;
  if not p_aprovar and motivo is null then
    raise exception 'Informe o motivo da recusa' using errcode = '23514';
  end if;

  update public."Condominios"
  set status        = case when p_aprovar then 'ATIVO' else 'RECUSADO' end,
      decidido_em   = now(),
      decidido_por  = auth.uid(),
      motivo_recusa = case when p_aprovar then null else motivo end
  where id = p_condominio_id;

  perform private.notificar(
    c.master_id, c.id,
    case when p_aprovar then 'CONDOMINIO_APROVADO' else 'CONDOMINIO_RECUSADO' end,
    case when p_aprovar then 'Condomínio aprovado!' else 'Cadastro do condomínio recusado' end,
    case when p_aprovar then format('"%s" foi aprovado. Seu painel já está liberado.', c.nome)
         else format('"%s" não foi aprovado. Motivo: %s', c.nome, motivo) end,
    'condominio', c.id::text, 'normal', auth.uid(), 'Equipe Habitare');
end;
$$;

revoke execute on function public.condominios_para_revisao() from public, anon;
revoke execute on function public.decidir_condominio(bigint, boolean, text) from public, anon;
grant execute on function public.condominios_para_revisao() to authenticated;
grant execute on function public.decidir_condominio(bigint, boolean, text) to authenticated;

-- 5. meu_perfil(): perfil Dev e situação do condomínio do master -----------------
create or replace function public.meu_perfil() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  r   jsonb;
begin
  if uid is null then
    return null;
  end if;

  select jsonb_build_object('id', d.id, 'nome', d.nome, 'papel', 'DEV', 'status', 'ATIVO', 'condominio_id', null)
    into r
  from public.desenvolvedores d
  where d.id = uid;

  if r is null then
    select jsonb_build_object(
             'id', m.id, 'nome', m.nome, 'papel', 'MASTER',
             'status', coalesce(c.status, 'ATIVO'), 'motivo_recusa', c.motivo_recusa,
             'condominio_id', coalesce(c.id, m.condominio_id),
             'telefone', m.telefone, 'cpf', m.cpf_ou_cnpj)
      into r
    from public."Masters" m
    left join public."Condominios" c on c.master_id = m.id
    where m.id = uid
    limit 1;
  end if;

  if r is null then
    select jsonb_build_object(
             'id', f.id, 'nome', f.nome, 'papel', 'FUNCIONARIO', 'status', f.status,
             'condominio_id', f.condominio_id, 'cargo', f.cargo,
             'precisa_trocar_senha', f.precisa_trocar_senha,
             'especialidades', coalesce(
               (select jsonb_agg(e.categoria order by e.categoria)
                from public.funcionario_especialidades e where e.funcionario_id = f.id),
               '[]'::jsonb))
      into r
    from public."Funcionarios" f
    where f.id = uid;
  end if;

  if r is null then
    select jsonb_build_object(
             'id', m.id, 'nome', m.nome,
             'papel', case when exists (
                        select 1 from public."Gestao_Sindicos" g
                        where g.morador_id = m.id and g.condominio_id = m.condominio_id and g.ativo)
                      then 'SINDICO' else 'MORADOR' end,
             'status', m.status, 'condominio_id', m.condominio_id,
             'telefone', m.telefone, 'cpf', m.cpf, 'bloco', m.bloco, 'apartamento', m.apartamento)
      into r
    from public."Moradores" m
    where m.id = uid;
  end if;

  if r is null then
    return null;
  end if;

  return r || jsonb_build_object(
    'email', (select u.email from auth.users u where u.id = uid),
    'condominio_nome', (select c.nome from public."Condominios" c where c.id = (r ->> 'condominio_id')::bigint));
end;
$$;
