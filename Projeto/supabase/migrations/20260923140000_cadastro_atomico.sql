-- =============================================================================
-- Cadastro atômico: o perfil (Morador, ou Master + Condomínio) é criado pelo
-- banco no mesmo INSERT da conta de login. Se o perfil falhar (CPF repetido,
-- campo faltando...), a conta também não é criada — sem contas órfãs.
-- O front envia os dados em signUp({ options: { data: { tipo, ... } } }).
-- =============================================================================

create or replace function private.tg_novo_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta   jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_cond bigint;
begin
  if meta ->> 'tipo' = 'morador' then
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

    insert into public."Condominios" (nome, endereco, cidade, estado, master_id)
    values (
      nullif(btrim(meta ->> 'condominio_nome'), ''),
      nullif(btrim(meta ->> 'endereco'), ''),
      nullif(btrim(meta ->> 'cidade'), ''),
      nullif(btrim(meta ->> 'estado'), ''),
      new.id
    )
    returning id into v_cond;

    update public."Masters" set condominio_id = v_cond where id = new.id;
  end if;
  -- Sem "tipo" (ex.: funcionário criado pela Edge Function): nada a fazer aqui

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.tg_novo_usuario();

-- Novo pedido de acesso: avisa o Master do condomínio
create or replace function private.tg_morador_cadastrado() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'PENDENTE' then
    perform private.notificar(
      (select c.master_id from public."Condominios" c where c.id = new.condominio_id),
      new.condominio_id, 'NOVO_CADASTRO', 'Novo pedido de acesso',
      format('%s (Bloco %s, Apt %s) pediu para entrar no condomínio.', new.nome, new.bloco, new.apartamento),
      'morador', new.id::text, 'normal', new.id, new.nome::text);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_moradores_cadastrado on public."Moradores";
create trigger trg_moradores_cadastrado
  after insert on public."Moradores"
  for each row execute function private.tg_morador_cadastrado();
