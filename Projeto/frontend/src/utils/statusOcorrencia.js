// Cores oficiais dos status de ocorrência, iguais em todas as telas:
// Aberta = vermelho · Em Análise = azul · Em Andamento = âmbar · Resolvida (Concluída) = verde.
// Os selos usam as classes .st-* (index.css); gráficos e barras usam a cor sólida.
export const STATUS_COR = {
  'Aberta':       '#dc2626',
  'Em Análise':   '#1d4ed8',
  'Em Andamento': '#f59e0b',
  'Resolvida':    '#047857',
};

const CLASSE = {
  'Aberta':       'st-aberta',
  'Em Análise':   'st-analise',
  'Em Andamento': 'st-andamento',
  'Resolvida':    'st-resolvida',
};

export const classeStatus = (status) => CLASSE[status] || '';
