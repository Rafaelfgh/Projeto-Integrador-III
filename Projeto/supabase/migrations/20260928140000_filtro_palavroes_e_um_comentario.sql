-- Filtro de palavrões no banco + limite de um comentário por pessoa (28/09/2026)
--
-- 1. Lista única de palavras bloqueadas (private.palavras_bloqueadas). A tela busca a
--    mesma lista pela RPC lista_palavras_bloqueadas() para avisar antes de enviar.
--    Entrada terminada em '*' vale como prefixo (ex.: 'caralh*' pega caralho, caralhada).
-- 2. Texto normalizado (minúsculas, sem acento, 0→o, 1→i, 3→e, 4→a, @→a, 5→s, 7→t, $→s)
--    e comparado palavra por palavra — "computador" não é barrado por conter "puta".
-- 3. Gatilho genérico private.tg_bloquear_palavroes(colunas...) nos textos livres:
--    ocorrência (título, descrição, andamento, conclusão, motivo da análise,
--    pronunciamento), comentários, reclamações, avisos e resposta do síndico à reclamação.
--    Só verifica o que mudou, então textos antigos não travam outras atualizações.
-- 4. Comentários do mural: cada pessoa pode ter um comentário por ocorrência
--    (apagar libera escrever de novo). Ocorrências pessoais ficam de fora do limite.

create table if not exists private.palavras_bloqueadas (
  palavra text primary key check (palavra ~ '^[a-z]+\*?$')
);

insert into private.palavras_bloqueadas (palavra) values
  -- palavrões
  ('caralh*'), ('porr*'), ('merd*'), ('fod*'), ('fud*'), ('bucet*'), ('bocet*'),
  ('piroc*'), ('punhet*'), ('fuck*'),
  ('puta'), ('putas'), ('puto'), ('putos'), ('putinha'), ('putona'), ('putaria'), ('puteiro'),
  ('cacete'), ('bosta'), ('bostas'), ('bostinha'), ('cagar'), ('cagada'), ('cagao'),
  ('cu'), ('cuzao'), ('cuzona'), ('cuzinho'), ('xota'), ('xoxota'), ('xereca'), ('siririca'),
  ('shit'), ('bitch'), ('asshole'),
  -- abreviações
  ('fdp'), ('vtnc'), ('vsf'), ('pqp'), ('tnc'), ('krl'), ('crl'),
  -- ofensas
  ('arrombado'), ('arrombada'), ('arrombados'), ('arrombadas'),
  ('corno'), ('cornos'), ('corna'), ('chifrudo'),
  ('babaca'), ('babacas'), ('otario'), ('otaria'), ('otarios'), ('otarias'),
  ('escroto'), ('escrota'), ('escrotos'), ('escrotas'),
  ('desgracado'), ('desgracada'), ('desgracados'), ('desgracadas'),
  ('vagabundo'), ('vagabunda'), ('vagabundos'), ('vagabundas'), ('vadia'), ('vadias'),
  ('idiota'), ('idiotas'), ('imbecil'), ('imbecis'),
  -- termos preconceituosos
  ('viado'), ('viados'), ('viadinho'), ('bicha'), ('bichas'), ('sapatao'), ('traveco')
on conflict do nothing;

create or replace function private.normalizar_texto(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select translate(lower(normalize(coalesce(p, ''), NFC)),
    'áàâãäåéèêëíìîïóòôõöúùûüçñ0134@57$',
    'aaaaaaeeeeiiiiooooouuuucnoieaasts')
$$;

create or replace function private.contem_palavrao(p text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from regexp_split_to_table(private.normalizar_texto(p), '[^a-z]+') as t(token)
    join private.palavras_bloqueadas b
      on t.token = b.palavra
      or (right(b.palavra, 1) = '*' and t.token like left(b.palavra, -1) || '%')
    where t.token <> ''
  )
$$;

-- Lista para a tela avisar antes de enviar (o banco confere de novo de qualquer jeito)
create or replace function public.lista_palavras_bloqueadas()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(palavra order by palavra), '{}') from private.palavras_bloqueadas
$$;

revoke all on function public.lista_palavras_bloqueadas() from public, anon;
grant execute on function public.lista_palavras_bloqueadas() to authenticated;

-- Gatilho genérico: tg_argv = nomes das colunas a verificar
create or replace function private.tg_bloquear_palavroes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coluna text;
  v_novo   text;
begin
  foreach v_coluna in array tg_argv loop
    v_novo := to_jsonb(new) ->> v_coluna;
    if v_novo is not null
       and (tg_op = 'INSERT' or v_novo is distinct from (to_jsonb(old) ->> v_coluna))
       and private.contem_palavrao(v_novo) then
      raise exception 'O texto contém palavras impróprias. Revise e tente de novo.'
        using errcode = 'P0001', hint = 'palavrao';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_ocorrencias_palavroes on public."Ocorrencias";
create trigger trg_ocorrencias_palavroes
  before insert or update on public."Ocorrencias"
  for each row execute function private.tg_bloquear_palavroes(
    'titulo', 'descricao', 'andamento_descricao', 'conclusao_descricao', 'analise_motivo', 'pronunciamento');

drop trigger if exists trg_comentarios_palavroes on public.ocorrencia_comentarios;
create trigger trg_comentarios_palavroes
  before insert on public.ocorrencia_comentarios
  for each row execute function private.tg_bloquear_palavroes('texto');

drop trigger if exists trg_reclamacoes_palavroes on public."Reclamacoes";
create trigger trg_reclamacoes_palavroes
  before insert or update on public."Reclamacoes"
  for each row execute function private.tg_bloquear_palavroes('descricao');

drop trigger if exists trg_avisos_palavroes on public.avisos;
create trigger trg_avisos_palavroes
  before insert or update on public.avisos
  for each row execute function private.tg_bloquear_palavroes('titulo', 'conteudo');

-- A resposta do síndico à reclamação é gravada direto como notificação
drop trigger if exists trg_notificacoes_palavroes on public.notificacoes;
create trigger trg_notificacoes_palavroes
  before insert on public.notificacoes
  for each row when (new.tipo = 'RESPOSTA_RECLAMACAO')
  execute function private.tg_bloquear_palavroes('descricao');

-- Um comentário por pessoa em cada ocorrência do mural
create or replace function private.tg_comentario_preparar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_privacidade text;
begin
  if auth.uid() is not null then
    new.autor_id := auth.uid();
  end if;
  select o.condominio_id, o.privacidade into new.condominio_id, v_privacidade
    from public."Ocorrencias" o where o.id = new.ocorrencia_id;

  if v_privacidade is distinct from 'pessoal' then
    -- evita dois envios simultâneos da mesma pessoa passarem juntos
    perform pg_advisory_xact_lock(hashtext(new.ocorrencia_id::text || '/' || new.autor_id::text));
    if exists (select 1 from public.ocorrencia_comentarios c
                where c.ocorrencia_id = new.ocorrencia_id and c.autor_id = new.autor_id) then
      raise exception 'Você já comentou nesta ocorrência. Para mudar, apague o seu comentário e escreva de novo.'
        using errcode = 'P0001', hint = 'um_comentario';
    end if;
  end if;

  new.autor_nome  := coalesce(private.nome_usuario(new.autor_id), 'Usuário');
  new.autor_papel := private.papel_usuario(new.autor_id, new.condominio_id);
  new.texto       := btrim(new.texto);
  new.created_at  := now();
  return new;
end;
$$;
