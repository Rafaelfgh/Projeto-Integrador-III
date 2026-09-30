-- Conversa nas ocorrências pessoais (28/09/2026)
--
-- Usa a mesma tabela dos comentários (ocorrencia_comentarios). Nas ocorrências pessoais:
--   * sem o limite de um comentário por pessoa (é uma conversa entre morador, síndico/master
--     e funcionário atribuído — quem pode ver a ocorrência pessoal);
--   * até 3 fotos por mensagem, no bucket privado `evidencias`, pasta
--     <condominio>/<ocorrencia>/conversa/<arquivo> (quem vê a ocorrência vê as fotos);
--   * a mesma mensagem da mesma pessoa em menos de 30 s é recusada (clique repetido);
--   * cada mensagem notifica os outros participantes.
-- No mural (ocorrências públicas) continua: um comentário por pessoa e sem fotos.

alter table public.ocorrencia_comentarios
  add column if not exists fotos text[] not null default '{}';

alter table public.ocorrencia_comentarios alter column texto set default '';

alter table public.ocorrencia_comentarios drop constraint if exists ocorrencia_comentarios_texto_check;
alter table public.ocorrencia_comentarios drop constraint if exists ocorrencia_comentarios_fotos_check;
alter table public.ocorrencia_comentarios
  add constraint ocorrencia_comentarios_texto_check check (
    char_length(btrim(texto)) <= 1000
    and (char_length(btrim(texto)) >= 1 or cardinality(fotos) > 0)
  ),
  add constraint ocorrencia_comentarios_fotos_check check (cardinality(fotos) <= 3);

create or replace function private.tg_comentario_preparar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_privacidade text;
  v_foto        text;
begin
  if auth.uid() is not null then
    new.autor_id := auth.uid();
  end if;
  select o.condominio_id, o.privacidade into new.condominio_id, v_privacidade
    from public."Ocorrencias" o where o.id = new.ocorrencia_id;

  new.texto := btrim(coalesce(new.texto, ''));
  new.fotos := coalesce(new.fotos, '{}');

  -- evita dois envios simultâneos da mesma pessoa passarem juntos
  perform pg_advisory_xact_lock(hashtext(new.ocorrencia_id::text || '/' || new.autor_id::text));

  if v_privacidade is distinct from 'pessoal' then
    if cardinality(new.fotos) > 0 then
      raise exception 'Fotos só podem ser enviadas na conversa das ocorrências pessoais.'
        using errcode = 'P0001', hint = 'fotos';
    end if;
    if exists (select 1 from public.ocorrencia_comentarios c
                where c.ocorrencia_id = new.ocorrencia_id and c.autor_id = new.autor_id) then
      raise exception 'Você já comentou nesta ocorrência. Para mudar, apague o seu comentário e escreva de novo.'
        using errcode = 'P0001', hint = 'um_comentario';
    end if;
  else
    foreach v_foto in array new.fotos loop
      if v_foto not like new.condominio_id::text || '/' || new.ocorrencia_id::text || '/conversa/%' then
        raise exception 'Foto inválida para esta ocorrência.' using errcode = 'P0001', hint = 'fotos';
      end if;
    end loop;
    if new.texto <> '' and exists (
      select 1 from public.ocorrencia_comentarios c
       where c.ocorrencia_id = new.ocorrencia_id and c.autor_id = new.autor_id
         and c.texto = new.texto and c.created_at > now() - interval '30 seconds'
    ) then
      raise exception 'Essa mensagem já foi enviada.' using errcode = 'P0001', hint = 'repetida';
    end if;
  end if;

  new.autor_nome  := coalesce(private.nome_usuario(new.autor_id), 'Usuário');
  new.autor_papel := private.papel_usuario(new.autor_id, new.condominio_id);
  new.created_at  := now();
  return new;
end;
$$;

create or replace function private.tg_comentario_criado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  oc       record;
  v_dest   uuid;
  v_resumo text;
begin
  select o.id, o.titulo, o.morador_id, o.privacidade, o.atribuido_a into oc
    from public."Ocorrencias" o where o.id = new.ocorrencia_id;

  if oc.privacidade = 'pessoal' then
    v_resumo := case
      when new.texto <> '' then format('%s: "%s"', new.autor_nome, left(new.texto, 120))
      else format('%s enviou uma foto.', new.autor_nome)
    end;
    for v_dest in
      select distinct x.d from (
        select oc.morador_id as d
        union all select oc.atribuido_a
        union all select private.gestores_para_notificar(new.condominio_id)
      ) x
      where x.d is not null and x.d is distinct from new.autor_id
    loop
      perform private.notificar(
        v_dest, new.condominio_id, 'NOVA_MENSAGEM', format('Nova mensagem em "%s"', oc.titulo),
        v_resumo, 'ocorrencia', oc.id::text, 'normal', new.autor_id, new.autor_nome);
    end loop;
  elsif oc.morador_id is distinct from new.autor_id then
    perform private.notificar(
      oc.morador_id, new.condominio_id, 'NOVO_COMENTARIO', 'Novo comentário na sua ocorrência',
      format('%s comentou em "%s".', new.autor_nome, oc.titulo),
      'ocorrencia', oc.id::text, 'normal', new.autor_id, new.autor_nome);
  end if;
  return null;
end;
$$;

-- Fotos da conversa: participantes da ocorrência pessoal (não concluída) podem enviar
create or replace function private.pode_enviar_foto_conversa(caminho text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  cond text := split_part(caminho, '/', 1);
  oc   text := split_part(caminho, '/', 2);
begin
  if cond !~ '^\d+$' or oc !~ '^\d+$' or split_part(caminho, '/', 3) <> 'conversa' then
    return false;
  end if;
  return exists (
    select 1 from public."Ocorrencias" o
     where o.id = oc::bigint and o.condominio_id = cond::bigint
       and o.privacidade = 'pessoal' and o.status <> 'Resolvida'
       and (o.morador_id = auth.uid() or o.atribuido_a = auth.uid() or private.is_gestor(o.condominio_id))
  );
end;
$$;

drop policy if exists evidencias_conversa_insert on storage.objects;
create policy evidencias_conversa_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'evidencias' and private.pode_enviar_foto_conversa(name));

-- Quem enviou (ou a gestão) pode apagar a foto ao apagar a mensagem
drop policy if exists evidencias_conversa_delete on storage.objects;
create policy evidencias_conversa_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'evidencias'
    and split_part(name, '/', 3) = 'conversa'
    and (
      owner_id = (select auth.uid())::text
      or case when split_part(name, '/', 1) ~ '^\d+$'
              then private.is_gestor(split_part(name, '/', 1)::bigint) else false end
    )
  );
