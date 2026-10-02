-- Guarda o nome de quem concluiu a ocorrência (30/09/2026)
--
-- Antes: Ocorrencias.concluida_por apontava para a conta (auth.users) com ON DELETE SET NULL —
-- ao remover um funcionário, a ocorrência perdia quem a concluiu (e o crédito nos dashboards).
-- Agora:
--   * concluida_por deixa de ser chave estrangeira: o id fica para sempre (contagem por pessoa);
--   * concluida_por_nome guarda o nome no momento da conclusão (preenchido só pelo banco);
--   * ocorrências já concluídas recebem o nome (do cadastro ou, se a pessoa já saiu, do histórico).

alter table public."Ocorrencias"
  add column if not exists concluida_por_nome text;

alter table public."Ocorrencias" drop constraint if exists "Ocorrencias_concluida_por_fkey";

-- Preenche as já concluídas (gatilhos desligados só aqui, para não mexer em updated_at)
alter table public."Ocorrencias" disable trigger user;
update public."Ocorrencias" o
   set concluida_por_nome = coalesce(
     private.nome_usuario(o.concluida_por),
     (select h.autor_nome from public.ocorrencia_historico h
       where h.ocorrencia_id = o.id and h.status_novo = 'Resolvida'
       order by h.created_at desc limit 1)
   )
 where o.status = 'Resolvida' and o.concluida_por_nome is null;
alter table public."Ocorrencias" enable trigger user;

-- Roda depois de trg_ocorrencias_guard (ordem alfabética), que define concluida_por
create or replace function private.tg_ocorrencia_nome_conclusao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.concluida_por is null then
    new.concluida_por_nome := null;
  elsif tg_op = 'UPDATE' and new.concluida_por is not distinct from old.concluida_por then
    new.concluida_por_nome := old.concluida_por_nome; -- ninguém altera o nome por fora
  else
    new.concluida_por_nome := private.nome_usuario(new.concluida_por);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ocorrencias_nome_conclusao on public."Ocorrencias";
create trigger trg_ocorrencias_nome_conclusao
  before insert or update on public."Ocorrencias"
  for each row execute function private.tg_ocorrencia_nome_conclusao();
