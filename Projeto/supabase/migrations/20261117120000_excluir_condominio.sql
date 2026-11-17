-- Excluir um condomínio apaga tudo o que é dele (Equipe Habitare, pela ficha do condomínio).
-- Reclamações e notificações eram NO ACTION e bloqueavam a exclusão: passam a CASCADE.
alter table public."Reclamacoes" drop constraint "Reclamacoes_condominio_id_fkey",
  add constraint "Reclamacoes_condominio_id_fkey" foreign key (condominio_id)
  references public."Condominios"(id) on delete cascade;
alter table public.notificacoes drop constraint notificacoes_condominio_id_fkey,
  add constraint notificacoes_condominio_id_fkey foreign key (condominio_id)
  references public."Condominios"(id) on delete cascade;

-- Apaga o condomínio (o resto sai em cascata) e as contas de login de quem era dele,
-- para não sobrar login sem perfil. Membros da Equipe Habitare nunca são apagados.
create or replace function public.excluir_condominio(p_condominio_id bigint)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_usuarios uuid[];
begin
  if not private.is_dev() then raise exception 'Apenas a Equipe Habitare exclui condomínios.'; end if;
  if not exists (select 1 from public."Condominios" where id = p_condominio_id) then
    raise exception 'Condomínio não encontrado.';
  end if;

  select array_agg(distinct u) into v_usuarios from (
    select id from public."Moradores"    where condominio_id = p_condominio_id
    union select id from public."Funcionarios" where condominio_id = p_condominio_id
    union select id from public."Masters"      where condominio_id = p_condominio_id
    union select master_id from public."Condominios" where id = p_condominio_id
  ) t(u)
  where u is not null and u not in (select id from public.desenvolvedores);

  delete from public."Condominios" where id = p_condominio_id;
  delete from public.notificacoes where destinatario_id = any(coalesce(v_usuarios, '{}'));
  delete from auth.users where id = any(coalesce(v_usuarios, '{}'));
end $$;

revoke all on function public.excluir_condominio(bigint) from public, anon;
grant execute on function public.excluir_condominio(bigint) to authenticated;
