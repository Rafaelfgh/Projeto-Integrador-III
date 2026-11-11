-- Bolinha de "Em andamento +2 dias" no menu (pedido do dono, 29/10/2026): conta as ocorrências
-- em andamento há mais de 2 dias (mesma regra da aba). Não some ao abrir a aba — só quando a
-- ocorrência sai dessa situação (concluída, volta para análise ou é reatribuída).
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
    'andamento_parados', (select count(*) from public."Ocorrencias" where status = 'Em Andamento' and andamento_em < now() - interval '2 days'),
    'reclamacoes_abertas', (select count(*) from public."Reclamacoes" r where r.respondida_em is null and private.is_sindico(r.condominio_id)),
    'moradores_pendentes', (select count(*) from public."Moradores" where status = 'PENDENTE')
  );
$$;
