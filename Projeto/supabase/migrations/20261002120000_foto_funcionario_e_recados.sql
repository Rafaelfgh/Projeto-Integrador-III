-- Foto do funcionário, síndico na gestão de funcionários e recados (02/10/2026)

-- ===========================================================================
-- 14. Foto do funcionário + síndico na gestão de funcionários
-- ===========================================================================
-- A foto é escolhida no cadastro (reduzida no navegador para 300x400) e gravada pela
-- Edge Function gerenciar-funcionario com a chave de serviço: o funcionário não consegue
-- trocá-la. Pasta: funcionarios/<condominio>/<funcionario>.jpg (privada).
alter table public."Funcionarios" add column if not exists foto text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('funcionarios', 'funcionarios', false, 524288, array['image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Ver a foto: gestão e equipe do mesmo condomínio. Enviar/trocar/apagar: só a Edge Function.
drop policy if exists funcionarios_foto_select on storage.objects;
create policy funcionarios_foto_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'funcionarios'
    and case when split_part(name, '/', 1) ~ '^\d+$'
             then private.is_gestor(split_part(name, '/', 1)::bigint)
               or private.is_funcionario(split_part(name, '/', 1)::bigint)
             else false end
  );

-- Síndico também cadastra (Edge Function) e ajusta especialidades
drop policy if exists especialidades_insert on public.funcionario_especialidades;
create policy especialidades_insert on public.funcionario_especialidades
  for insert to authenticated
  with check (private.is_gestor(private.condominio_do_funcionario(funcionario_id)));

drop policy if exists especialidades_delete on public.funcionario_especialidades;
create policy especialidades_delete on public.funcionario_especialidades
  for delete to authenticated
  using (private.is_gestor(private.condominio_do_funcionario(funcionario_id)));

-- E-mails: o master vê todos do condomínio; o síndico, só os dos funcionários
create or replace function public.emails_do_condominio(p_condominio_id bigint)
returns table(id uuid, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text
  from auth.users u
  where (private.is_master(p_condominio_id)
          and (exists (select 1 from public."Moradores" m where m.id = u.id and m.condominio_id = p_condominio_id)
            or exists (select 1 from public."Funcionarios" f where f.id = u.id and f.condominio_id = p_condominio_id)))
     or (private.is_sindico(p_condominio_id)
          and exists (select 1 from public."Funcionarios" f where f.id = u.id and f.condominio_id = p_condominio_id));
$$;

-- meu_perfil devolve a foto do funcionário (resto da função igual)
do $$
declare
  v_def text := pg_get_functiondef('public.meu_perfil'::regproc);
begin
  if position('''foto'', f.foto' in v_def) = 0 then
    execute replace(v_def,
      '''precisa_trocar_senha'', f.precisa_trocar_senha,',
      '''precisa_trocar_senha'', f.precisa_trocar_senha, ''foto'', f.foto,');
  end if;
end $$;

-- ===========================================================================
-- 15. Recados do síndico para os funcionários
-- ===========================================================================
-- Formal e esporádico: só a gestão cria (RPC enviar_recado), para todos ou para escolhidos.
-- Funcionários só respondem (quantas vezes quiserem); as respostas ficam presas ao recado
-- e aparecem para todos os destinatários. A gestão é notificada a cada resposta.

create table if not exists public.recados (
  id            bigint generated always as identity primary key,
  condominio_id bigint not null references public."Condominios"(id) on delete cascade,
  autor_id      uuid,                    -- sem chave estrangeira: fica mesmo se a conta sair
  autor_nome    text not null,
  titulo        text not null check (char_length(btrim(titulo)) between 1 and 150),
  texto         text not null check (char_length(btrim(texto)) between 1 and 3000),
  para_todos    boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.recado_destinatarios (
  recado_id      bigint not null references public.recados(id) on delete cascade,
  funcionario_id uuid not null references public."Funcionarios"(id) on delete cascade,
  primary key (recado_id, funcionario_id)
);

create table if not exists public.recado_respostas (
  id            bigint generated always as identity primary key,
  recado_id     bigint not null references public.recados(id) on delete cascade,
  condominio_id bigint not null,
  autor_id      uuid,
  autor_nome    text not null default '',
  autor_papel   text not null default '',
  texto         text not null check (char_length(btrim(texto)) between 1 and 1000),
  created_at    timestamptz not null default now()
);

create index if not exists recados_condominio_idx on public.recados (condominio_id, created_at desc);
create index if not exists recado_destinatarios_func_idx on public.recado_destinatarios (funcionario_id);
create index if not exists recado_respostas_recado_idx on public.recado_respostas (recado_id, created_at);

alter table public.recados enable row level security;
alter table public.recado_destinatarios enable row level security;
alter table public.recado_respostas enable row level security;
revoke all on public.recados, public.recado_destinatarios, public.recado_respostas from anon;

-- Quem vê um recado: a gestão do condomínio e os funcionários destinatários
create or replace function private.pode_ver_recado(p_recado bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.recados r
     where r.id = p_recado
       and (private.is_gestor(r.condominio_id)
            or (private.is_funcionario(r.condominio_id)
                and (r.para_todos
                     or exists (select 1 from public.recado_destinatarios d
                                 where d.recado_id = r.id and d.funcionario_id = auth.uid()))))
  );
$$;

-- Destinatários de fato (todos os funcionários ativos, ou os escolhidos)
create or replace function private.destinatarios_recado(p_recado bigint)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select f.id from public.recados r
    join public."Funcionarios" f on f.condominio_id = r.condominio_id and f.status = 'ATIVO'
   where r.id = p_recado
     and (r.para_todos
          or exists (select 1 from public.recado_destinatarios d
                      where d.recado_id = r.id and d.funcionario_id = f.id));
$$;

drop policy if exists recados_select on public.recados;
create policy recados_select on public.recados
  for select to authenticated using (private.pode_ver_recado(id));

drop policy if exists recados_delete on public.recados;
create policy recados_delete on public.recados
  for delete to authenticated using (private.is_gestor(condominio_id));

drop policy if exists recado_destinatarios_select on public.recado_destinatarios;
create policy recado_destinatarios_select on public.recado_destinatarios
  for select to authenticated
  using (funcionario_id = (select auth.uid()) or private.pode_ver_recado(recado_id));

drop policy if exists recado_respostas_select on public.recado_respostas;
create policy recado_respostas_select on public.recado_respostas
  for select to authenticated using (private.pode_ver_recado(recado_id));

drop policy if exists recado_respostas_insert on public.recado_respostas;
create policy recado_respostas_insert on public.recado_respostas
  for insert to authenticated
  with check (autor_id = (select auth.uid()) and private.pode_ver_recado(recado_id));

-- Criar recado (só gestão): valida destinatários e avisa cada um
create or replace function public.enviar_recado(
  p_titulo text, p_texto text, p_para_todos boolean, p_funcionarios uuid[] default '{}')
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cond    bigint;
  v_nome    text;
  v_id      bigint;
  v_validos uuid[];
  v_dest    uuid;
begin
  select coalesce(
    (select c.id from public."Condominios" c where c.master_id = auth.uid() and c.status = 'ATIVO' limit 1),
    (select g.condominio_id from public."Gestao_Sindicos" g where g.morador_id = auth.uid() and g.ativo limit 1))
    into v_cond;
  if v_cond is null or not private.is_gestor(v_cond) then
    raise exception 'Só o síndico ou o master podem enviar recados.' using errcode = '42501';
  end if;

  if not coalesce(p_para_todos, false) then
    select array_agg(f.id) into v_validos
      from public."Funcionarios" f
     where f.id = any(coalesce(p_funcionarios, '{}')) and f.condominio_id = v_cond and f.status = 'ATIVO';
    if coalesce(cardinality(v_validos), 0) = 0 then
      raise exception 'Escolha pelo menos um funcionário.' using errcode = 'P0001', hint = 'destinatarios';
    end if;
  end if;

  v_nome := coalesce(private.nome_usuario(auth.uid()), 'Síndico');
  insert into public.recados (condominio_id, autor_id, autor_nome, titulo, texto, para_todos)
  values (v_cond, auth.uid(), v_nome, btrim(p_titulo), btrim(p_texto), coalesce(p_para_todos, false))
  returning id into v_id;

  if not coalesce(p_para_todos, false) then
    insert into public.recado_destinatarios (recado_id, funcionario_id)
    select v_id, unnest(v_validos);
  end if;

  for v_dest in select private.destinatarios_recado(v_id) loop
    perform private.notificar(
      v_dest, v_cond, 'NOVO_RECADO', format('Novo recado: %s', btrim(p_titulo)),
      left(btrim(p_texto), 140), 'recado', v_id::text, 'normal', auth.uid(), v_nome);
  end loop;

  return v_id;
end;
$$;

revoke all on function public.enviar_recado(text, text, boolean, uuid[]) from public, anon;
grant execute on function public.enviar_recado(text, text, boolean, uuid[]) to authenticated;

-- Filtro de palavrões
drop trigger if exists trg_recados_palavroes on public.recados;
create trigger trg_recados_palavroes
  before insert on public.recados
  for each row execute function private.tg_bloquear_palavroes('titulo', 'texto');

drop trigger if exists trg_recado_respostas_palavroes on public.recado_respostas;
create trigger trg_recado_respostas_palavroes
  before insert on public.recado_respostas
  for each row execute function private.tg_bloquear_palavroes('texto');

-- Resposta: autor preenchido pelo banco; a mesma resposta em menos de 30 s é recusada
create or replace function private.tg_recado_resposta_preparar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.autor_id := auth.uid();
  end if;
  select r.condominio_id into new.condominio_id from public.recados r where r.id = new.recado_id;
  new.texto := btrim(coalesce(new.texto, ''));

  perform pg_advisory_xact_lock(hashtext('recado/' || new.recado_id::text || '/' || new.autor_id::text));
  if exists (
    select 1 from public.recado_respostas x
     where x.recado_id = new.recado_id and x.autor_id = new.autor_id
       and x.texto = new.texto and x.created_at > now() - interval '30 seconds'
  ) then
    raise exception 'Essa resposta já foi enviada.' using errcode = 'P0001', hint = 'repetida';
  end if;

  new.autor_nome  := coalesce(private.nome_usuario(new.autor_id), 'Usuário');
  new.autor_papel := private.papel_usuario(new.autor_id, new.condominio_id);
  new.created_at  := now();
  return new;
end;
$$;

drop trigger if exists trg_recado_respostas_preparar on public.recado_respostas;
create trigger trg_recado_respostas_preparar
  before insert on public.recado_respostas
  for each row execute function private.tg_recado_resposta_preparar();

-- Notificações: funcionário respondeu -> quem enviou o recado (síndico/master);
-- gestão respondeu -> os funcionários destinatários
create or replace function private.tg_recado_resposta_criada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec    record;
  v_dest uuid;
begin
  select r.id, r.titulo, r.autor_id into rec from public.recados r where r.id = new.recado_id;

  if new.autor_papel = 'FUNCIONARIO' then
    if rec.autor_id is distinct from new.autor_id then
      perform private.notificar(
        rec.autor_id, new.condominio_id, 'RESPOSTA_RECADO', format('%s respondeu ao recado', new.autor_nome),
        format('"%s": %s', rec.titulo, left(new.texto, 120)), 'recado', rec.id::text, 'normal',
        new.autor_id, new.autor_nome);
    end if;
  else
    for v_dest in select private.destinatarios_recado(rec.id) loop
      if v_dest is distinct from new.autor_id then
        perform private.notificar(
          v_dest, new.condominio_id, 'RESPOSTA_RECADO', format('%s respondeu ao recado', new.autor_nome),
          format('"%s": %s', rec.titulo, left(new.texto, 120)), 'recado', rec.id::text, 'normal',
          new.autor_id, new.autor_nome);
      end if;
    end loop;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_recado_respostas_criada on public.recado_respostas;
create trigger trg_recado_respostas_criada
  after insert on public.recado_respostas
  for each row execute function private.tg_recado_resposta_criada();
