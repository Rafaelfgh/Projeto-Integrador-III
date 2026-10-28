-- =============================================================================
-- Pedidos de 28/09/2026
--  1. Funcionário pede análise → a ocorrência vai para "Em Análise" (com motivo)
--  5. Síndico não registra ocorrência pessoal
--  9. Coluna "cargo" removida dos funcionários (especialidades substituem)
-- 10. Ocorrência pessoal nasce "Em Análise"
--  +  contadores para as bolinhas do menu do síndico
-- =============================================================================

alter table public."Ocorrencias"
  add column if not exists analise_motivo text check (char_length(analise_motivo) <= 500);

create or replace function private.tg_ocorrencia_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  uid          uuid := auth.uid();
  descr        text := nullif(btrim(coalesce(current_setting('app.hist_descricao', true), '')), '');
  evid         text[] := '{}';
  gestor       boolean;
  reatribuicao boolean;
begin
  if tg_op = 'INSERT' then
    if uid is not null then
      if new.privacidade = 'pessoal' and private.is_sindico(new.condominio_id) then
        raise exception 'O síndico não registra ocorrências pessoais' using errcode = '42501';
      end if;
      new.morador_id         := uid;
      -- Pessoal (dentro do apartamento) já nasce em análise pelo síndico
      new.status             := case when new.privacidade = 'pessoal' then 'Em Análise' else 'Aberta' end;
      new.atribuido_a        := null;
      new.pronunciamento     := null;
      new.pronunciamento_em  := null;
      new.pronunciamento_por := null;
    end if;
    new.analise_em     := case when new.status = 'Em Análise' then now() end;
    new.analise_por    := null;
    new.analise_motivo := null;
    new.andamento_descricao := null;  new.andamento_em := null;  new.andamento_por := null;
    new.conclusao_descricao := null;  new.conclusao_evidencias := '{}';
    new.concluida_em := null;         new.concluida_por := null;
    new.atraso_notificado_em := null;
    return new;
  end if;

  -- Fotos só valem se estiverem na pasta desta ocorrência: <condominio>/<ocorrencia>/...
  select coalesce(array_agg(x), '{}') into evid
  from json_array_elements_text(coalesce(nullif(current_setting('app.hist_evidencias', true), ''), '[]')::json) as t(x)
  where x like old.condominio_id || '/' || old.id || '/%';

  reatribuicao := new.atribuido_a is not null and new.atribuido_a is distinct from old.atribuido_a;

  if uid is not null then
    new.id            := old.id;
    new.condominio_id := old.condominio_id;
    new.morador_id    := old.morador_id;
    new.created_at    := old.created_at;
    -- As colunas de ciclo de vida só mudam pelas regras abaixo
    new.analise_em := old.analise_em;                   new.analise_por := old.analise_por;
    new.analise_motivo := old.analise_motivo;
    new.andamento_descricao := old.andamento_descricao; new.andamento_em := old.andamento_em;
    new.andamento_por := old.andamento_por;
    new.conclusao_descricao := old.conclusao_descricao; new.conclusao_evidencias := old.conclusao_evidencias;
    new.concluida_em := old.concluida_em;               new.concluida_por := old.concluida_por;
    new.atraso_notificado_em := old.atraso_notificado_em;

    gestor := private.is_gestor(old.condominio_id);

    if gestor then
      if reatribuicao then
        if old.status = 'Resolvida' then
          raise exception 'Ocorrência já concluída' using errcode = '42501';
        end if;
        if not exists (
          select 1 from public."Funcionarios" f
          where f.id = new.atribuido_a and f.condominio_id = old.condominio_id and f.status = 'ATIVO'
        ) then
          raise exception 'Funcionário inválido para este condomínio' using errcode = '23503';
        end if;
        new.status := 'Em Andamento';
      end if;

    elsif private.is_funcionario(old.condominio_id) then
      new.titulo      := old.titulo;
      new.descricao   := old.descricao;
      new.categoria   := old.categoria;
      new.privacidade := old.privacidade;
      new.anexos      := old.anexos;

      if new.pronunciamento is distinct from old.pronunciamento then
        raise exception 'Apenas o síndico pode se pronunciar sobre a ocorrência' using errcode = '42501';
      end if;
      if new.atribuido_a is distinct from old.atribuido_a then
        raise exception 'Apenas o síndico atribui ocorrências' using errcode = '42501';
      end if;

      if new.status is distinct from old.status then
        if old.status = 'Em Análise' then
          raise exception 'Em análise pelo síndico: só ele pode mudar o status' using errcode = '42501';
        end if;
        -- Pedido de análise feito pelo funcionário (só pela RPC convocar_sindico)
        if new.status = 'Em Análise' then
          if coalesce(current_setting('app.convocacao', true), '') <> '1' then
            raise exception 'Use "Chamar síndico para análise"' using errcode = '42501';
          end if;
        elsif old.atribuido_a = uid then
          if new.status <> 'Resolvida' then
            raise exception 'Ocorrência atribuída a você: só é possível concluir' using errcode = '42501';
          end if;
        elsif old.atribuido_a is null then
          if old.status not in ('Aberta', 'Em Andamento') or new.status not in ('Em Andamento', 'Resolvida') then
            raise exception 'Funcionário só pode colocar em andamento ou concluir' using errcode = '42501';
          end if;
        else
          raise exception 'Ocorrência atribuída a outro funcionário' using errcode = '42501';
        end if;

      end if;

    else
      raise exception 'Sem permissão para alterar esta ocorrência' using errcode = '42501';
    end if;

    -- Em Andamento e Concluída sempre levam descrição
    if (new.status is distinct from old.status and new.status in ('Em Andamento', 'Resolvida')) or reatribuicao then
      if descr is null or char_length(descr) < 5 then
        raise exception 'Descreva o que está sendo ou foi feito (mínimo de 5 caracteres)' using errcode = '23514';
      end if;
    end if;

    -- Concluir sempre exige foto da prova (síndico, master ou funcionário)
    if new.status is distinct from old.status and new.status = 'Resolvida' and cardinality(evid) = 0 then
      raise exception 'Para concluir, anexe ao menos uma foto como prova' using errcode = '23514';
    end if;
  end if;

  if new.pronunciamento is distinct from old.pronunciamento then
    new.pronunciamento     := nullif(btrim(new.pronunciamento), '');
    new.pronunciamento_em  := case when new.pronunciamento is null then null else now() end;
    new.pronunciamento_por := case when new.pronunciamento is null then null else uid end;
  end if;

  if new.status is distinct from old.status or reatribuicao then
    if new.status = 'Em Análise' then
      new.analise_em     := now();
      new.analise_por    := uid;
      new.analise_motivo := descr;
    elsif new.status = 'Em Andamento' then
      new.andamento_descricao  := descr;
      new.andamento_em         := now();
      new.andamento_por        := uid;
      new.atraso_notificado_em := null;
    elsif new.status = 'Resolvida' then
      new.conclusao_descricao  := descr;
      new.conclusao_evidencias := evid;
      new.concluida_em         := now();
      new.concluida_por        := uid;
    end if;

    if new.status <> 'Resolvida' then
      new.conclusao_descricao  := null;
      new.conclusao_evidencias := '{}';
      new.concluida_em         := null;
      new.concluida_por        := null;
    end if;
  end if;

  return new;
