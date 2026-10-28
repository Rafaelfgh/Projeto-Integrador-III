-- Edição de comentário do mural (28/09/2026)
--
-- Como cada pessoa tem um comentário por ocorrência do mural, o autor pode editá-lo:
--   * só o próprio autor, só o texto, e só enquanto a ocorrência não estiver concluída;
--   * mensagens da conversa das ocorrências pessoais não são editáveis (só apagar);
--   * o banco marca `editado_em` e aplica o filtro de palavrões também na edição.

alter table public.ocorrencia_comentarios
  add column if not exists editado_em timestamptz;

-- Só a coluna texto pode ser alterada pelo site
revoke update on public.ocorrencia_comentarios from anon, authenticated;
grant update (texto) on public.ocorrencia_comentarios to authenticated;

drop policy if exists comentarios_update on public.ocorrencia_comentarios;
create policy comentarios_update on public.ocorrencia_comentarios
  for update to authenticated
  using (autor_id = (select auth.uid()))
  with check (
    autor_id = (select auth.uid())
    and exists (
      select 1 from public."Ocorrencias" o
       where o.id = ocorrencia_id and o.status <> 'Resolvida' and o.privacidade <> 'pessoal'
    )
  );

create or replace function private.tg_comentario_editado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.texto := btrim(coalesce(new.texto, ''));
  if new.texto is distinct from old.texto then
    new.editado_em := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_comentarios_editado on public.ocorrencia_comentarios;
create trigger trg_comentarios_editado
  before update on public.ocorrencia_comentarios
  for each row execute function private.tg_comentario_editado();

-- Filtro de palavrões também na edição
drop trigger if exists trg_comentarios_palavroes on public.ocorrencia_comentarios;
create trigger trg_comentarios_palavroes
  before insert or update on public.ocorrencia_comentarios
  for each row execute function private.tg_bloquear_palavroes('texto');

-- Mensagem do limite passa a indicar a edição (resto da função igual à de 20260928150000)
do $$
declare
  v_def text := pg_get_functiondef('private.tg_comentario_preparar'::regproc);
begin
  execute replace(v_def,
    'Para mudar, apague o seu comentário e escreva de novo.',
    'Para editar, use o lápis no seu comentário.');
end $$;
