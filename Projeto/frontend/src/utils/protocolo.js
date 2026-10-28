// Código de protocolo único, igual em todas as telas (ex.: OCO-2026-0010)
const formatar = (prefixo, id, criadoEm) => {
  const ano = criadoEm ? new Date(criadoEm).getFullYear() : new Date().getFullYear();
  return `${prefixo}-${ano}-${String(id).padStart(4, '0')}`;
};

export const protocoloOcorrencia = (id, criadoEm) => formatar('OCO', id, criadoEm);
export const protocoloReclamacao = (id, criadoEm) => formatar('REC', id, criadoEm);
