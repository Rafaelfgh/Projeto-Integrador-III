-- Excluir dependência apaga todos os agendamentos dela (decisão do dono, 04/11/2026).
-- Quem tinha reserva futura é avisado por notificação de que ela foi cancelada.
create or replace function public.remover_dependencia(p_dependencia bigint)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  dep record;
  r   record;
  qtd integer := 0;
begin
  select id, nome, condominio_id into dep from public.dependencias where id = p_dependencia;
  if dep.id is null or not private.is_master(dep.condominio_id) then
    raise exception 'Só o master remove dependências.' using errcode = '42501';
  end if;

  for r in
    select id, morador_id, data, inicio, fim from public.reservas
     where dependencia_id = dep.id and status = 'ativa' and data >= private.hoje_br()
  loop
    perform private.notificar(
      r.morador_id, dep.condominio_id, 'RESERVA_CANCELADA', 'Reserva cancelada',
      format('A dependência "%s" foi removida pela administração, e a sua reserva de %s%s foi cancelada.',
             dep.nome, to_char(r.data, 'DD/MM/YYYY'),
             case when r.inicio is null then '' else ' (' || to_char(r.inicio, 'HH24:MI') || ' às ' || to_char(r.fim, 'HH24:MI') || ')' end),
      'reserva', null, 'normal', null, 'Administração');
    qtd := qtd + 1;
  end loop;

  delete from public.reservas where dependencia_id = dep.id;
  delete from public.dependencias where id = dep.id;
  return qtd;
end;
$$;

revoke all on function public.remover_dependencia(bigint) from public, anon;
grant execute on function public.remover_dependencia(bigint) to authenticated;
