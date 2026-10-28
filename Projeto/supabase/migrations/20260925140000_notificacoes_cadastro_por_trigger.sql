-- =============================================================================
-- Notificações de aprovação, bloqueio e síndico geradas pelo banco.
-- Antes eram enviadas pelo navegador do Master e falhavam: o insert pedia a
-- linha de volta (RETURNING) e o RLS só deixa o destinatário ler a notificação.
-- =============================================================================

-- Morador: aprovado, bloqueado ou desbloqueado
create or replace function private.tg_morador_status() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  ator text := coalesce(private.nome_usuario(auth.uid()), 'Administração');
begin
  if new.status is distinct from old.status then
    if new.status = 'ATIVO' and old.status = 'PENDENTE' then
      perform private.notificar(new.id, new.condominio_id, 'CADASTRO_APROVADO', 'Cadastro aprovado',
        'Seu cadastro foi aprovado pela administração. Bem-vindo(a)!', 'morador', new.id::text, 'normal', auth.uid(), ator);
    elsif new.status = 'BLOQUEADO' then
      perform private.notificar(new.id, new.condominio_id, 'CADASTRO_BLOQUEADO', 'Acesso bloqueado',
        'Seu acesso foi bloqueado pela administração do condomínio.', 'morador', new.id::text, 'normal', auth.uid(), ator);
    elsif new.status = 'ATIVO' and old.status = 'BLOQUEADO' then
      perform private.notificar(new.id, new.condominio_id, 'ACESSO_RESTABELECIDO', 'Acesso desbloqueado',
        'Seu acesso ao Habitare foi restabelecido.', 'morador', new.id::text, 'normal', auth.uid(), ator);
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_moradores_status on public."Moradores";
create trigger trg_moradores_status
  after update of status on public."Moradores"
  for each row execute function private.tg_morador_status();

-- Funcionário: bloqueado ou desbloqueado
create or replace function private.tg_funcionario_status() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  ator text := coalesce(private.nome_usuario(auth.uid()), 'Administração');
begin
  if new.status is distinct from old.status then
    if new.status = 'BLOQUEADO' then
      perform private.notificar(new.id, new.condominio_id, 'CADASTRO_BLOQUEADO', 'Acesso bloqueado',
        'Seu acesso foi bloqueado pela administração do condomínio.', 'funcionario', new.id::text, 'normal', auth.uid(), ator);
    elsif new.status = 'ATIVO' then
      perform private.notificar(new.id, new.condominio_id, 'ACESSO_RESTABELECIDO', 'Acesso desbloqueado',
        'Seu acesso ao Habitare foi restabelecido.', 'funcionario', new.id::text, 'normal', auth.uid(), ator);
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_funcionarios_status on public."Funcionarios";
create trigger trg_funcionarios_status
  after update of status on public."Funcionarios"
  for each row execute function private.tg_funcionario_status();

-- Síndico: nomeado ou removido
create or replace function private.tg_gestao_sindico() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  ator text := coalesce(private.nome_usuario(auth.uid()), 'Administração');
begin
  if new.ativo and (tg_op = 'INSERT' or not old.ativo) then
    perform private.notificar(new.morador_id, new.condominio_id, 'SINDICO_PROMOVIDO', 'Você agora é o síndico',
      'Você foi nomeado síndico do condomínio. Entre de novo para acessar o painel do síndico.',
      'sindico', new.id::text, 'normal', auth.uid(), ator);
  elsif tg_op = 'UPDATE' and old.ativo and not new.ativo then
    perform private.notificar(new.morador_id, new.condominio_id, 'SINDICO_REMOVIDO', 'Mandato de síndico encerrado',
      'Seu perfil voltou a ser de morador.', 'sindico', new.id::text, 'normal', auth.uid(), ator);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_gestao_sindicos on public."Gestao_Sindicos";
create trigger trg_gestao_sindicos
  after insert or update of ativo on public."Gestao_Sindicos"
  for each row execute function private.tg_gestao_sindico();
