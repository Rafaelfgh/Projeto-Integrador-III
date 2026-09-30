import { supabase } from '../backend/supabaseClient';

// Colunas usadas nas telas de ocorrência (inclui andamento e conclusão)
export const OCORRENCIA_CAMPOS =
  'id, titulo, descricao, categoria, status, privacidade, created_at, updated_at, anexos, ' +
  'atribuido_a, morador_id, pronunciamento, pronunciamento_em, analise_em, analise_por, analise_motivo, ' +
  'andamento_descricao, andamento_em, andamento_por, ' +
  'conclusao_descricao, conclusao_evidencias, concluida_em, concluida_por';

// Mínimo de caracteres exigido pelo banco para descrever andamento/conclusão
export const MIN_DESCRICAO = 5;

// Nomes de quem aparece nas ocorrências (moradores/síndico e funcionários)
export const carregarNomes = async (ids) => {
  const unicos = [...new Set(ids.filter(Boolean))];
  if (unicos.length === 0) return {};
  const [moradores, funcionarios] = await Promise.all([
    supabase.rpc('nomes_moradores', { p_ids: unicos }),
    supabase.from('Funcionarios').select('id, nome').in('id', unicos),
  ]);
  const nomes = {};
  (moradores.data || []).forEach(m => { nomes[m.id] = m.nome; });
  (funcionarios.data || []).forEach(f => { nomes[f.id] = f.nome; });
  return nomes;
};

// Fotos de prova ficam em bucket privado: gera links temporários (1 h).
// O banco só assina fotos de ocorrências que a pessoa pode ver.
export const assinarEvidencias = async (caminhos) => {
  const unicos = [...new Set(caminhos.filter(Boolean))];
  if (unicos.length === 0) return {};
  const { data, error } = await supabase.storage.from('evidencias').createSignedUrls(unicos, 3600);
  if (error) {
    console.error('Erro ao gerar links das provas:', error);
    return {};
  }
  return Object.fromEntries((data || []).filter(d => d.signedUrl).map(d => [d.path, d.signedUrl]));
};

// Envia fotos para <condominio>/<ocorrencia>/[subpasta/]<arquivo> e devolve os caminhos
// (subpasta 'conversa' = fotos da conversa das ocorrências pessoais)
export const enviarEvidencias = async (condominioId, ocorrenciaId, arquivos, subpasta = '') => {
  const caminhos = [];
  for (const arquivo of arquivos) {
    const ext = arquivo.name.split('.').pop()?.toLowerCase() || 'jpg';
    const pasta = subpasta ? `${condominioId}/${ocorrenciaId}/${subpasta}` : `${condominioId}/${ocorrenciaId}`;
    const caminho = `${pasta}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('evidencias').upload(caminho, arquivo);
    if (error) throw new Error(`Falha ao enviar a foto ${arquivo.name}: ${error.message}`);
    caminhos.push(caminho);
  }
  return caminhos;
};

export const mudarStatus = async (ocorrenciaId, status, descricao = null, evidencias = []) => {
  const { error } = await supabase.rpc('mudar_status_ocorrencia', {
    p_ocorrencia_id: ocorrenciaId,
    p_status: status,
    p_descricao: descricao,
    p_evidencias: evidencias,
  });
  if (error) throw new Error(error.message);
};