end;
$$;


-- Ocorrência alterada: histórico passa a guardar também o motivo da análise
create or replace function private.tg_ocorrencia_atualizada() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := auth.uid();
  ator    text := coalesce(private.nome_usuario(auth.uid()), 'Administração');
  unidade text := private.unidade_do_morador(new.morador_id);
  destino uuid;
begin
  -- Atribuição feita pelo síndico = urgente (pessoal avisa o apartamento)
  if new.atribuido_a is not null
     and new.atribuido_a is distinct from old.atribuido_a
     and new.atribuido_a is distinct from uid then
    perform private.notificar(
      new.atribuido_a, new.condominio_id, 'TAREFA_ATRIBUIDA',
      case when new.privacidade = 'pessoal'
           then 'Tarefa no apartamento: ' || coalesce(unidade, 'unidade do morador')
           else 'Tarefa atribuída pelo síndico' end,
      format('%s atribuiu a você: "%s"%s.%s', ator, new.titulo,
             case when new.privacidade = 'pessoal' then ' — no apartamento (' || coalesce(unidade, '?') || ')' else '' end,
             coalesce(' ' || new.andamento_descricao, '')),
      'ocorrencia', new.id::text, 'urgente', uid, ator);
  end if;

  if new.status is distinct from old.status or new.atribuido_a is distinct from old.atribuido_a then
    insert into public.ocorrencia_historico
      (ocorrencia_id, condominio_id, autor_id, autor_nome, autor_papel, status_anterior, status_novo, descricao, evidencias)
    values
      (new.id, new.condominio_id, uid, ator, private.papel_usuario(uid, new.condominio_id),
       old.status, new.status,
       case new.status when 'Em Análise'   then new.analise_motivo
                       when 'Em Andamento' then new.andamento_descricao
                       when 'Resolvida'    then new.conclusao_descricao end,
       case when new.status = 'Resolvida' then new.conclusao_evidencias else '{}' end);
  end if;

  perform set_config('app.hist_descricao', '', true);
  perform set_config('app.hist_evidencias', '', true);

  if new.status is distinct from old.status then
    if new.status in ('Em Análise', 'Em Andamento', 'Resolvida') and new.morador_id is distinct from uid then
      perform private.notificar(
        new.morador_id, new.condominio_id, 'STATUS_OCORRENCIA',
        case new.status when 'Resolvida'  then 'Sua ocorrência foi concluída'
                        when 'Em Análise' then 'Sua ocorrência está em análise'
                        else 'Sua ocorrência está em andamento' end,
        format('"%s" agora está %s.%s', new.titulo,
               case new.status when 'Resolvida' then 'concluída' when 'Em Análise' then 'em análise' else 'em andamento' end,
               coalesce(' ' || case new.status when 'Em Andamento' then new.andamento_descricao
                                               when 'Resolvida'    then new.conclusao_descricao end, '')),
        'ocorrencia', new.id::text, 'normal', uid, ator);
    end if;

    if new.status = 'Resolvida' then
      for destino in select * from private.gestores_para_notificar(new.condominio_id) loop
        if destino is distinct from uid then
          perform private.notificar(
            destino, new.condominio_id, 'TAREFA_FINALIZADA', 'Ocorrência concluída',
            format('%s concluiu "%s".', ator, new.titulo),
            'ocorrencia', new.id::text, 'normal', uid, ator);
        end if;
      end loop;
    end if;
  end if;

  if new.pronunciamento is not null
     and new.pronunciamento is distinct from old.pronunciamento
     and new.morador_id is distinct from uid then
    perform private.notificar(
      new.morador_id, new.condominio_id, 'PRONUNCIAMENTO_SINDICO', 'O síndico se pronunciou',
      format('Há um pronunciamento do síndico sobre "%s".', new.titulo),
      'ocorrencia', new.id::text, 'normal', uid, ator);
  end if;

  return null;
