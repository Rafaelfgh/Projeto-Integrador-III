-- Exclusão de conta pedida pelo próprio usuário (exigência da Google Play / LGPD).
-- Fluxo: o usuário pede no Perfil -> a Equipe Habitare (DEV) vê em "Exclusões de conta"
-- e conclui -> a conta de login é apagada e, em cascata, os dados pessoais ligados a ela.
-- O pedido não pode ser negado; o DEV só confirma (ou o próprio usuário desiste antes).

create table if not exists public.pedidos_exclusao_conta (
  id            bigint generated always as identity primary key,
  usuario_id    uuid not null,            -- sem FK: o registro fica depois que a conta some
  email         text,
  nome          text,
  papel         text,
  condominio_id bigint,
  motivo        text check (motivo is null or char_length(motivo) <= 500),
  status        text not null default 'PENDENTE' check (status in ('PENDENTE','CONCLUIDO','CANCELADO')),
  criado_em     timestamptz not null default now(),
  concluido_em  timestamptz,
  concluido_por uuid
);

create unique index if not exists pedidos_exclusao_um_pendente
  on public.pedidos_exclusao_conta (usuario_id) where status = 'PENDENTE';

alter table public.pedidos_exclusao_conta enable row level security;

drop policy if exists "ver proprio pedido ou dev" on public.pedidos_exclusao_conta;
create policy "ver proprio pedido ou dev" on public.pedidos_exclusao_conta
  for select to authenticated
  using (usuario_id = (select auth.uid()) or (select private.is_dev()));
-- Sem insert/update/delete direto: tudo passa pelas funções abaixo.

-- Usuário pede a exclusão da própria conta
create or replace function public.solicitar_exclusao_conta(p_motivo text default null)
returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id  bigint;
  v_nome text;
  v_papel text;
  v_cond bigint;
  v_dev record;
begin
  if v_uid is null then raise exception 'Faça login para pedir a exclusão.'; end if;

  select id into v_id from public.pedidos_exclusao_conta
   where usuario_id = v_uid and status = 'PENDENTE';
  if v_id is not null then return v_id; end if;

  select coalesce(
    (select condominio_id from public."Moradores"    where id = v_uid),
    (select condominio_id from public."Funcionarios" where id = v_uid),
    (select condominio_id from public."Masters"      where id = v_uid)) into v_cond;
  v_papel := private.papel_usuario(v_uid, v_cond);
  v_nome  := private.nome_usuario(v_uid);

  insert into public.pedidos_exclusao_conta (usuario_id, email, nome, papel, condominio_id, motivo)
  values (v_uid, (select email from auth.users where id = v_uid), v_nome, v_papel, v_cond,
          nullif(btrim(coalesce(p_motivo, '')), ''))
  returning id into v_id;

  -- Avisa a Equipe Habitare
  for v_dev in select id from public.desenvolvedores loop
    perform private.notificar(v_dev.id, null, 'EXCLUSAO_CONTA', 'Pedido de exclusão de conta',
      coalesce(v_nome, 'Um usuário') || ' pediu para excluir a conta.', 'exclusao', v_id::text,
      'urgente', v_uid, v_nome);
  end loop;

  return v_id;
end $$;

-- Usuário desiste do pedido (enquanto ainda está pendente)
create or replace function public.cancelar_exclusao_conta()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.pedidos_exclusao_conta
     set status = 'CANCELADO', concluido_em = now(), concluido_por = auth.uid()
   where usuario_id = auth.uid() and status = 'PENDENTE';
end $$;

-- Lista para a Equipe Habitare
create or replace function public.pedidos_exclusao_para_dev()
returns setof public.pedidos_exclusao_conta
language sql stable security definer set search_path = ''
as $$
  select * from public.pedidos_exclusao_conta
   where private.is_dev()
   order by (status = 'PENDENTE') desc, criado_em desc;
$$;

-- Equipe Habitare conclui: apaga a conta de login (o resto sai em cascata)
create or replace function public.concluir_exclusao_conta(p_pedido bigint)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_ped public.pedidos_exclusao_conta;
begin
  if not private.is_dev() then raise exception 'Apenas a Equipe Habitare conclui exclusões.'; end if;

  select * into v_ped from public.pedidos_exclusao_conta where id = p_pedido for update;
  if v_ped.id is null then raise exception 'Pedido não encontrado.'; end if;
  if v_ped.status <> 'PENDENTE' then raise exception 'Este pedido já foi tratado.'; end if;

  -- O Master é dono do condomínio: apagar a conta dele apagaria o condomínio inteiro
  if exists (select 1 from public."Condominios" where master_id = v_ped.usuario_id) then
    raise exception 'Esta conta é Master de um condomínio. Transfira ou encerre o condomínio antes de excluir.';
  end if;

  delete from public.notificacoes where destinatario_id = v_ped.usuario_id;
  delete from auth.users where id = v_ped.usuario_id;

  update public.pedidos_exclusao_conta
     set status = 'CONCLUIDO', concluido_em = now(), concluido_por = auth.uid(),
         nome = null, motivo = null           -- guarda só e-mail e datas, como prova do atendimento
   where id = p_pedido;
end $$;

revoke all on function public.solicitar_exclusao_conta(text)   from public, anon;
revoke all on function public.cancelar_exclusao_conta()        from public, anon;
revoke all on function public.pedidos_exclusao_para_dev()      from public, anon;
revoke all on function public.concluir_exclusao_conta(bigint)  from public, anon;
grant execute on function public.solicitar_exclusao_conta(text)  to authenticated;
grant execute on function public.cancelar_exclusao_conta()       to authenticated;
grant execute on function public.pedidos_exclusao_para_dev()     to authenticated;
grant execute on function public.concluir_exclusao_conta(bigint) to authenticated;
