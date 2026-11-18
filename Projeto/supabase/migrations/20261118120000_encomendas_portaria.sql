-- Portaria: funcionário marcado como porteiro registra encomendas no "livro de encomendas".
-- Todos os moradores do apartamento são avisados; quem retira confirma no app (assinatura eletrônica).
-- Nada se apaga: porteiro, síndico e master consultam o livro inteiro (casos de perda).

alter table public."Funcionarios" add column if not exists porteiro boolean not null default false;

create or replace function private.is_porteiro(cond bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public."Funcionarios" f
    where f.id = auth.uid() and f.condominio_id = cond and f.status = 'ATIVO' and f.porteiro
  );
$$;

-- Morador ativo daquela unidade (o síndico também é morador)
create or replace function private.mora_na_unidade(cond bigint, p_bloco text, p_apartamento text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public."Moradores" m
    where m.id = auth.uid() and m.condominio_id = cond and m.status = 'ATIVO'
      and upper(trim(coalesce(m.bloco, ''))) = upper(trim(coalesce(p_bloco, '')))
      and upper(trim(m.apartamento)) = upper(trim(p_apartamento))
  );
$$;

create table public.encomendas (
  id                  bigint generated always as identity primary key,
  condominio_id       bigint not null references public."Condominios"(id) on delete cascade,
  bloco               text not null default '',
  apartamento         text not null check (char_length(apartamento) between 1 and 20),
  destinatario        text not null check (char_length(destinatario) between 1 and 120),
  chegou_em           timestamptz not null,
  foto                text not null,
  observacao          text check (char_length(observacao) <= 300),
  -- assinatura do porteiro (sem chave estrangeira: o registro sobrevive à remoção do funcionário)
  registrada_por      uuid not null,
  registrada_por_nome text not null,
  registrada_em       timestamptz not null default now(),
  -- assinatura de quem retirou
  retirada_por        uuid,
  retirada_por_nome   text,
  retirada_em         timestamptz
);
create index encomendas_unidade_idx on public.encomendas (condominio_id, bloco, apartamento);

alter table public.encomendas enable row level security;
grant select on public.encomendas to authenticated;
-- Só leitura direta; registrar e confirmar são pelas funções abaixo (que assinam pelo usuário)
create policy encomendas_select on public.encomendas for select to authenticated using (
  private.is_gestor(condominio_id) or private.is_porteiro(condominio_id)
  or private.mora_na_unidade(condominio_id, bloco, apartamento)
);

