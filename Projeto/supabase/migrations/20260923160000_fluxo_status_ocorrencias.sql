-- =============================================================================
-- Fluxo de status das ocorrências (definido pelo dono em 23/09/2026)
--  * Síndico/Master: Em Análise, Em Andamento e Concluída. Atribuir um
--    funcionário leva a ocorrência para Em Andamento, com descrição do síndico.
--  * Funcionário: só Em Andamento e Concluída.
--      - atribuída a ele: só pode concluir;
--      - sem responsável (mural, da especialidade): pode colocar em andamento
--        e/ou concluir; qualquer um da especialidade pode concluir e o crédito
--        fica com quem concluiu.
--      - Em Andamento exige descrição; Concluída exige descrição + foto.
--  * Funcionário pode "convocar" o síndico para analisar.
--  * Andamento e conclusão ficam em colunas da própria ocorrência (visíveis a
--    quem vê a ocorrência, inclusive a foto da prova).
--  * Ocorrência "pessoal" (problema no apartamento): só autor, síndico e o
--    funcionário atribuído veem.
--  * Em andamento há mais de 2 dias: aviso ao síndico (pg_cron, de hora em hora).
-- =============================================================================

-- 1. Colunas de ciclo de vida na própria ocorrência ---------------------------
alter table public."Ocorrencias"
  add column if not exists analise_em           timestamptz,
  add column if not exists analise_por          uuid references auth.users (id) on delete set null,
  add column if not exists andamento_descricao  text check (char_length(andamento_descricao) <= 2000),
  add column if not exists andamento_em         timestamptz,
  add column if not exists andamento_por        uuid references auth.users (id) on delete set null,
  add column if not exists conclusao_descricao  text check (char_length(conclusao_descricao) <= 2000),
  add column if not exists conclusao_evidencias text[] not null default '{}',
  add column if not exists concluida_por        uuid references auth.users (id) on delete set null,
  add column if not exists atraso_notificado_em timestamptz;

create index if not exists ocorrencias_andamento_idx
  on public."Ocorrencias" (status, andamento_em) where status = 'Em Andamento';

-- 2. "sindico" passa a se chamar "pessoal" (problema no apartamento) ---------
alter table public."Ocorrencias" drop constraint if exists ocorrencias_privacidade_check;
update public."Ocorrencias" set privacidade = 'pessoal' where privacidade = 'sindico';
alter table public."Ocorrencias"
  add constraint ocorrencias_privacidade_check check (privacidade in ('mural', 'pessoal'));

-- 3. Preenche as colunas novas com o que já existe ----------------------------
update public."Ocorrencias" o
set andamento_descricao = h.descricao, andamento_em = h.created_at, andamento_por = h.autor_id
from (
  select distinct on (ocorrencia_id) ocorrencia_id, descricao, created_at, autor_id
  from public.ocorrencia_historico where status_novo = 'Em Andamento'
  order by ocorrencia_id, id desc
) h
where h.ocorrencia_id = o.id and o.andamento_em is null;

update public."Ocorrencias" o
set andamento_em = coalesce(o.updated_at, o.created_at), andamento_por = o.atribuido_a
where o.status = 'Em Andamento' and o.andamento_em is null;

update public."Ocorrencias" o
set conclusao_descricao  = h.descricao,
    conclusao_evidencias = h.evidencias,
    concluida_por        = h.autor_id
from (
  select distinct on (ocorrencia_id) ocorrencia_id, descricao, evidencias, autor_id
  from public.ocorrencia_historico where status_novo = 'Resolvida'
  order by ocorrencia_id, id desc
) h
where h.ocorrencia_id = o.id and o.status = 'Resolvida';

update public."Ocorrencias" o
set concluida_por = o.atribuido_a
where o.status = 'Resolvida' and o.concluida_por is null;

-- As antigas já contam como avisadas (evita uma enxurrada de notificações);
-- elas continuam aparecendo na aba do síndico.
update public."Ocorrencias"
set atraso_notificado_em = now()
where status = 'Em Andamento' and andamento_em < now() - interval '2 days';

-- 4. Quem recebe avisos de gestão: síndico ativo; se não houver, o Master -----
create or replace function private.gestores_para_notificar(cond bigint) returns setof uuid
language sql stable security definer set search_path = '' as $$
  select g.morador_id from public."Gestao_Sindicos" g where g.condominio_id = cond and g.ativo
  union all
  select c.master_id from public."Condominios" c
  where c.id = cond
    and not exists (select 1 from public."Gestao_Sindicos" g where g.condominio_id = cond and g.ativo);
$$;

create or replace function private.unidade_do_morador(mid uuid) returns text
language sql stable security definer set search_path = '' as $$
  select format('Bloco %s, Apt %s', m.bloco, m.apartamento) from public."Moradores" m where m.id = mid;
$$;

-- 5. Guarda: quem pode mudar o quê + colunas de ciclo de vida ----------------
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

        if new.status = 'Resolvida' and cardinality(evid) = 0 then
          raise exception 'Para concluir, anexe ao menos uma foto como prova' using errcode = '23514';
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

-- 6. Nova ocorrência -----------------------------------------------------------
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
    format('Sua ocorrência "%s" foi registrada e aguarda análise.', new.titulo),
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

-- 7. Ocorrência alterada: histórico + notificações ----------------------------
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
       case new.status when 'Em Andamento' then new.andamento_descricao
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

-- 8. Reclamação: também cai no Master se não houver síndico -----------------
create or replace function private.tg_reclamacao_criada() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  destino uuid;
begin
  for destino in select * from private.gestores_para_notificar(new.condominio_id) loop
    if destino is distinct from new.morador_id then
      perform private.notificar(
        destino, new.condominio_id, 'NOVA_RECLAMACAO', 'Nova reclamação particular',
        format('Reclamação sigilosa sobre o Bloco %s, Apt %s.', new.bloco_denunciado, new.apartamento_denunciado),
        'reclamacao', new.id::text, 'normal', null, 'Morador anônimo');
    end if;
  end loop;
  return null;
