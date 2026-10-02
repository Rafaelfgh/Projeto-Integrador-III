-- Recados não lidos (bolinha no menu) — 02/10/2026
--
-- Para cada pessoa e recado guarda até quando ela leu (recado_leituras.lido_em).
-- Não lidos de um recado = 1 se a pessoa é funcionário destinatário e ainda não abriu
-- + cada resposta de outra pessoa depois da última leitura. Abrir o recado zera.

create table if not exists public.recado_leituras (
  recado_id  bigint not null references public.recados(id) on delete cascade,
  usuario_id uuid not null,
  lido_em    timestamptz not null default now(),
  primary key (recado_id, usuario_id)
);

-- Acesso só pelas funções abaixo
alter table public.recado_leituras enable row level security;
revoke all on public.recado_leituras from anon, authenticated;

create or replace function public.recados_nao_lidos()
returns table(recado_id bigint, nao_lidos integer)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
         ( case when l.lido_em is null
                 and r.autor_id is distinct from auth.uid()
                 and private.is_funcionario(r.condominio_id)
                 and (r.para_todos or exists (select 1 from public.recado_destinatarios d
                                               where d.recado_id = r.id and d.funcionario_id = auth.uid()))
                then 1 else 0 end
         + (select count(*) from public.recado_respostas x
             where x.recado_id = r.id
               and x.autor_id is distinct from auth.uid()
               and (l.lido_em is null or x.created_at > l.lido_em))
         )::integer
    from public.recados r
    left join public.recado_leituras l on l.recado_id = r.id and l.usuario_id = auth.uid()
   where private.pode_ver_recado(r.id);
$$;

create or replace function public.marcar_recado_lido(p_recado bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.pode_ver_recado(p_recado) then
    return;
  end if;
  insert into public.recado_leituras (recado_id, usuario_id, lido_em)
  values (p_recado, auth.uid(), now())
  on conflict (recado_id, usuario_id) do update set lido_em = excluded.lido_em;
end;
$$;

revoke all on function public.recados_nao_lidos() from public, anon;
revoke all on function public.marcar_recado_lido(bigint) from public, anon;
grant execute on function public.recados_nao_lidos() to authenticated;
grant execute on function public.marcar_recado_lido(bigint) to authenticated;
