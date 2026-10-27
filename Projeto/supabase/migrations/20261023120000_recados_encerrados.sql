-- Recados encerrados quando o síndico deixa o cargo — 23/10/2026 (decisão do dono)
--
-- O recado é do condomínio, não da pessoa: continua visível para o síndico atual, o Master
-- e os funcionários destinatários (histórico do que a gestão pediu). Mas, quando quem enviou
-- deixa de ser síndico, ninguém mais responde: o recado fica "encerrado" (só leitura).
-- Antes, a resposta de um funcionário ia notificar só o ex-síndico, que já não abre a tela.

alter table public.recados
  add column if not exists encerrado_em     timestamptz,
  add column if not exists encerrado_motivo text;

-- Síndico desativado (ou removido) -> encerra os recados que ele enviou nesse condomínio
create or replace function private.tg_encerrar_recados_ex_sindico()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.ativo and (tg_op = 'DELETE' or not new.ativo) then
    update public.recados r
       set encerrado_em = now(),
           encerrado_motivo = format('%s deixou de ser síndico', r.autor_nome)
     where r.condominio_id = old.condominio_id
       and r.autor_id = old.morador_id
       and r.encerrado_em is null;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_encerrar_recados_ex_sindico on public."Gestao_Sindicos";
create trigger trg_encerrar_recados_ex_sindico
  after update of ativo or delete on public."Gestao_Sindicos"
  for each row execute function private.tg_encerrar_recados_ex_sindico();

-- Recados já existentes de quem não é mais gestor (nem síndico ativo, nem Master)
update public.recados r
   set encerrado_em = now(),
       encerrado_motivo = format('%s deixou de ser síndico', r.autor_nome)
 where r.encerrado_em is null
   and not exists (select 1 from public."Condominios" c where c.id = r.condominio_id and c.master_id = r.autor_id)
   and not exists (select 1 from public."Gestao_Sindicos" g
                    where g.condominio_id = r.condominio_id and g.morador_id = r.autor_id and g.ativo);

-- Recado encerrado não recebe resposta
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
  if exists (select 1 from public.recados r where r.id = new.recado_id and r.encerrado_em is not null) then
    raise exception 'Este recado foi encerrado e não aceita mais respostas.' using errcode = 'P0001', hint = 'encerrado';
  end if;
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