end;
$$;

-- 9. Funcionário: pode agir no que é dele ou no mural da especialidade sem dono
drop policy if exists ocorrencias_update_funcionario on public."Ocorrencias";
create policy ocorrencias_update_funcionario on public."Ocorrencias"
  for update to authenticated
  using (
    private.is_funcionario(condominio_id)
    and (atribuido_a = (select auth.uid())
         or (atribuido_a is null and privacidade = 'mural' and status in ('Aberta', 'Em Andamento')
             and exists (select 1 from public.funcionario_especialidades e
                         where e.funcionario_id = (select auth.uid()) and e.categoria = "Ocorrencias".categoria)))
  )
  with check (private.is_funcionario(condominio_id));

-- 10. Foto da prova: quem vê a ocorrência vê a prova -------------------------
create or replace function private.pode_ver_evidencia(caminho text) returns boolean
language plpgsql stable security invoker set search_path = '' as $$
declare
  cond text := split_part(caminho, '/', 1);
  oc   text := split_part(caminho, '/', 2);
begin
  if cond !~ '^\d+$' or oc !~ '^\d+$' then
    return false;
  end if;
  -- security invoker: o RLS de Ocorrencias decide se esta pessoa vê a ocorrência
  return exists (
    select 1 from public."Ocorrencias" o where o.id = oc::bigint and o.condominio_id = cond::bigint
  );
end;
$$;

drop policy if exists evidencias_select on storage.objects;
create policy evidencias_select on storage.objects
  for select to authenticated
  using (bucket_id = 'evidencias' and private.pode_ver_evidencia(name));

-- 11. RPCs ------------------------------------------------------------------
-- Síndico atribui um funcionário: vai para Em Andamento com a descrição dele
create or replace function public.atribuir_ocorrencia(p_ocorrencia_id bigint, p_funcionario_id uuid, p_descricao text)
returns void
language plpgsql security invoker set search_path = '' as $$
begin
  perform set_config('app.hist_descricao', coalesce(p_descricao, ''), true);
  perform set_config('app.hist_evidencias', '[]', true);

  update public."Ocorrencias"
  set atribuido_a = p_funcionario_id
  where id = p_ocorrencia_id and atribuido_a is distinct from p_funcionario_id;

  if not found then
    raise exception 'Ocorrência não encontrada, sem permissão ou já atribuída a este funcionário' using errcode = '42501';
  end if;
end;
$$;

-- Funcionário chama o síndico para analisar a ocorrência
create or replace function public.convocar_sindico(p_ocorrencia_id bigint, p_mensagem text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := auth.uid();
  oc      record;
  nome    text;
  destino uuid;
begin
  select o.id, o.titulo, o.condominio_id, o.atribuido_a, o.privacidade
    into oc
  from public."Ocorrencias" o
  where o.id = p_ocorrencia_id;

  if oc.id is null
     or not private.is_funcionario(oc.condominio_id)
     or not (oc.privacidade = 'mural' or oc.atribuido_a = uid) then
    raise exception 'Sem permissão para esta ocorrência' using errcode = '42501';
  end if;

  nome := coalesce(private.nome_usuario(uid), 'Funcionário');
  for destino in select * from private.gestores_para_notificar(oc.condominio_id) loop
    perform private.notificar(
      destino, oc.condominio_id, 'ANALISE_SOLICITADA', 'Funcionário pede sua análise',
      format('%s pediu que você analise "%s"%s', nome, oc.titulo,
             coalesce(': ' || nullif(btrim(p_mensagem), ''), '.')),
      'ocorrencia', oc.id::text, 'urgente', uid, nome);
  end loop;
end;
$$;

revoke execute on function public.atribuir_ocorrencia(bigint, uuid, text) from public, anon;
revoke execute on function public.convocar_sindico(bigint, text) from public, anon;
grant execute on function public.atribuir_ocorrencia(bigint, uuid, text) to authenticated;
grant execute on function public.convocar_sindico(bigint, text) to authenticated;

-- 12. Andamento há mais de 2 dias: aviso ao síndico (uma vez por andamento) --
create extension if not exists pg_cron;

create or replace function private.verificar_andamento_prolongado() returns void
language plpgsql security definer set search_path = '' as $$
declare
  oc      record;
  quem    text;
  destino uuid;
begin
  for oc in
    select o.id, o.titulo, o.condominio_id, o.andamento_em, o.andamento_por
    from public."Ocorrencias" o
    where o.status = 'Em Andamento'
      and o.andamento_em < now() - interval '2 days'
      and o.atraso_notificado_em is null
  loop
    quem := coalesce(private.nome_usuario(oc.andamento_por), 'não informado');
    for destino in select * from private.gestores_para_notificar(oc.condominio_id) loop
      perform private.notificar(
        destino, oc.condominio_id, 'ANDAMENTO_PROLONGADO', 'Em andamento há mais de 2 dias',
        format('"%s" está em andamento desde %s (colocada em andamento por %s).',
               oc.titulo, to_char(oc.andamento_em at time zone 'America/Sao_Paulo', 'DD/MM "às" HH24:MI'), quem),
        'ocorrencia', oc.id::text, 'normal', null, 'Sistema');
    end loop;
    update public."Ocorrencias" set atraso_notificado_em = now() where id = oc.id;
  end loop;
end;
$$;

select cron.schedule(
  'ocorrencias-andamento-prolongado',
  '0 * * * *',
  'select private.verificar_andamento_prolongado()'
);
