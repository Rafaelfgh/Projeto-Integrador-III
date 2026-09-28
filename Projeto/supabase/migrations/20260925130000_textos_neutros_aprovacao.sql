-- Textos neutros: nenhuma mensagem vista por outros perfis cita a equipe de aprovação.

create or replace function public.decidir_condominio(p_condominio_id bigint, p_aprovar boolean, p_motivo text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  c      record;
  motivo text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
  if not private.is_dev() then
    raise exception 'Sem permissão para esta ação' using errcode = '42501';
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
    'condominio', c.id::text, 'normal', auth.uid(), 'Habitare');
end;
$$;
