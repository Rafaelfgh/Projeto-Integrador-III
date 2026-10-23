-- 20/10: decisão do dono — só o síndico vê as reclamações, então ele vê quem fez.
-- A notificação da gestão passa a trazer o nome do morador (o denunciado continua sem ver nada).
create or replace function private.tg_reclamacao_criada() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  destino uuid;
  nome    text := coalesce(private.nome_usuario(new.morador_id), 'Morador');
begin
  for destino in select * from private.gestores_para_notificar(new.condominio_id) loop
    if destino is distinct from new.morador_id then
      perform private.notificar(
        destino, new.condominio_id, 'NOVA_RECLAMACAO', 'Nova reclamação particular',
        format('%s registrou uma reclamação sigilosa sobre o Bloco %s, Apt %s.', nome, new.bloco_denunciado, new.apartamento_denunciado),
        'reclamacao', new.id::text, 'normal', new.morador_id, nome);
    end if;
  end loop;
  return null;
end;
$$;
