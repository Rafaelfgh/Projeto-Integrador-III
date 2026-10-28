-- Guarda também o nome de quem colocou a ocorrência em andamento (30/09/2026)
--
-- Para os dashboards de síndico/master (ex.: funcionário que mais coloca em andamento e
-- não conclui). Mesmo esquema de concluida_por (20260930130000):
--   * andamento_por deixa de ser chave estrangeira: o id fica mesmo após a remoção da conta;
--   * andamento_por_nome guarda o nome no momento (preenchido só pelo banco);
--   * um único gatilho (tg_ocorrencia_nomes) cuida dos dois nomes.

alter table public."Ocorrencias"
  add column if not exists andamento_por_nome text;

alter table public."Ocorrencias" drop constraint if exists "Ocorrencias_andamento_por_fkey";

-- Preenche as que já tiveram andamento (gatilhos desligados só aqui, para não mexer em updated_at)
alter table public."Ocorrencias" disable trigger user;
update public."Ocorrencias" o
   set andamento_por_nome = coalesce(
     private.nome_usuario(o.andamento_por),
     (select h.autor_nome from public.ocorrencia_historico h
       where h.ocorrencia_id = o.id and h.status_novo = 'Em Andamento'
       order by h.created_at desc limit 1)
   )
 where o.andamento_por_nome is null
   and (o.andamento_por is not null
        or exists (select 1 from public.ocorrencia_historico h
                    where h.ocorrencia_id = o.id and h.status_novo = 'Em Andamento'));
alter table public."Ocorrencias" enable trigger user;

-- Substitui o gatilho só de conclusão por um que cuida dos dois nomes.
-- Roda depois de trg_ocorrencias_guard (ordem alfabética), que define andamento_por/concluida_por.
drop trigger if exists trg_ocorrencias_nome_conclusao on public."Ocorrencias";
drop function if exists private.tg_ocorrencia_nome_conclusao();

create or replace function private.tg_ocorrencia_nomes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Quem concluiu
  if new.concluida_por is null then
    new.concluida_por_nome := null;
  elsif tg_op = 'UPDATE' and new.concluida_por is not distinct from old.concluida_por then
    new.concluida_por_nome := old.concluida_por_nome; -- ninguém altera o nome por fora
  else
    new.concluida_por_nome := private.nome_usuario(new.concluida_por);
  end if;

  -- Quem colocou em andamento
  if new.andamento_por is null then
    new.andamento_por_nome := null;
  elsif tg_op = 'UPDATE' and new.andamento_por is not distinct from old.andamento_por then
    new.andamento_por_nome := old.andamento_por_nome;
  else
    new.andamento_por_nome := private.nome_usuario(new.andamento_por);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_ocorrencias_nomes on public."Ocorrencias";
create trigger trg_ocorrencias_nomes
  before insert or update on public."Ocorrencias"
  for each row execute function private.tg_ocorrencia_nomes();
