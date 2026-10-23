// "Placa" de uma ocorrência, como as placas do prédio: o local em letras grandes,
// e o texto da descrição sem a linha "Local Relacionado".

const RE_LOCAL = /\n*\s*Local Relacionado:\s*(.+)\s*$/i;

// Separa a descrição do local que a tela de nova ocorrência anexa no fim do texto
export const separarLocal = (descricao = '') => {
  const m = String(descricao).match(RE_LOCAL);
  if (!m) return { texto: String(descricao).trim(), local: '' };
  return { texto: String(descricao).replace(RE_LOCAL, '').trim(), local: m[1].trim() };
};

/**
 * @param {object} o ocorrência (privacidade, descricao)
 * @param {{bloco?: string, apartamento?: string}} [unidade] unidade do morador, para as pessoais
 * @returns {{rotulo: string, valor: string, longo: boolean}}
 */
export const placaDaOcorrencia = (o, unidade) => {
  // Sempre "Local" em cima e o local como foi escolhido embaixo (decisão do dono, 23/10)
  let valor;
  if (o?.privacidade === 'pessoal' && unidade?.apartamento) {
    valor = unidade.bloco ? `Bloco ${unidade.bloco} · Apto ${unidade.apartamento}` : `Apto ${unidade.apartamento}`;
  } else {
    valor = separarLocal(o?.descricao).local || 'Área comum';
  }
  // mesmo tamanho de letra para todo local (padronizado, curto ou longo)
  return { rotulo: 'Local', valor, longo: true };
};
