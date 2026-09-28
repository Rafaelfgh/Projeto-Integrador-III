-- =============================================================================
-- Habitare — segurança (RLS por papel), categorias e especialidades,
-- comentários, pronunciamento do síndico, histórico com provas e
-- notificações automáticas por trigger.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Schema privado para funções auxiliares (não é exposto pela API REST)
-- -----------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;

-- -----------------------------------------------------------------------------
-- 1. Funções de papel. SECURITY DEFINER para não cair em recursão de RLS.
--    O vínculo Master -> condomínio vale por Condominios.master_id (único),
--    nunca por Masters.condominio_id (que o próprio master pode editar).
-- -----------------------------------------------------------------------------
create or replace function private.is_master(cond bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public."Condominios" c where c.id = cond and c.master_id = auth.uid());
$$;

create or replace function private.is_sindico(cond bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public."Gestao_Sindicos" g
    join public."Moradores" m on m.id = g.morador_id
    where g.morador_id = auth.uid() and g.condominio_id = cond and g.ativo and m.status = 'ATIVO'
  );
$$;

create or replace function private.is_funcionario(cond bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public."Funcionarios" f
    where f.id = auth.uid() and f.condominio_id = cond and f.status = 'ATIVO'
  );
$$;

create or replace function private.is_morador(cond bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public."Moradores" m
    where m.id = auth.uid() and m.condominio_id = cond and m.status = 'ATIVO'
  );
$$;

