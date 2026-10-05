-- Blocos do condomínio (05/10/2026)
--
-- O master cadastra os blocos (no cadastro do condomínio e depois, na aba "Blocos do
-- condomínio"): nome (letra ou nome da torre), nº de andares e apartamentos por andar.
-- Numeração: andar + 2 dígitos (1201 = 12º andar, apto 01; 803 = 8º andar, apto 03).
-- Cadastro de morador e reclamação escolhem Bloco → Andar → Apartamento (nada digitado);
-- o banco confere se a unidade existe. Condomínios antigos sem blocos (testes) seguem
-- aceitando o texto como antes.

create table if not exists public.blocos (
  id              bigint generated always as identity primary key,
  condominio_id   bigint not null references public."Condominios"(id) on delete cascade,
  nome            text not null check (char_length(btrim(nome)) between 1 and 40),
  andares         integer not null check (andares between 1 and 99),
  aptos_por_andar integer not null check (aptos_por_andar between 1 and 99),
  created_at      timestamptz not null default now()
);

create unique index if not exists blocos_nome_unico on public.blocos (condominio_id, lower(btrim(nome)));

alter table public.blocos enable row level security;
revoke all on public.blocos from anon;

drop policy if exists blocos_select on public.blocos;
create policy blocos_select on public.blocos
  for select to authenticated
  using (private.is_master(condominio_id) or private.is_membro(condominio_id) or private.is_dev());

drop policy if exists blocos_insert on public.blocos;
create policy blocos_insert on public.blocos
  for insert to authenticated with check (private.is_master(condominio_id));

drop policy if exists blocos_delete on public.blocos;
create policy blocos_delete on public.blocos
  for delete to authenticated using (private.is_master(condominio_id));

-- Nome do bloco sem espaços sobrando
create or replace function private.tg_bloco_preparar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.nome := regexp_replace(btrim(new.nome), '\s+', ' ', 'g');
  return new;
end;
$$;

drop trigger if exists trg_blocos_preparar on public.blocos;
create trigger trg_blocos_preparar
  before insert on public.blocos
  for each row execute function private.tg_bloco_preparar();

-- Remover bloco: só sem moradores e nunca o último (a não ser apagando o condomínio)
create or replace function private.tg_bloco_remover()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public."Condominios" c where c.id = old.condominio_id) then
    return old; -- condomínio sendo apagado (cascata)
  end if;
  if exists (select 1 from public."Moradores" m
              where m.condominio_id = old.condominio_id and lower(btrim(m.bloco)) = lower(old.nome)) then
    raise exception 'Este bloco tem moradores cadastrados e não pode ser removido.' using errcode = 'P0001', hint = 'bloco';
  end if;
  if (select count(*) from public.blocos b where b.condominio_id = old.condominio_id) <= 1 then
    raise exception 'O condomínio precisa ter pelo menos um bloco.' using errcode = 'P0001', hint = 'bloco';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_blocos_remover on public.blocos;
create trigger trg_blocos_remover
  before delete on public.blocos
  for each row execute function private.tg_bloco_remover();

-- Unidade existe? Devolve o nome oficial do bloco (ou null). Apto = andar + 2 dígitos.
create or replace function private.unidade_valida(p_cond bigint, p_bloco text, p_apto text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select b.nome from public.blocos b
   where b.condominio_id = p_cond
     and lower(btrim(b.nome)) = lower(btrim(coalesce(p_bloco, '')))
     and btrim(coalesce(p_apto, '')) ~ '^[1-9][0-9]{2,3}$'
     and (btrim(p_apto)::int / 100) between 1 and b.andares
     and (btrim(p_apto)::int % 100) between 1 and b.aptos_por_andar
   limit 1;
$$;

create or replace function private.condominio_tem_blocos(p_cond bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.blocos b where b.condominio_id = p_cond);
$$;

-- Blocos para as telas de escolha (inclusive o cadastro de morador, antes do login)
create or replace function public.blocos_do_condominio(p_condominio_id bigint)
returns table(id bigint, nome text, andares integer, aptos_por_andar integer)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.nome, b.andares, b.aptos_por_andar
    from public.blocos b
    join public."Condominios" c on c.id = b.condominio_id
   where b.condominio_id = p_condominio_id
     and (c.status = 'ATIVO' or private.is_master(c.id) or private.is_dev())
   order by b.nome;
$$;

revoke all on function public.blocos_do_condominio(bigint) from public;
grant execute on function public.blocos_do_condominio(bigint) to anon, authenticated;

-- Cadastro (gatilho de novas contas): master já cria os blocos; morador escolhe unidade válida
create or replace function private.tg_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta    jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_cond  bigint;
  v_bloco text;
  v_apto  text;
begin
  if meta ->> 'tipo' = 'morador' then
    v_cond := (meta ->> 'condominio_id')::bigint;
    if not exists (select 1 from public."Condominios" c where c.id = v_cond and c.status = 'ATIVO') then
      raise exception 'Condomínio indisponível para cadastro' using errcode = '23514';
    end if;

    if private.condominio_tem_blocos(v_cond) then
      v_bloco := private.unidade_valida(v_cond, meta ->> 'bloco', meta ->> 'apartamento');
      if v_bloco is null then
        raise exception 'Escolha um bloco, andar e apartamento que existam no condomínio.' using errcode = '23514';
      end if;
      v_apto := btrim(meta ->> 'apartamento');
    else
      -- condomínios antigos, sem blocos cadastrados
      v_bloco := upper(nullif(btrim(meta ->> 'bloco'), ''));
      v_apto  := nullif(btrim(meta ->> 'apartamento'), '');
    end if;

    insert into public."Moradores" (id, nome, cpf, telefone, bloco, apartamento, condominio_id, status)
    values (
      new.id,
      nullif(btrim(meta ->> 'nome'), ''),
      nullif(btrim(meta ->> 'cpf'), ''),
      nullif(btrim(meta ->> 'telefone'), ''),
      v_bloco,
      v_apto,
      v_cond,
      'PENDENTE'
    );

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

    update public."Masters" set condominio_id = v_cond where id = new.id;
  end if;

  return new;
end;
$$;

-- Reclamação: apartamento denunciado precisa existir (condomínios com blocos)
create or replace function private.tg_reclamacao_unidade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bloco text;
begin
  if private.condominio_tem_blocos(new.condominio_id) then
    v_bloco := private.unidade_valida(new.condominio_id, new.bloco_denunciado, new.apartamento_denunciado);
    if v_bloco is null then
      raise exception 'Escolha um bloco, andar e apartamento que existam no condomínio.' using errcode = 'P0001', hint = 'unidade';
    end if;
    new.bloco_denunciado := v_bloco;
    new.apartamento_denunciado := btrim(new.apartamento_denunciado);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reclamacoes_unidade on public."Reclamacoes";
create trigger trg_reclamacoes_unidade
  before insert on public."Reclamacoes"
  for each row execute function private.tg_reclamacao_unidade();
