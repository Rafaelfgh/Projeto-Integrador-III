-- 27/10/2026 (pedidos do dono)
-- 1) Recados: toda resposta avisa todos os envolvidos (quem criou, síndico, Master e
--    funcionários do recado), menos quem escreveu. Antes o síndico não sabia das respostas
--    num recado do Master (e vice-versa).
-- 2) Reclamações: a resposta do síndico fica gravada na própria reclamação
--    (aba Reclamações: Abertas x Respondidas, com bolinha das abertas).

-- ── 1) Recados ──
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
  select r.id, r.titulo, r.autor_id, r.condominio_id into rec from public.recados r where r.id = new.recado_id;

  for v_dest in
    select distinct x from (
      select rec.autor_id as x
      union all
      select g.morador_id from public."Gestao_Sindicos" g where g.condominio_id = rec.condominio_id and g.ativo
      union all
      select c.master_id from public."Condominios" c where c.id = rec.condominio_id
      union all
      select private.destinatarios_recado(rec.id)
    ) envolvidos
    where x is not null and x is distinct from new.autor_id
  loop
    perform private.notificar(
      v_dest, new.condominio_id, 'RESPOSTA_RECADO', format('%s respondeu ao recado', new.autor_nome),
      format('"%s": %s', rec.titulo, left(new.texto, 120)), 'recado', rec.id::text, 'normal',
      new.autor_id, new.autor_nome);
  end loop;
  return null;
end;
$$;

-- ── 2) Reclamações respondidas ──
alter table public."Reclamacoes"
  add column if not exists resposta            text,
  add column if not exists respondida_em       timestamptz,
  add column if not exists respondida_por      uuid,
  add column if not exists respondida_por_nome text;

-- Respostas já enviadas antes (estavam só nas notificações): recupera a mais recente
update public."Reclamacoes" r
   set resposta = n.descricao, respondida_em = n.criado_em, respondida_por_nome = n.remetente_nome
  from (
    select distinct on (referencia_id) referencia_id, descricao, criado_em, remetente_nome
      from public.notificacoes
     where tipo = 'RESPOSTA_RECLAMACAO' and referencia_tipo = 'reclamacao'
     order by referencia_id, criado_em desc
  ) n
 where n.referencia_id = r.id::text and r.respondida_em is null;

-- Responder: só o síndico, uma vez; grava a resposta e avisa só quem reclamou
create or replace function public.responder_reclamacao(p_reclamacao bigint, p_texto text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec   record;
  texto text := btrim(coalesce(p_texto, ''));
  nome  text;
begin
  select id, condominio_id, morador_id, respondida_em into rec
    from public."Reclamacoes" where id = p_reclamacao for update;
  if rec.id is null or not private.is_sindico(rec.condominio_id) then
    raise exception 'Só o síndico responde reclamações.' using errcode = '42501';
  end if;
  if rec.respondida_em is not null then
    raise exception 'Esta reclamação já foi respondida.' using errcode = 'P0001', hint = 'respondida';
  end if;
  if texto = '' then
    raise exception 'Escreva a resposta.' using errcode = 'P0001', hint = 'vazia';
  end if;
  nome := coalesce(private.nome_usuario(auth.uid()), 'Síndico');

  -- a notificação passa pelo filtro de palavrões (gatilho em notificacoes)
  insert into public.notificacoes (destinatario_id, condominio_id, tipo, titulo, descricao, lida,
                                   referencia_tipo, referencia_id, remetente_id, remetente_nome)
  values (rec.morador_id, rec.condominio_id, 'RESPOSTA_RECLAMACAO', 'O síndico respondeu sua reclamação',
          texto, false, 'reclamacao', rec.id::text, auth.uid(), nome);

  update public."Reclamacoes"
     set resposta = texto, respondida_em = now(), respondida_por = auth.uid(), respondida_por_nome = nome
   where id = rec.id;
end;
$$;

revoke all on function public.responder_reclamacao(bigint, text) from public, anon;
grant execute on function public.responder_reclamacao(bigint, text) to authenticated;

-- Bolinha: reclamações ainda sem resposta (RLS: só o síndico conta)
create or replace function public.contadores_gestao()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'analise',  (select count(*) from public."Ocorrencias" where status = 'Em Análise' and privacidade = 'mural'),
    'pessoais', (select count(*) from public."Ocorrencias" where status = 'Em Análise' and privacidade = 'pessoal'),
    'abertas_paradas', (select count(*) from public."Ocorrencias" where status = 'Aberta' and created_at < now() - interval '2 days'),
    'reclamacoes_abertas', (select count(*) from public."Reclamacoes" r where r.respondida_em is null and private.is_sindico(r.condominio_id)),
    'moradores_pendentes', (select count(*) from public."Moradores" where status = 'PENDENTE')
  );
$$;
