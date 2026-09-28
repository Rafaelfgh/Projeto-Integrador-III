-- Ajustes apontados pelo Security Advisor do Supabase

-- Função de trigger com search_path fixo
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Função de event trigger não deve ser chamável pela API
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Visitante sem login só precisa listar condomínios e categorias (tela de cadastro).
-- O RLS já bloqueava as linhas; aqui tiramos também o acesso às tabelas.
revoke all on public."Masters", public."Moradores", public."Gestao_Sindicos", public."Funcionarios",
              public."Ocorrencias", public."Reclamacoes", public.notificacoes,
              public.funcionario_especialidades, public.ocorrencia_comentarios,
              public.ocorrencia_historico
  from anon;