end;
$$;

-- Nova ocorrência: mensagem própria para a pessoal (já em análise)
create or replace function private.tg_ocorrencia_criada() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  autor     text := coalesce(private.nome_usuario(new.morador_id), 'Morador');
  categoria text := coalesce((select nome from public.categorias_ocorrencia where slug = new.categoria), new.categoria);
  destino   uuid;
  r         record;
begin
  perform private.notificar(
    new.morador_id, new.condominio_id, 'OCORRENCIA_RECEBIDA', 'Ocorrência registrada',
    case when new.privacidade = 'pessoal'
         then format('Sua ocorrência "%s" foi recebida e está em análise pelo síndico.', new.titulo)
         else format('Sua ocorrência "%s" foi registrada e aguarda análise.', new.titulo) end,
    'ocorrencia', new.id::text);

  for destino in select * from private.gestores_para_notificar(new.condominio_id) loop
    if destino is distinct from new.morador_id then
      if new.privacidade = 'pessoal' then
        perform private.notificar(
          destino, new.condominio_id, 'NOVA_OCORRENCIA', 'Nova ocorrência pessoal',
          format('%s (%s) registrou "%s" (%s) no próprio apartamento.',
                 autor, private.unidade_do_morador(new.morador_id), new.titulo, categoria),
          'ocorrencia', new.id::text, 'normal', new.morador_id, autor);
      else
        perform private.notificar(
          destino, new.condominio_id, 'NOVA_OCORRENCIA', 'Nova ocorrência registrada',
          format('%s registrou "%s" (%s).', autor, new.titulo, categoria),
          'ocorrencia', new.id::text, 'normal', new.morador_id, autor);
      end if;
    end if;
  end loop;

  -- Pessoais não vão para o mural dos funcionários: o síndico encaminha
  if new.privacidade = 'mural' then
    for r in
      select f.id from public."Funcionarios" f
      join public.funcionario_especialidades e on e.funcionario_id = f.id
      where f.condominio_id = new.condominio_id and f.status = 'ATIVO' and e.categoria = new.categoria
    loop
      perform private.notificar(
        r.id, new.condominio_id, 'OCORRENCIA_ESPECIALIDADE', 'Nova ocorrência na sua especialidade',
        format('"%s" (%s) foi aberta e pode ser atendida por você.', new.titulo, categoria),
        'ocorrencia', new.id::text, 'normal', new.morador_id, autor);
    end loop;
  end if;

  return null;
end;
$$;

-- Funcionário chama o síndico: a ocorrência vai para "Em Análise" e o síndico é avisado.
-- Só vale para ocorrências que ele pode atender (atribuída a ele, ou do mural da
-- especialidade dele sem responsável) e que estejam Abertas ou Em Andamento.
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

-- Contadores das bolinhas do menu (RLS decide o que cada um enxerga)
create or replace function public.contadores_gestao()
returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'analise',  (select count(*) from public."Ocorrencias" where status = 'Em Análise' and privacidade = 'mural'),
    'pessoais', (select count(*) from public."Ocorrencias" where status = 'Em Análise' and privacidade = 'pessoal')
  );
$$;

revoke execute on function public.contadores_gestao() from public, anon;
grant execute on function public.contadores_gestao() to authenticated;

-- Pessoais que já existiam e estavam "Aberta" passam a "Em Análise"
update public."Ocorrencias" set status = 'Em Análise' where privacidade = 'pessoal' and status = 'Aberta';
