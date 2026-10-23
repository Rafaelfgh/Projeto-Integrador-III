// "Placa" de uma ocorrência, como as placas do prédio: onde é (andar, apartamento ou área)
// em numerais grandes, e o texto da descrição sem a linha "Local Relacionado".

const RE_LOCAL = /\n*\s*Local Relacionado:\s*(.+)\s*$/i;

// Separa a descrição do local que a tela de nova ocorrência anexa no fim do texto
export const separarLocal = (descricao = '') => {
  const m = String(descricao).match(RE_LOCAL);
  if (!m) return { texto: String(descricao).trim(), local: '' };
  return { texto: String(descricao).replace(RE_LOCAL, '').trim(), local: m[1].trim() };
};

const pad = (n) => String(n).padStart(2, '0');

// Lê um local escrito à mão ("Bloco B, corredor do 3º andar", "apto 1201", "Garagem")
const placaDoTexto = (local) => {
  const t = local.toLowerCase();
  const apto = t.match(/\b(?:apto?|apartamento|ap\.?)\s*(\d{2,4})\b/);
  if (apto) return { rotulo: 'Apto', valor: apto[1] };
  const andar = t.match(/(\d{1,2})\s*[ºo°]?\s*andar/);
  if (andar) return { rotulo: 'Andar', valor: pad(andar[1]) };
  if (/t[ée]rreo/.test(t)) return { rotulo: 'Andar', valor: 'T' };
  if (/garagem|subsolo|vaga/.test(t)) return { rotulo: 'Área comum', valor: 'Garagem' };
  if (/hall|portaria|entrada/.test(t)) return { rotulo: 'Área comum', valor: 'Hall' };
  if (/piscina|academia|sal[ãa]o|churrasq|parquinho|playground|quadra/.test(t)) {
    const palavra = local.match(/piscina|academia|sal[ãa]o|churrasqueira|parquinho|playground|quadra/i)[0];
    return { rotulo: 'Área comum', valor: palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase() };
  }
  return { rotulo: 'Local', valor: local };
};

/**
 * @param {object} o ocorrência (privacidade, descricao)
 * @param {{bloco?: string, apartamento?: string}} [unidade] unidade do morador, para as pessoais
 * @returns {{rotulo: string, valor: string, longo: boolean}}
 */
export const placaDaOcorrencia = (o, unidade) => {
  let p;
  if (o?.privacidade === 'pessoal' && unidade?.apartamento) {
    p = { rotulo: unidade.bloco ? `Bloco ${unidade.bloco} · Apto` : 'Apto', valor: String(unidade.apartamento) };
  } else {
    const { local } = separarLocal(o?.descricao);
    p = local ? placaDoTexto(local) : { rotulo: 'Área comum', valor: 'Geral' };
  }
  return { ...p, longo: String(p.valor).length > 4 };
};