-- Master ou síndico
create or replace function private.is_gestor(cond bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_master(cond) or private.is_sindico(cond);
$$;

-- Qualquer pessoa ativa do condomínio
create or replace function private.is_membro(cond bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_master(cond) or private.is_morador(cond) or private.is_funcionario(cond);
$$;

create or replace function private.condominio_do_funcionario(fid uuid) returns bigint
language sql stable security definer set search_path = '' as $$
  select condominio_id from public."Funcionarios" where id = fid;
$$;

create or replace function private.nome_usuario(uid uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select nome::text from public."Moradores" where id = uid),
    (select nome::text from public."Funcionarios" where id = uid),
    (select nome::text from public."Masters" where id = uid)
  );
$$;

create or replace function private.papel_usuario(uid uuid, cond bigint) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when uid is null then 'SISTEMA'
    when exists (select 1 from public."Condominios" c where c.id = cond and c.master_id = uid) then 'MASTER'
    when exists (select 1 from public."Gestao_Sindicos" g where g.morador_id = uid and g.condominio_id = cond and g.ativo) then 'SINDICO'
    when exists (select 1 from public."Funcionarios" f where f.id = uid) then 'FUNCIONARIO'
    else 'MORADOR'
  end;
$$;

-- Caminho no bucket "evidencias": <condominio_id>/<ocorrencia_id>/<arquivo>
create or replace function private.pode_acessar_evidencia(caminho text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  pasta text := split_part(caminho, '/', 1);
begin
  if pasta !~ '^\d+$' then
    return false;
  end if;
  return private.is_gestor(pasta::bigint) or private.is_funcionario(pasta::bigint);
end;
$$;

create or replace function private.notificar(
  p_dest uuid, p_cond bigint, p_tipo text, p_titulo text, p_descricao text,
  p_ref_tipo text, p_ref_id text, p_prioridade text default 'normal',
  p_rem_id uuid default null, p_rem_nome text default null
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_dest is null then
    return;
  end if;
  insert into public.notificacoes
    (destinatario_id, condominio_id, tipo, titulo, descricao, referencia_tipo, referencia_id, prioridade, remetente_id, remetente_nome)
  values
    (p_dest, p_cond, p_tipo, p_titulo, p_descricao, p_ref_tipo, p_ref_id, p_prioridade, p_rem_id, p_rem_nome);
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Ajustes de colunas e restrições nas tabelas existentes
-- -----------------------------------------------------------------------------
-- IDs e FKs não devem ter valor aleatório como padrão
alter table public."Masters"      alter column id drop default;
alter table public."Moradores"    alter column id drop default;
alter table public."Funcionarios" alter column id drop default;
alter table public."Condominios"  alter column master_id drop default;
alter table public."Ocorrencias"  alter column morador_id drop default;
alter table public."Reclamacoes"  alter column morador_id drop default;
alter table public."Reclamacoes"  alter column condominio_id set not null;

-- Um único síndico ativo por condomínio
create unique index if not exists gestao_sindicos_um_ativo
  on public."Gestao_Sindicos" (condominio_id) where ativo;

-- Notificações: prioridade (síndico atribuindo = urgente)
alter table public.notificacoes
  add column if not exists prioridade text not null default 'normal'
  check (prioridade in ('normal', 'urgente'));
create index if not exists notificacoes_destinatario_idx
  on public.notificacoes (destinatario_id, criado_em desc);

-- -----------------------------------------------------------------------------
-- 3. Categorias de ocorrência (lista fixa) e especialidades de funcionário
-- -----------------------------------------------------------------------------
create table if not exists public.categorias_ocorrencia (
  slug      text primary key,
  nome      text not null,
  descricao text,
  icone     text not null default '📋',
  ordem     smallint not null default 0,
  ativo     boolean not null default true
);

insert into public.categorias_ocorrencia (slug, nome, descricao, icone, ordem) values
  ('hidraulica',   'Hidráulica',            'Vazamentos, encanamento',          '💧', 1),
  ('eletrica',     'Elétrica',              'Iluminação, tomadas, quadros',     '⚡', 2),
  ('manutencao',   'Manutenção',            'Reparos gerais',                   '🔧', 3),
  ('limpeza',      'Limpeza',               'Áreas comuns',                     '🧹', 4),
  ('jardinagem',   'Jardinagem',            'Jardim, paisagismo',               '🌿', 5),
  ('seguranca',    'Segurança',             'Câmeras, portaria',                '🛡️', 6),
  ('areas_comuns', 'Áreas Comuns',          'Salão, piscina, academia',         '🏢', 7),
  ('estrutural',   'Estrutural',            'Rachaduras, infiltração',          '🏗️', 8),
  ('garagem',      'Garagem',               'Estacionamento, portões',          '🅿️', 9),
  ('barulho',      'Barulho / Perturbação', 'Som alto, perturbação do sossego', '🔊', 10)
on conflict (slug) do nothing;

alter table public."Ocorrencias" alter column categoria type text;
alter table public."Ocorrencias"
  add constraint ocorrencias_categoria_fkey
  foreign key (categoria) references public.categorias_ocorrencia (slug) on update cascade;

create table if not exists public.funcionario_especialidades (
  funcionario_id uuid not null references public."Funcionarios" (id) on delete cascade,
  categoria      text not null references public.categorias_ocorrencia (slug) on update cascade,
  created_at     timestamptz not null default now(),
  primary key (funcionario_id, categoria)
);
create index if not exists funcionario_especialidades_categoria_idx
  on public.funcionario_especialidades (categoria);

-- Ponto de partida: o "setor" atual vira a primeira especialidade
insert into public.funcionario_especialidades (funcionario_id, categoria)
select id,
       case when lower(cargo) like 'limp%' then 'limpeza'
            else coalesce(nullif(setor, ''), 'manutencao') end
from public."Funcionarios"
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 4. Ocorrências: conclusão, pronunciamento do síndico, validações
-- -----------------------------------------------------------------------------
alter table public."Ocorrencias"
  add column if not exists concluida_em       timestamptz,
  add column if not exists pronunciamento     text check (char_length(pronunciamento) <= 2000),
  add column if not exists pronunciamento_em  timestamptz,
  add column if not exists pronunciamento_por uuid references auth.users (id) on delete set null;

update public."Ocorrencias"
set concluida_em = coalesce(updated_at, created_at)
where status = 'Resolvida' and concluida_em is null;

alter table public."Ocorrencias"
  add constraint ocorrencias_status_check
  check (status in ('Aberta', 'Em Análise', 'Em Andamento', 'Resolvida'));
alter table public."Ocorrencias"
  add constraint ocorrencias_privacidade_check
  check (privacidade in ('mural', 'sindico'));

-- Remover funcionário não pode travar por causa de ocorrências atribuídas
alter table public."Ocorrencias" drop constraint if exists "Ocorrencias_atribuido_a_fkey";
alter table public."Ocorrencias"
  add constraint "Ocorrencias_atribuido_a_fkey"
  foreign key (atribuido_a) references public."Funcionarios" (id) on delete set null;

create index if not exists ocorrencias_condominio_status_idx on public."Ocorrencias" (condominio_id, status);
create index if not exists ocorrencias_atribuido_idx on public."Ocorrencias" (atribuido_a);

-- -----------------------------------------------------------------------------
-- 5. Comentários (visíveis a quem vê a ocorrência)
-- -----------------------------------------------------------------------------
create table if not exists public.ocorrencia_comentarios (
  id            bigint generated always as identity primary key,
  ocorrencia_id bigint not null references public."Ocorrencias" (id) on delete cascade,
  condominio_id bigint not null references public."Condominios" (id) on delete cascade,
  autor_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  autor_nome    text not null default '',
  autor_papel   text not null default 'MORADOR',
  texto         text not null check (char_length(btrim(texto)) between 1 and 1000),
  created_at    timestamptz not null default now()
);
create index if not exists ocorrencia_comentarios_ocorrencia_idx
  on public.ocorrencia_comentarios (ocorrencia_id, created_at);

-- -----------------------------------------------------------------------------
-- 6. Histórico de status com descrição e provas (só equipe e gestão veem)
-- -----------------------------------------------------------------------------
create table if not exists public.ocorrencia_historico (
  id              bigint generated always as identity primary key,
  ocorrencia_id   bigint not null references public."Ocorrencias" (id) on delete cascade,
  condominio_id   bigint not null references public."Condominios" (id) on delete cascade,
  autor_id        uuid references auth.users (id) on delete set null,
  autor_nome      text,
  autor_papel     text,
  status_anterior text,
  status_novo     text not null,
  descricao       text check (char_length(descricao) <= 2000),
  evidencias      text[] not null default '{}',
  created_at      timestamptz not null default now()
);
create index if not exists ocorrencia_historico_ocorrencia_idx
  on public.ocorrencia_historico (ocorrencia_id, created_at);
create index if not exists ocorrencia_historico_condominio_idx
  on public.ocorrencia_historico (condominio_id, created_at);

-- -----------------------------------------------------------------------------
-- 7. Triggers
-- -----------------------------------------------------------------------------

-- 7.1 Guarda de ocorrências: quem pode mudar o quê + datas automáticas
create or replace function private.tg_ocorrencia_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  uid     uuid := auth.uid();
  descr   text := nullif(btrim(coalesce(current_setting('app.hist_descricao', true), '')), '');
  n_evid  int  := coalesce(json_array_length(nullif(current_setting('app.hist_evidencias', true), '')::json), 0);
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
    new.concluida_em := case when new.status = 'Resolvida' then now() end;
    return new;
  end if;

  if uid is not null then
    new.id            := old.id;
    new.condominio_id := old.condominio_id;
    new.morador_id    := old.morador_id;
    new.created_at    := old.created_at;

    if not private.is_gestor(old.condominio_id) then
      if new.pronunciamento is distinct from old.pronunciamento then
        raise exception 'Apenas o síndico pode se pronunciar sobre a ocorrência' using errcode = '42501';
      end if;

      if private.is_funcionario(old.condominio_id) then
        -- Funcionário só mexe em status e em assumir a ocorrência para si
        new.titulo      := old.titulo;
        new.descricao   := old.descricao;
        new.categoria   := old.categoria;
        new.privacidade := old.privacidade;
        new.anexos      := old.anexos;

        if new.atribuido_a is distinct from old.atribuido_a and new.atribuido_a is distinct from uid then
          raise exception 'Funcionário só pode assumir a ocorrência para si' using errcode = '42501';
        end if;

        if new.status is distinct from old.status then
          if new.status not in ('Em Andamento', 'Resolvida') then
            raise exception 'Status inválido para funcionário' using errcode = '42501';
          end if;
          new.atribuido_a := coalesce(new.atribuido_a, uid);
          if new.status = 'Resolvida' and descr is null and n_evid = 0 then
            raise exception 'Para concluir, anexe uma foto ou descreva o que foi feito' using errcode = '23514';
          end if;
        end if;
      else
        raise exception 'Sem permissão para alterar esta ocorrência' using errcode = '42501';
      end if;
    elsif new.atribuido_a is not null and new.atribuido_a is distinct from old.atribuido_a then
      if not exists (
        select 1 from public."Funcionarios" f
        where f.id = new.atribuido_a and f.condominio_id = old.condominio_id and f.status = 'ATIVO'
      ) then
        raise exception 'Funcionário inválido para este condomínio' using errcode = '23503';
      end if;
    end if;
  end if;

  if new.pronunciamento is distinct from old.pronunciamento then
    new.pronunciamento     := nullif(btrim(new.pronunciamento), '');
    new.pronunciamento_em  := case when new.pronunciamento is null then null else now() end;
    new.pronunciamento_por := case when new.pronunciamento is null then null else uid end;
  end if;

  if new.status is distinct from old.status then
    new.concluida_em := case when new.status = 'Resolvida' then now() end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_ocorrencias_guard on public."Ocorrencias";
create trigger trg_ocorrencias_guard
  before insert or update on public."Ocorrencias"
  for each row execute function private.tg_ocorrencia_guard();

-- 7.2 Nova ocorrência: confirma ao autor, avisa síndico e especialistas
create or replace function private.tg_ocorrencia_criada() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  autor     text := coalesce(private.nome_usuario(new.morador_id), 'Morador');
  categoria text := coalesce((select nome from public.categorias_ocorrencia where slug = new.categoria), new.categoria);
  r         record;
begin
  perform private.notificar(
    new.morador_id, new.condominio_id, 'OCORRENCIA_RECEBIDA', 'Ocorrência registrada',
    format('Sua ocorrência "%s" foi registrada e aguarda análise.', new.titulo),
    'ocorrencia', new.id::text);

  for r in
    select g.morador_id from public."Gestao_Sindicos" g
    where g.condominio_id = new.condominio_id and g.ativo and g.morador_id <> new.morador_id
  loop
    perform private.notificar(
      r.morador_id, new.condominio_id, 'NOVA_OCORRENCIA',
      case when new.privacidade = 'sindico' then 'Nova ocorrência (privada)' else 'Nova ocorrência registrada' end,
      format('%s registrou "%s" (%s).', autor, new.titulo, categoria),
      'ocorrencia', new.id::text, 'normal', new.morador_id, autor);
  end loop;

  -- Ocorrências privadas ao síndico só chegam ao funcionário se ele atribuir
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

drop trigger if exists trg_ocorrencias_criada on public."Ocorrencias";
create trigger trg_ocorrencias_criada
  after insert on public."Ocorrencias"
  for each row execute function private.tg_ocorrencia_criada();

-- 7.3 Ocorrência alterada: histórico + notificações
create or replace function private.tg_ocorrencia_atualizada() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  uid   uuid := auth.uid();
  ator  text := coalesce(private.nome_usuario(auth.uid()), 'Administração');
  descr text;
  evid  text[];
  r     record;
begin
  -- Atribuição feita por outra pessoa (síndico) = urgente
  if new.atribuido_a is not null
     and new.atribuido_a is distinct from old.atribuido_a
     and new.atribuido_a is distinct from uid then
    perform private.notificar(
      new.atribuido_a, new.condominio_id, 'TAREFA_ATRIBUIDA', 'Tarefa atribuída pelo síndico',
      format('%s atribuiu a você: "%s".', ator, new.titulo),
      'ocorrencia', new.id::text, 'urgente', uid, ator);
  end if;

  if new.status is distinct from old.status then
    descr := nullif(btrim(coalesce(current_setting('app.hist_descricao', true), '')), '');
    select coalesce(array_agg(x), '{}') into evid
    from json_array_elements_text(coalesce(nullif(current_setting('app.hist_evidencias', true), ''), '[]')::json) as t(x)
    where x like new.condominio_id || '/' || new.id || '/%';

    insert into public.ocorrencia_historico
      (ocorrencia_id, condominio_id, autor_id, autor_nome, autor_papel, status_anterior, status_novo, descricao, evidencias)
    values
      (new.id, new.condominio_id, uid, ator, private.papel_usuario(uid, new.condominio_id),
       old.status, new.status, descr, evid);

    perform set_config('app.hist_descricao', '', true);
    perform set_config('app.hist_evidencias', '', true);

    if new.status in ('Em Andamento', 'Resolvida') and new.morador_id is distinct from uid then
      perform private.notificar(
        new.morador_id, new.condominio_id, 'STATUS_OCORRENCIA',
        case new.status when 'Resolvida' then 'Sua ocorrência foi concluída' else 'Sua ocorrência está em andamento' end,
        format('"%s" agora está %s.', new.titulo,
               case new.status when 'Resolvida' then 'concluída' else 'em andamento' end),
        'ocorrencia', new.id::text, 'normal', uid, ator);
    end if;

    if new.status = 'Resolvida' then
      for r in
        select g.morador_id from public."Gestao_Sindicos" g
        where g.condominio_id = new.condominio_id and g.ativo and g.morador_id is distinct from uid
      loop
        perform private.notificar(
          r.morador_id, new.condominio_id, 'TAREFA_FINALIZADA', 'Ocorrência concluída',
          format('%s concluiu "%s".', ator, new.titulo),
          'ocorrencia', new.id::text, 'normal', uid, ator);
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

drop trigger if exists trg_ocorrencias_atualizada on public."Ocorrencias";
create trigger trg_ocorrencias_atualizada
  after update on public."Ocorrencias"
  for each row execute function private.tg_ocorrencia_atualizada();

-- 7.4 Reclamação: avisa o síndico sem identificar o denunciante
create or replace function private.tg_reclamacao_criada() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r record;
begin
  for r in
    select g.morador_id from public."Gestao_Sindicos" g
    where g.condominio_id = new.condominio_id and g.ativo and g.morador_id <> new.morador_id
  loop
    perform private.notificar(
      r.morador_id, new.condominio_id, 'NOVA_RECLAMACAO', 'Nova reclamação particular',
      format('Reclamação sigilosa sobre o Bloco %s, Apt %s.', new.bloco_denunciado, new.apartamento_denunciado),
      'reclamacao', new.id::text, 'normal', null, 'Morador anônimo');
  end loop;
  return null;
end;
$$;

drop trigger if exists trg_reclamacoes_criada on public."Reclamacoes";
create trigger trg_reclamacoes_criada
  after insert on public."Reclamacoes"
  for each row execute function private.tg_reclamacao_criada();

-- 7.5 Comentário: autor/nome/papel vêm do banco, não do navegador
create or replace function private.tg_comentario_preparar() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then
    new.autor_id := auth.uid();
  end if;
  select o.condominio_id into new.condominio_id from public."Ocorrencias" o where o.id = new.ocorrencia_id;
  new.autor_nome  := coalesce(private.nome_usuario(new.autor_id), 'Usuário');
  new.autor_papel := private.papel_usuario(new.autor_id, new.condominio_id);
  new.texto       := btrim(new.texto);
  new.created_at  := now();
  return new;
end;
$$;

drop trigger if exists trg_comentarios_preparar on public.ocorrencia_comentarios;
create trigger trg_comentarios_preparar
  before insert on public.ocorrencia_comentarios
  for each row execute function private.tg_comentario_preparar();

create or replace function private.tg_comentario_criado() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  oc record;
begin
  select o.id, o.titulo, o.morador_id into oc from public."Ocorrencias" o where o.id = new.ocorrencia_id;
  if oc.morador_id is distinct from new.autor_id then
    perform private.notificar(
      oc.morador_id, new.condominio_id, 'NOVO_COMENTARIO', 'Novo comentário na sua ocorrência',
      format('%s comentou em "%s".', new.autor_nome, oc.titulo),
      'ocorrencia', oc.id::text, 'normal', new.autor_id, new.autor_nome);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_comentarios_criado on public.ocorrencia_comentarios;
create trigger trg_comentarios_criado
  after insert on public.ocorrencia_comentarios
  for each row execute function private.tg_comentario_criado();

-- -----------------------------------------------------------------------------
-- 8. Funções expostas (RPC)
-- -----------------------------------------------------------------------------

-- Perfil do usuário logado em uma chamada (substitui as 4 consultas do login)
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

-- Nomes de moradores do mesmo condomínio (sem expor CPF/telefone)
create or replace function public.nomes_moradores(p_ids uuid[])
returns table (id uuid, nome text)
language sql stable security definer set search_path = '' as $$
  select m.id, m.nome::text
  from public."Moradores" m
  where m.id = any (p_ids) and private.is_membro(m.condominio_id);
$$;

-- E-mails dos usuários do condomínio (só para o Master); substitui a view user_emails
create or replace function public.emails_do_condominio(p_condominio_id bigint)
returns table (id uuid, email text)
language sql stable security definer set search_path = '' as $$
  select u.id, u.email::text
  from auth.users u
  where private.is_master(p_condominio_id)
    and (exists (select 1 from public."Moradores" m where m.id = u.id and m.condominio_id = p_condominio_id)
      or exists (select 1 from public."Funcionarios" f where f.id = u.id and f.condominio_id = p_condominio_id));
$$;

-- Mudança de status com descrição e provas. Roda com as permissões de quem chama
-- (RLS + trigger de guarda decidem se pode); o trigger grava o histórico.
create or replace function public.mudar_status_ocorrencia(
  p_ocorrencia_id bigint, p_status text, p_descricao text default null, p_evidencias text[] default '{}'
) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  perform set_config('app.hist_descricao', coalesce(p_descricao, ''), true);
  perform set_config('app.hist_evidencias', coalesce(array_to_json(p_evidencias)::text, '[]'), true);

  update public."Ocorrencias"
  set status = p_status
  where id = p_ocorrencia_id and status is distinct from p_status;

  if not found then
    raise exception 'Ocorrência não encontrada, sem permissão ou já está com esse status' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.meu_perfil() from public, anon;
revoke execute on function public.nomes_moradores(uuid[]) from public, anon;
revoke execute on function public.emails_do_condominio(bigint) from public, anon;
revoke execute on function public.mudar_status_ocorrencia(bigint, text, text, text[]) from public, anon;
grant execute on function public.meu_perfil() to authenticated;
grant execute on function public.nomes_moradores(uuid[]) to authenticated;
grant execute on function public.emails_do_condominio(bigint) to authenticated;
grant execute on function public.mudar_status_ocorrencia(bigint, text, text, text[]) to authenticated;

-- A view user_emails expunha todos os e-mails para qualquer visitante
revoke all on public.user_emails from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 9. RLS — remove as políticas antigas (várias liberavam tudo) e recria por papel
-- -----------------------------------------------------------------------------
do $$
declare
  p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('Condominios', 'Masters', 'Moradores', 'Gestao_Sindicos', 'Funcionarios',
                        'Ocorrencias', 'Reclamacoes', 'notificacoes')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end;
$$;

alter table public.categorias_ocorrencia      enable row level security;
alter table public.funcionario_especialidades enable row level security;
alter table public.ocorrencia_comentarios     enable row level security;
alter table public.ocorrencia_historico       enable row level security;

-- Condomínios: a tela de cadastro (sem login) precisa listar nome/cidade
create policy condominios_select on public."Condominios"
  for select to anon, authenticated using (true);
create policy condominios_insert on public."Condominios"
  for insert to authenticated with check (master_id = (select auth.uid()));
create policy condominios_update on public."Condominios"
  for update to authenticated
  using (master_id = (select auth.uid())) with check (master_id = (select auth.uid()));
revoke select on public."Condominios" from anon;
grant select (id, nome, cidade, estado) on public."Condominios" to anon;

-- Masters: cada um só vê e edita o próprio cadastro
create policy masters_select on public."Masters"
  for select to authenticated using (id = (select auth.uid()));
create policy masters_insert on public."Masters"
  for insert to authenticated with check (id = (select auth.uid()));
create policy masters_update on public."Masters"
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and (condominio_id is null
         or exists (select 1 from public."Condominios" c where c.id = condominio_id and c.master_id = (select auth.uid())))
  );

-- Moradores: o próprio, a gestão e os funcionários do condomínio
create policy moradores_select on public."Moradores"
  for select to authenticated
  using (id = (select auth.uid()) or private.is_gestor(condominio_id) or private.is_funcionario(condominio_id));
create policy moradores_insert on public."Moradores"
  for insert to authenticated with check (id = (select auth.uid()) and status = 'PENDENTE');
create policy moradores_update on public."Moradores"
  for update to authenticated
  using (private.is_master(condominio_id)) with check (private.is_master(condominio_id));

-- Gestão de síndicos: só o Master nomeia/revoga
create policy gestao_sindicos_select on public."Gestao_Sindicos"
  for select to authenticated
  using (morador_id = (select auth.uid()) or private.is_membro(condominio_id));
create policy gestao_sindicos_insert on public."Gestao_Sindicos"
  for insert to authenticated with check (private.is_master(condominio_id));
create policy gestao_sindicos_update on public."Gestao_Sindicos"
  for update to authenticated
  using (private.is_master(condominio_id)) with check (private.is_master(condominio_id));

-- Funcionários: visíveis ao condomínio; só o Master cadastra/edita/remove
create policy funcionarios_select on public."Funcionarios"
  for select to authenticated
  using (id = (select auth.uid()) or private.is_membro(condominio_id));
create policy funcionarios_insert on public."Funcionarios"
  for insert to authenticated with check (private.is_master(condominio_id));
create policy funcionarios_update on public."Funcionarios"
  for update to authenticated
  using (private.is_master(condominio_id)) with check (private.is_master(condominio_id));
create policy funcionarios_delete on public."Funcionarios"
  for delete to authenticated using (private.is_master(condominio_id));

-- Categorias: leitura livre, escrita só por migração
create policy categorias_select on public.categorias_ocorrencia
  for select to anon, authenticated using (true);

-- Especialidades: o condomínio vê; só o Master altera
create policy especialidades_select on public.funcionario_especialidades
  for select to authenticated
  using (funcionario_id = (select auth.uid())
         or private.is_membro(private.condominio_do_funcionario(funcionario_id)));
create policy especialidades_insert on public.funcionario_especialidades
  for insert to authenticated
  with check (private.is_master(private.condominio_do_funcionario(funcionario_id)));
create policy especialidades_delete on public.funcionario_especialidades
  for delete to authenticated
  using (private.is_master(private.condominio_do_funcionario(funcionario_id)));

-- Ocorrências
--  * autor: sempre vê as suas
--  * gestão: vê todas do condomínio
--  * funcionário: as do mural + as atribuídas a ele
--  * morador: as do mural; concluídas só até 14 dias após a conclusão
create policy ocorrencias_select on public."Ocorrencias"
  for select to authenticated
  using (
    morador_id = (select auth.uid())
    or private.is_gestor(condominio_id)
    or (private.is_funcionario(condominio_id)
        and (privacidade = 'mural' or atribuido_a = (select auth.uid())))
    or (private.is_morador(condominio_id)
        and privacidade = 'mural'
        and (status <> 'Resolvida' or concluida_em > now() - interval '14 days'))
  );
create policy ocorrencias_insert on public."Ocorrencias"
  for insert to authenticated
  with check (morador_id = (select auth.uid()) and private.is_morador(condominio_id));
create policy ocorrencias_update_gestor on public."Ocorrencias"
  for update to authenticated
  using (private.is_gestor(condominio_id)) with check (private.is_gestor(condominio_id));
create policy ocorrencias_update_funcionario on public."Ocorrencias"
  for update to authenticated
  using (
    private.is_funcionario(condominio_id)
    and (atribuido_a = (select auth.uid())
         or (atribuido_a is null and privacidade = 'mural'
             and exists (select 1 from public.funcionario_especialidades e
                         where e.funcionario_id = (select auth.uid()) and e.categoria = "Ocorrencias".categoria)))
  )
  with check (atribuido_a = (select auth.uid()));
create policy ocorrencias_delete on public."Ocorrencias"
  for delete to authenticated
  using (private.is_gestor(condominio_id) or (morador_id = (select auth.uid()) and status = 'Aberta'));

-- Comentários: quem vê a ocorrência vê e comenta (exceto concluídas)
create policy comentarios_select on public.ocorrencia_comentarios
  for select to authenticated
  using (exists (select 1 from public."Ocorrencias" o where o.id = ocorrencia_id));
create policy comentarios_insert on public.ocorrencia_comentarios
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and exists (select 1 from public."Ocorrencias" o where o.id = ocorrencia_id and o.status <> 'Resolvida')
  );
create policy comentarios_delete on public.ocorrencia_comentarios
  for delete to authenticated
  using (autor_id = (select auth.uid()) or private.is_gestor(condominio_id));

-- Histórico (andamento/resolução): só gestão e funcionários. Escrita só via trigger.
create policy historico_select on public.ocorrencia_historico
  for select to authenticated
  using (private.is_gestor(condominio_id) or private.is_funcionario(condominio_id));

-- Reclamações: sigilo — só o autor e a gestão
create policy reclamacoes_select on public."Reclamacoes"
  for select to authenticated
  using (morador_id = (select auth.uid()) or private.is_gestor(condominio_id));
create policy reclamacoes_insert on public."Reclamacoes"
  for insert to authenticated
  with check (morador_id = (select auth.uid()) and private.is_morador(condominio_id));
create policy reclamacoes_update on public."Reclamacoes"
  for update to authenticated
  using (private.is_gestor(condominio_id)) with check (private.is_gestor(condominio_id));

-- Notificações: cada um vê as suas; só a gestão envia para outras pessoas
create policy notificacoes_select on public.notificacoes
  for select to authenticated using (destinatario_id = (select auth.uid()));
create policy notificacoes_insert on public.notificacoes
  for insert to authenticated
  with check (destinatario_id = (select auth.uid())
              or (condominio_id is not null and private.is_gestor(condominio_id)));
create policy notificacoes_update on public.notificacoes
  for update to authenticated
  using (destinatario_id = (select auth.uid())) with check (destinatario_id = (select auth.uid()));
create policy notificacoes_delete on public.notificacoes
  for delete to authenticated using (destinatario_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- 10. Storage
-- -----------------------------------------------------------------------------
-- anexos: continua público por URL (as telas usam getPublicUrl), mas com limite
-- de tamanho/tipo e sem permitir listar os arquivos dos outros
update storage.buckets
set file_size_limit = 20971520,
    allowed_mime_types = array['image/*', 'video/*', 'audio/*', 'application/pdf']
where id = 'anexos';

-- evidencias: privado, lido por URL assinada só pela gestão e pela equipe
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 10485760, array['image/*'])
on conflict (id) do nothing;

drop policy if exists "Leitura de anexos liberada" on storage.objects;
drop policy if exists "anexos_public_read" on storage.objects;
drop policy if exists "Upload de anexos liberado para logados" on storage.objects;
drop policy if exists "anexos_upload" on storage.objects;
drop policy if exists "anexos_delete_own" on storage.objects;

create policy anexos_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'anexos');
create policy anexos_select_own on storage.objects
  for select to authenticated using (bucket_id = 'anexos' and owner = (select auth.uid()));
create policy anexos_delete_own on storage.objects
  for delete to authenticated using (bucket_id = 'anexos' and owner = (select auth.uid()));

create policy evidencias_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'evidencias' and private.pode_acessar_evidencia(name));
create policy evidencias_select on storage.objects
  for select to authenticated
  using (bucket_id = 'evidencias' and private.pode_acessar_evidencia(name));
