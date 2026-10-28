-- =============================================================================
-- Pedido 9 de 28/09/2026: coluna "cargo" removida dos funcionários — as
-- especialidades (categorias) já dizem o que cada um atende.
-- =============================================================================

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
             'condominio_id', f.condominio_id,
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

alter table public."Funcionarios" drop column if exists cargo;
