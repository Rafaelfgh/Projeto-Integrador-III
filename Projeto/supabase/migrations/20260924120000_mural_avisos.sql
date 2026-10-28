-- =============================================================================
-- Mural de avisos e eventos (definido pelo dono do projeto)
--  * Postado pelo síndico ou pelo Master (condomínio).
--  * Pouca tipagem: título + texto livre (limite largo), aviso ou evento.
--  * Prazo de expiração obrigatório; depois dele some para moradores e
--    funcionários (a gestão continua vendo, na aba "Expirados").
--  * Até 3 imagens (bucket privado "avisos", pasta <condominio>/...).
--  * Todos os moradores e funcionários ativos são notificados.
-- =============================================================================

create table if not exists public.avisos (
  id            bigint generated always as identity primary key,
  condominio_id bigint not null references public."Condominios" (id) on delete cascade,
  autor_id      uuid default auth.uid() references auth.users (id) on delete set null,
  autor_nome    text not null default '',
  tipo          text not null default 'aviso' check (tipo in ('aviso', 'evento')),
  titulo        varchar(150) not null check (char_length(btrim(titulo)) > 0),
  conteudo      varchar(3000) not null check (char_length(btrim(conteudo)) > 0),
  data_evento   timestamptz,
  expira_em     timestamptz not null,
  imagens       text[] not null default '{}' check (cardinality(imagens) <= 3),
  created_at    timestamptz not null default now()
);

create index if not exists avisos_condominio_expira_idx on public.avisos (condominio_id, expira_em desc);

alter table public.avisos enable row level security;
revoke all on public.avisos from anon;

-- Autor e nome vêm do banco; prazo no futuro; imagens só da pasta do condomínio
create or replace function private.tg_aviso_preparar() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.autor_id := auth.uid();
    end if;
    new.autor_nome := coalesce(private.nome_usuario(new.autor_id), 'Administração');
    new.created_at := now();
    if new.expira_em <= now() then
      raise exception 'O prazo de expiração precisa ser uma data futura' using errcode = '23514';
    end if;
  else
    new.id            := old.id;
    new.condominio_id := old.condominio_id;
    new.autor_id      := old.autor_id;
    new.autor_nome    := old.autor_nome;
    new.created_at    := old.created_at;
  end if;

  if new.tipo = 'evento' and new.data_evento is null then
    raise exception 'Informe a data do evento' using errcode = '23514';
  end if;

  if exists (select 1 from unnest(new.imagens) as i where i not like new.condominio_id || '/%') then
    raise exception 'Imagem fora da pasta do condomínio' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_avisos_preparar on public.avisos;
create trigger trg_avisos_preparar
  before insert or update on public.avisos
  for each row execute function private.tg_aviso_preparar();

-- Novo aviso/evento: notifica moradores e funcionários ativos do condomínio
create or replace function private.tg_aviso_criado() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  destino uuid;
begin
  for destino in
    select m.id from public."Moradores" m
    where m.condominio_id = new.condominio_id and m.status = 'ATIVO'
    union
    select f.id from public."Funcionarios" f
    where f.condominio_id = new.condominio_id and f.status = 'ATIVO'
  loop
    if destino is distinct from new.autor_id then
      perform private.notificar(
        destino, new.condominio_id, 'NOVO_AVISO',
        case new.tipo when 'evento' then 'Novo evento: ' else 'Novo aviso: ' end || new.titulo,
        left(new.conteudo, 140),
        'aviso', new.id::text, 'normal', new.autor_id, new.autor_nome);
    end if;
  end loop;
  return null;
end;
$$;

drop trigger if exists trg_avisos_criado on public.avisos;
create trigger trg_avisos_criado
  after insert on public.avisos
  for each row execute function private.tg_aviso_criado();

-- RLS: membros veem os ativos; a gestão vê todos e é quem publica/edita/apaga
create policy avisos_select on public.avisos
  for select to authenticated
  using (private.is_gestor(condominio_id) or (private.is_membro(condominio_id) and expira_em > now()));
create policy avisos_insert on public.avisos
  for insert to authenticated with check (private.is_gestor(condominio_id));
create policy avisos_update on public.avisos
  for update to authenticated
  using (private.is_gestor(condominio_id)) with check (private.is_gestor(condominio_id));
create policy avisos_delete on public.avisos
  for delete to authenticated using (private.is_gestor(condominio_id));

-- Imagens: bucket privado, lidas por URL assinada pelos membros do condomínio
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avisos', 'avisos', false, 5242880, array['image/*'])
on conflict (id) do nothing;

create or replace function private.pasta_condominio(caminho text) returns bigint
language sql immutable set search_path = '' as $$
  select case when split_part(caminho, '/', 1) ~ '^\d+$' then split_part(caminho, '/', 1)::bigint end;
$$;

create policy avisos_img_select on storage.objects
  for select to authenticated
  using (bucket_id = 'avisos' and private.is_membro(private.pasta_condominio(name)));
create policy avisos_img_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avisos' and private.is_gestor(private.pasta_condominio(name)));
create policy avisos_img_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avisos' and private.is_gestor(private.pasta_condominio(name)));
