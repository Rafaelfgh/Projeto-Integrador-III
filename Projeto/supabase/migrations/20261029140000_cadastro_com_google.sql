-- Login com Google (decisões do dono, 29/10/2026)
-- Morador/síndico: entra com Google e, no 1º acesso, completa o cadastro de morador
-- (o e-mail vem do Google). O perfil fica com o mesmo id da conta, então nos próximos
-- logins o sistema já encontra o perfil. Cadastro com e-mail e senha continua igual.

-- Criação do perfil de morador em uma função só (usada no cadastro com senha e no com Google)
create or replace function private.criar_morador(p_id uuid, meta jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cond  bigint := (meta ->> 'condominio_id')::bigint;
  v_bloco text;
  v_apto  text;
begin
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
    v_bloco := upper(nullif(btrim(meta ->> 'bloco'), ''));
    v_apto  := nullif(btrim(meta ->> 'apartamento'), '');
  end if;

  insert into public."Moradores" (id, nome, cpf, telefone, bloco, apartamento, condominio_id, status)
  values (
    p_id,
    nullif(btrim(meta ->> 'nome'), ''),
    nullif(btrim(meta ->> 'cpf'), ''),
    nullif(btrim(meta ->> 'telefone'), ''),
    v_bloco,
    v_apto,
    v_cond,
    'PENDENTE'
  );
end;
$$;

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

    update public."Masters" set condominio_id = v_cond where id = new.id;
  end if;
  -- Conta criada pelo Google: sem 'tipo' — o perfil é criado depois, em completar_cadastro_morador

  return new;
end;
$$;

-- 1º acesso com Google: cria o perfil de morador (PENDENTE) para a conta logada
create or replace function public.completar_cadastro_morador(dados jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Entre com a sua conta antes de completar o cadastro.' using errcode = '42501';
  end if;
  if exists (select 1 from public."Moradores" where id = uid)
     or exists (select 1 from public."Funcionarios" where id = uid)
     or exists (select 1 from public."Masters" where id = uid)
     or exists (select 1 from public.desenvolvedores where id = uid) then
    raise exception 'Esta conta já tem cadastro no Habitare.' using errcode = 'P0001', hint = 'ja_cadastrado';
  end if;
  perform private.criar_morador(uid, dados);
end;
$$;

revoke all on function public.completar_cadastro_morador(jsonb) from public, anon;
grant execute on function public.completar_cadastro_morador(jsonb) to authenticated;
