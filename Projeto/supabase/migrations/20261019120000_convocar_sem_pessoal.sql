-- 19/10: funcionário não pede análise do síndico em ocorrência pessoal (já veio encaminhada por ele)
create or replace function public.convocar_sindico(p_ocorrencia_id bigint, p_mensagem text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := auth.uid();
  oc      record;
  nome    text;
  motivo  text := nullif(btrim(coalesce(p_mensagem, '')), '');
  destino uuid;
begin
  select o.id, o.titulo, o.condominio_id, o.atribuido_a, o.privacidade, o.categoria, o.status
    into oc
  from public."Ocorrencias" o
  where o.id = p_ocorrencia_id;

  if oc.id is null
     or not private.is_funcionario(oc.condominio_id)
     or not (oc.atribuido_a = uid
             or (oc.atribuido_a is null and oc.privacidade = 'mural'
                 and exists (select 1 from public.funcionario_especialidades e
                             where e.funcionario_id = uid and e.categoria = oc.categoria))) then
    raise exception 'Sem permissão para esta ocorrência' using errcode = '42501';
  end if;
  -- Pessoal: o síndico já analisou e encaminhou ao funcionário; não volta para análise
  if oc.privacidade = 'pessoal' then
    raise exception 'Ocorrência pessoal já foi analisada pelo síndico' using errcode = '23514';
  end if;
  if oc.status not in ('Aberta', 'Em Andamento') then
    raise exception 'Só é possível pedir análise de ocorrências abertas ou em andamento' using errcode = '23514';
  end if;

  perform set_config('app.convocacao', '1', true);
  perform set_config('app.hist_descricao', coalesce(motivo, ''), true);
  perform set_config('app.hist_evidencias', '[]', true);
  update public."Ocorrencias" set status = 'Em Análise' where id = oc.id;
  perform set_config('app.convocacao', '', true);

  nome := coalesce(private.nome_usuario(uid), 'Funcionário');
  for destino in select * from private.gestores_para_notificar(oc.condominio_id) loop
    perform private.notificar(
      destino, oc.condominio_id, 'ANALISE_SOLICITADA', 'Ocorrência enviada para análise',
      format('%s pediu sua análise em "%s"%s', nome, oc.titulo, coalesce(': ' || motivo, '.')),
      'ocorrencia', oc.id::text, 'urgente', uid, nome);
  end loop;
end;
$$;

revoke execute on function public.convocar_sindico(bigint, text) from public, anon;
grant execute on function public.convocar_sindico(bigint, text) to authenticated;
