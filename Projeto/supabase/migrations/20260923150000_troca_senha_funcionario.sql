-- =============================================================================
-- Senha provisória do funcionário: o Master cria a conta com uma senha
-- provisória; o funcionário é avisado (notificação + aviso no painel) e troca.
-- =============================================================================

alter table public."Funcionarios"
  add column if not exists precisa_trocar_senha boolean not null default false;

-- Ao criar funcionário com senha provisória, notificação urgente para ele
create or replace function private.tg_funcionario_criado() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.precisa_trocar_senha then
    perform private.notificar(
      new.id, new.condominio_id, 'TROCAR_SENHA', 'Troque sua senha provisória',
      'Sua conta foi criada com uma senha provisória. Por segurança, defina uma nova senha.',
      'perfil', new.id::text, 'urgente', null, 'Sistema');
  end if;
  return null;
end;
$$;

drop trigger if exists trg_funcionarios_criado on public."Funcionarios";
create trigger trg_funcionarios_criado
  after insert on public."Funcionarios"
  for each row execute function private.tg_funcionario_criado();

-- Chamada pelo próprio funcionário depois de trocar a senha no Supabase Auth
create or replace function public.marcar_senha_trocada() returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public."Funcionarios" set precisa_trocar_senha = false where id = auth.uid();
  update public.notificacoes set lida = true
  where destinatario_id = auth.uid() and tipo = 'TROCAR_SENHA';
end;
$$;

revoke execute on function public.marcar_senha_trocada() from public, anon;
grant execute on function public.marcar_senha_trocada() to authenticated;

-- meu_perfil() passa a informar se o funcionário precisa trocar a senha
create or replace function public.meu_perfil() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  r   jsonb;
begin
  if uid is null then
    return null;
  end if;

  select jsonb_build_object(
           'id', m.id, 'nome', m.nome, 'papel', 'MASTER', 'status', 'ATIVO',
           'condominio_id', coalesce(c.id, m.condominio_id),
           'telefone', m.telefone, 'cpf', m.cpf_ou_cnpj)
    into r
  from public."Masters" m
  left join public."Condominios" c on c.master_id = m.id
  where m.id = uid
  limit 1;

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
