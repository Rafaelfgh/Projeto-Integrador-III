-- Abertas há mais de 2 dias sem análise nem atendimento — 26/10/2026 (pedido do dono)
-- 1) contador para a bolinha do menu ("Abertas +2 dias"), em contadores_gestao;
-- 2) aviso ao síndico (ou ao Master, se não houver síndico) quando a ocorrência completa 2 dias
--    ainda "Aberta" — uma vez por ocorrência, conferido de hora em hora pelo pg_cron.

alter table public."Ocorrencias"
  add column if not exists abertura_notificada_em timestamptz;

-- Só o sistema (cron, sem usuário logado) marca o aviso; pelo app a coluna não muda
create or replace function private.tg_guardar_abertura_notificada()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.abertura_notificada_em := case when tg_op = 'UPDATE' then old.abertura_notificada_em end;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guardar_abertura_notificada on public."Ocorrencias";
create trigger trg_guardar_abertura_notificada
  before insert or update on public."Ocorrencias"
  for each row execute function private.tg_guardar_abertura_notificada();

create or replace function private.verificar_aberta_prolongada()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  oc      record;
  destino uuid;
begin
  for oc in
    select o.id, o.titulo, o.condominio_id, o.created_at
      from public."Ocorrencias" o
     where o.status = 'Aberta'
       and o.created_at < now() - interval '2 days'
       and o.abertura_notificada_em is null
  loop
    for destino in select * from private.gestores_para_notificar(oc.condominio_id) loop
      perform private.notificar(
        destino, oc.condominio_id, 'ABERTA_PROLONGADA', 'Aberta há mais de 2 dias sem atendimento',
        format('"%s" foi aberta em %s e ainda não foi analisada nem atendida.',
               oc.titulo, to_char(oc.created_at at time zone 'America/Sao_Paulo', 'DD/MM "às" HH24:MI')),
        'ocorrencia', oc.id::text, 'normal', null, 'Sistema');
    end loop;
    update public."Ocorrencias" set abertura_notificada_em = now() where id = oc.id;
  end loop;
end;
$$;

revoke all on function private.verificar_aberta_prolongada() from public, anon, authenticated;

select cron.schedule('ocorrencias-abertas-prolongadas', '5 * * * *', 'select private.verificar_aberta_prolongada()');

-- Bolinha do menu: mesma regra da aba (RLS: cada um conta o que pode ver)
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
    'moradores_pendentes', (select count(*) from public."Moradores" where status = 'PENDENTE')
  );
$$;