create or replace function public.registrar_encomenda(
  p_bloco text, p_apartamento text, p_destinatario text, p_chegou_em timestamptz,
  p_foto text, p_observacao text default null
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_func public."Funcionarios"%rowtype;
  v_id   bigint;
  v_unid text;
begin
  select * into v_func from public."Funcionarios" where id = auth.uid();
  if v_func.id is null or not private.is_porteiro(v_func.condominio_id) then
    raise exception 'Só o porteiro registra encomendas.';
  end if;
  if coalesce(trim(p_apartamento), '') = '' or coalesce(trim(p_destinatario), '') = '' then
    raise exception 'Informe o apartamento e para quem é a encomenda.';
  end if;
  if p_chegou_em is null or p_chegou_em > now() + interval '5 minutes' then
    raise exception 'A data e o horário de chegada não podem estar no futuro.';
  end if;
  if split_part(coalesce(p_foto, ''), '/', 1) <> v_func.condominio_id::text then
    raise exception 'Envie a foto do pacote.';
  end if;

  insert into public.encomendas (condominio_id, bloco, apartamento, destinatario, chegou_em, foto, observacao,
                                 registrada_por, registrada_por_nome)
  values (v_func.condominio_id, upper(coalesce(trim(p_bloco), '')), upper(trim(p_apartamento)), trim(p_destinatario), p_chegou_em,
          p_foto, nullif(trim(p_observacao), ''), v_func.id, v_func.nome)
  returning id into v_id;

  v_unid := case when coalesce(trim(p_bloco), '') = '' then 'Apto ' || trim(p_apartamento)
                 else 'Bloco ' || trim(p_bloco) || ', Apto ' || trim(p_apartamento) end;

  -- Todo mundo do apartamento é avisado, seja para quem for o pacote
  insert into public.notificacoes (destinatario_id, condominio_id, tipo, titulo, descricao,
                                   referencia_tipo, referencia_id, remetente_id, remetente_nome, prioridade)
  select m.id, v_func.condominio_id, 'NOVA_ENCOMENDA', 'Chegou uma encomenda na portaria',
         'Para ' || trim(p_destinatario) || ' (' || v_unid || '). Retire na portaria e confirme no app.',
         'encomenda', v_id::text, v_func.id, v_func.nome, 'normal'
  from public."Moradores" m
  where m.condominio_id = v_func.condominio_id and m.status = 'ATIVO'
    and upper(trim(coalesce(m.bloco, ''))) = upper(coalesce(trim(p_bloco), ''))
    and upper(trim(m.apartamento)) = upper(trim(p_apartamento));

  return v_id;
end $$;

create or replace function public.confirmar_retirada_encomenda(p_encomenda_id bigint)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_enc  public.encomendas%rowtype;
  v_nome text;
begin
  select * into v_enc from public.encomendas where id = p_encomenda_id for update;
  if v_enc.id is null or not private.mora_na_unidade(v_enc.condominio_id, v_enc.bloco, v_enc.apartamento) then
    raise exception 'Só um morador do apartamento confirma a retirada.';
  end if;
  if v_enc.retirada_em is not null then
    raise exception 'Esta encomenda já foi retirada por %.', v_enc.retirada_por_nome;
  end if;
  select nome into v_nome from public."Moradores" where id = auth.uid();
  update public.encomendas
     set retirada_por = auth.uid(), retirada_por_nome = v_nome, retirada_em = now()
   where id = p_encomenda_id;
end $$;

-- Gestão marca/desmarca o porteiro
create or replace function public.definir_porteiro(p_funcionario_id uuid, p_porteiro boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare v_cond bigint;
begin
  select condominio_id into v_cond from public."Funcionarios" where id = p_funcionario_id;
  if v_cond is null or not private.is_gestor(v_cond) then
    raise exception 'Só o síndico ou o master define o porteiro.';
  end if;
  update public."Funcionarios" set porteiro = p_porteiro where id = p_funcionario_id;
end $$;

revoke all on function public.registrar_encomenda(text, text, text, timestamptz, text, text) from public, anon;
revoke all on function public.confirmar_retirada_encomenda(bigint) from public, anon;
revoke all on function public.definir_porteiro(uuid, boolean) from public, anon;
grant execute on function public.registrar_encomenda(text, text, text, timestamptz, text, text) to authenticated;
grant execute on function public.confirmar_retirada_encomenda(bigint) to authenticated;
grant execute on function public.definir_porteiro(uuid, boolean) to authenticated;

-- meu_perfil passa a dizer se o funcionário é porteiro
create or replace function public.meu_perfil()
returns jsonb language plpgsql stable security definer set search_path = '' as $function$
declare
  uid uuid := auth.uid();
  r   jsonb;
begin
  if uid is null then
    return null;
  end if;

  select jsonb_build_object('id', d.id, 'nome', d.nome, 'papel', 'DEV', 'status', 'ATIVO', 'condominio_id', null)
    into r
  from public.desenvolvedores d
  where d.id = uid;

  if r is null then
    select jsonb_build_object(
             'id', m.id, 'nome', m.nome, 'papel', 'MASTER',
             'status', coalesce(c.status, 'ATIVO'), 'motivo_recusa', c.motivo_recusa,
             'condominio_id', coalesce(c.id, m.condominio_id),
             'telefone', m.telefone, 'cpf', m.cpf_ou_cnpj)
      into r
    from public."Masters" m
    left join public."Condominios" c on c.master_id = m.id
    where m.id = uid
    limit 1;
  end if;

  if r is null then
    select jsonb_build_object(
             'id', f.id, 'nome', f.nome, 'papel', 'FUNCIONARIO', 'status', f.status,
             'condominio_id', f.condominio_id,
             'precisa_trocar_senha', f.precisa_trocar_senha, 'foto', f.foto, 'porteiro', f.porteiro,
             'especialidades', coalesce(
               (select jsonb_agg(e.categoria order by e.categoria)
                from public.funcionario_especialidades e where e.funcionario_id = f.id),
               '[]'::jsonb))
      into r
    from public."Funcionarios" f
    where f.id = uid;
  end if;

  if r is null then
    select jsonb_build_object(
             'id', m.id, 'nome', m.nome,
             'papel', case when exists (
                        select 1 from public."Gestao_Sindicos" g
                        where g.morador_id = m.id and g.condominio_id = m.condominio_id and g.ativo)
                      then 'SINDICO' else 'MORADOR' end,
             'status', m.status, 'condominio_id', m.condominio_id,
             'telefone', m.telefone, 'cpf', m.cpf, 'bloco', m.bloco, 'apartamento', m.apartamento)
      into r
    from public."Moradores" m
    where m.id = uid;
  end if;

  if r is null then
    return null;
  end if;

  return r || jsonb_build_object(
    'email', (select u.email from auth.users u where u.id = uid),
    'condominio_nome', (select c.nome from public."Condominios" c where c.id = (r ->> 'condominio_id')::bigint));
end;
$function$;

-- Fotos dos pacotes: pasta privada <condominio>/<arquivo>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('encomendas', 'encomendas', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy encomendas_foto_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'encomendas' and split_part(name, '/', 1) ~ '^\d+$'
  and private.is_porteiro(split_part(name, '/', 1)::bigint)
);
-- Vê a foto quem vê a encomenda (RLS de encomendas); o porteiro vê as que enviou
create policy encomendas_foto_select on storage.objects for select to authenticated using (
  bucket_id = 'encomendas' and (
    exists (select 1 from public.encomendas e where e.foto = name)
    or (split_part(name, '/', 1) ~ '^\d+$' and private.is_porteiro(split_part(name, '/', 1)::bigint))
  )
);
