-- Notificação no celular (só no app Android): cada aparelho logado guarda seu token do Firebase.
-- Toda linha nova em "notificacoes" chama a Edge Function enviar-push, que manda para os aparelhos do destinatário.

create table public.dispositivos_push (
  token         text primary key,
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  plataforma    text not null default 'android',
  atualizado_em timestamptz not null default now()
);
create index dispositivos_push_usuario_idx on public.dispositivos_push (usuario_id);
alter table public.dispositivos_push enable row level security;
-- Ninguém lê nem grava direto: só pelas funções abaixo (a Edge Function usa a chave de serviço)

-- O mesmo aparelho pode trocar de conta: o token passa a ser de quem entrou por último
create or replace function public.registrar_dispositivo_push(p_token text, p_plataforma text default 'android')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or coalesce(length(p_token), 0) not between 20 and 4096 then
    raise exception 'Token inválido.';
  end if;
  insert into public.dispositivos_push (token, usuario_id, plataforma)
  values (p_token, auth.uid(), coalesce(p_plataforma, 'android'))
  on conflict (token) do update set usuario_id = auth.uid(), plataforma = excluded.plataforma, atualizado_em = now();
end $$;

-- Ao sair da conta o aparelho para de receber
create or replace function public.remover_dispositivo_push(p_token text)
returns void language sql security definer set search_path = '' as $$
  delete from public.dispositivos_push where token = p_token and usuario_id = auth.uid();
$$;

revoke all on function public.registrar_dispositivo_push(text, text) from public, anon;
revoke all on function public.remover_dispositivo_push(text) from public, anon;
grant execute on function public.registrar_dispositivo_push(text, text) to authenticated;
grant execute on function public.remover_dispositivo_push(text) to authenticated;

-- Cada notificação é enviada ao celular uma vez só
alter table public.notificacoes add column if not exists push_enviado_em timestamptz;

create extension if not exists pg_net with schema extensions;

-- Avisa a Edge Function só com o id; ela confere tudo no banco (não confia no que recebe)
create or replace function private.tg_notificacao_push()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.dispositivos_push d where d.usuario_id = new.destinatario_id) then
    perform net.http_post(
      url := 'https://jriqexuopvbsomzvhbgj.supabase.co/functions/v1/enviar-push',
      body := jsonb_build_object('notificacao_id', new.id),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  end if;
  return new;
end $$;

create trigger trg_notificacoes_push after insert on public.notificacoes
for each row execute function private.tg_notificacao_push();
