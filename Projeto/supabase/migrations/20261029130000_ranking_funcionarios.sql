-- Rankings da equipe no Dashboard (pedido do dono, 29/10/2026), calculados pelo histórico de status:
--   andamentos   = vezes que o próprio funcionário pôs uma ocorrência em andamento
--                  (atribuição feita pelo síndico não conta);
--   conclusoes   = ocorrências que o funcionário concluiu;
--   sem_concluir = ocorrências que ele pôs em andamento e não concluiu (ainda abertas ou concluídas por outra pessoa).
-- Só a gestão (síndico/Master) do condomínio consulta.
create or replace function public.ranking_funcionarios(p_condominio bigint)
returns table (funcionario_id uuid, nome text, andamentos integer, conclusoes integer, sem_concluir integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_gestor(p_condominio) then
    raise exception 'Só a gestão vê o ranking da equipe.' using errcode = '42501';
  end if;

  return query
  with h as (
    select x.ocorrencia_id, x.autor_id, x.autor_nome, x.status_novo
      from public.ocorrencia_historico x
     where x.condominio_id = p_condominio and x.autor_papel = 'FUNCIONARIO' and x.autor_id is not null
  ),
  andou as (select distinct ocorrencia_id, autor_id from h where status_novo = 'Em Andamento'),
  concluiu as (select distinct ocorrencia_id, autor_id from h where status_novo = 'Resolvida'),
  pessoas as (
    select h.autor_id, (array_agg(h.autor_nome order by h.autor_nome))[1] as nome_hist from h group by h.autor_id
  )
  select p.autor_id,
         coalesce(f.nome::text, p.nome_hist::text, 'Funcionário'),
         (select count(*) from h where h.autor_id = p.autor_id and h.status_novo = 'Em Andamento')::integer,
         (select count(*) from concluiu c where c.autor_id = p.autor_id)::integer,
         (select count(*) from andou a
           where a.autor_id = p.autor_id
             and not exists (select 1 from concluiu c where c.autor_id = a.autor_id and c.ocorrencia_id = a.ocorrencia_id))::integer
    from pessoas p
    left join public."Funcionarios" f on f.id = p.autor_id;
end;
$$;

revoke all on function public.ranking_funcionarios(bigint) from public, anon;
grant execute on function public.ranking_funcionarios(bigint) to authenticated;
