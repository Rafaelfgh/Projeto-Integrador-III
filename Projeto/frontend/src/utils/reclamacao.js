// Reclamação de um morador sobre outra unidade. Não é anônima: só o síndico vê,
// sabe quem reclamou e responde apenas a essa pessoa (decisão do dono, 27/10/2026).

// Tipos (mesmos valores da tela Nova Reclamação)
export const TIPO_RECLAMACAO = {
  barulho: 'Barulho fora do horário',
  lixo: 'Descarte irregular de lixo',
  estacionamento: 'Uso indevido de vaga',
  pets: 'Problemas com pets',
  outro: 'Outro tipo',
};

// A reclamação é gravada como texto: "Tipo de Violação: x\nData: aaaa-mm-dd\nHora: hh:mm\n\nDescrição do Morador: ..."
export const lerReclamacao = (txt = '') => {
  const pega = (rotulo) => (String(txt).match(new RegExp(`${rotulo}:[ \\t]*(.*)`))?.[1] || '').trim();
  const tipo = pega('Tipo de Violação');
  const [a, m, d] = pega('Data').split('-');
  const hora = pega('Hora');
  return {
    tipo: TIPO_RECLAMACAO[tipo] || (tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'Reclamação'),
    quando: d ? `${d}/${m}/${a}${hora ? ` · ${hora}` : ''}` : '',
    texto: (String(txt).split('Descrição do Morador:')[1] ?? txt).trim(),
  };
};

const semPrefixoApto = (v) => String(v || '—').replace(/^ap(to|t)?\.?\s*/i, ''); // registros antigos: "AP 802"

// "Bloco B · Apto 801" (registros antigos podem ter bloco "Ver unidade" ou vazio)
export const unidadeTexto = (bloco, apto) => {
  const blocoValido = bloco && bloco !== 'Ver unidade' ? String(bloco).toUpperCase() : '';
  return `${blocoValido ? `Bloco ${blocoValido} · ` : ''}Apto ${semPrefixoApto(apto)}`;
};

export const dataBR = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '');
