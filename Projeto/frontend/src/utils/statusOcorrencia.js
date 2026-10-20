// Cores oficiais dos status de ocorrência, iguais em todas as telas:
// Aberta = vermelho · Em Análise = azul · Em Andamento = âmbar · Resolvida (Concluída) = verde.
// Os selos usam as classes .st-* (index.css); gráficos e barras usam a cor sólida.
export const STATUS_COR = {
  'Aberta':       '#ef4444',
  'Em Análise':   '#3b82f6',
  'Em Andamento': '#f59e0b',
  'Resolvida':    '#10b981',
};

const CLASSE = {
  'Aberta':       'st-aberta',
  'Em Análise':   'st-analise',
  'Em Andamento': 'st-andamento',
  'Resolvida':    'st-resolvida',
};

export const classeStatus = (status) => CLASSE[status] || '';
