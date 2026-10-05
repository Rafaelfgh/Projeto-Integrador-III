-- Bolinha de moradores pendentes na "Gestão de Moradores" do master (05/10/2026)
-- A contagem só cai quando o master aprova ou bloqueia o morador (sai de PENDENTE).
-- Função com as permissões de quem chama: o master só enxerga os moradores do condomínio dele.
create or replace function public.contadores_gestao()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'analise',  (select count(*) from public."Ocorrencias" where status = 'Em Análise' and privacidade = 'mural'),
    'pessoais', (select count(*) from public."Ocorrencias" where status = 'Em Análise' and privacidade = 'pessoal'),
    'moradores_pendentes', (select count(*) from public."Moradores" where status = 'PENDENTE')
  );
$$;
