-- =============================================================================
-- Ajustes confirmados pelo dono em 23/09/2026:
--  * foto da prova obrigatória para concluir, para todos (inclusive síndico);
--  * ocorrência "Em Análise" só sai desse status pelo síndico/master
--    (nem o funcionário atribuído pode mudar).
-- =============================================================================

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
      new.morador_id         := uid;
      new.status             := 'Aberta';
      new.atribuido_a        := null;
      new.pronunciamento     := null;
      new.pronunciamento_em  := null;
      new.pronunciamento_por := null;
    end if;
    new.analise_em := null;           new.analise_por := null;
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
        if old.atribuido_a = uid then
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
      new.analise_em  := now();
      new.analise_por := uid;
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
