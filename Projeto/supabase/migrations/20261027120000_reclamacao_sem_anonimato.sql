-- Reclamação não é anônima — 27/10/2026 (decisão do dono)
-- O síndico sabe quem reclamou e quem foi reclamado e responde só a quem reclamou.
-- A notificação deixa de chamar a reclamação de "sigilosa".

create or replace function private.tg_reclamacao_criada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  destino uuid;
  nome    text := coalesce(private.nome_usuario(new.morador_id), 'Morador');
begin
  for destino in select * from private.gestores_para_notificar(new.condominio_id) loop
    if destino is distinct from new.morador_id then
      perform private.notificar(
        destino, new.condominio_id, 'NOVA_RECLAMACAO', 'Nova reclamação',
        format('%s registrou uma reclamação sobre o Bloco %s, Apt %s.', nome, new.bloco_denunciado, new.apartamento_denunciado),
        'reclamacao', new.id::text, 'normal', new.morador_id, nome);
    end if;
  end loop;
  return null;
end;
$$;

-- Só o síndico vê e responde reclamações (o Master não). Sem síndico ativo, a reclamação
-- fica guardada e o próximo síndico nomeado a encontra no painel.
drop policy if exists reclamacoes_select on public."Reclamacoes";
create policy reclamacoes_select on public."Reclamacoes"
  for select to authenticated
  using (morador_id = (select auth.uid()) or private.is_sindico(condominio_id));

drop policy if exists reclamacoes_update on public."Reclamacoes";
create policy reclamacoes_update on public."Reclamacoes"
  for update to authenticated
  using (private.is_sindico(condominio_id))
  with check (private.is_sindico(condominio_id));

create or replace function private.tg_reclamacao_criada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  destino uuid;
  nome    text := coalesce(private.nome_usuario(new.morador_id), 'Morador');
begin
  for destino in
    select g.morador_id from public."Gestao_Sindicos" g
     where g.condominio_id = new.condominio_id and g.ativo
  loop
    if destino is distinct from new.morador_id then
      perform private.notificar(
        destino, new.condominio_id, 'NOVA_RECLAMACAO', 'Nova reclamação',
        format('%s registrou uma reclamação sobre o Bloco %s, Apt %s.', nome, new.bloco_denunciado, new.apartamento_denunciado),
        'reclamacao', new.id::text, 'normal', new.morador_id, nome);
    end if;
  end loop;
  return null;
end;
$$;
