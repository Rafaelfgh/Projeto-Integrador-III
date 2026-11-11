// Dependências do condomínio (salão de festas, churrasqueira...) e reservas.
// dias_semana: 0 = domingo ... 6 = sábado (igual ao getDay() do JavaScript e ao "dow" do banco).

export const DIAS_SEMANA = [
  { n: 1, curto: 'Seg', longo: 'segunda' },
  { n: 2, curto: 'Ter', longo: 'terça' },
  { n: 3, curto: 'Qua', longo: 'quarta' },
  { n: 4, curto: 'Qui', longo: 'quinta' },
  { n: 5, curto: 'Sex', longo: 'sexta' },
  { n: 6, curto: 'Sáb', longo: 'sábado' },
  { n: 0, curto: 'Dom', longo: 'domingo' },
];

export const DIAS_RESERVA = 60; // reserva até 60 dias à frente (o banco confere)

// "Todos os dias", "Seg a Sex" ou "Seg, Qua, Sex"
export const resumoDias = (dias = []) => {
  const lista = DIAS_SEMANA.filter(d => dias.includes(d.n));
  if (lista.length === 7) return 'todos os dias';
  const uteis = [1, 2, 3, 4, 5];
  if (lista.length === 5 && uteis.every(n => dias.includes(n))) return 'Seg a Sex';
  return lista.map(d => d.curto).join(', ');
};

export const horaCurta = (h) => String(h || '').slice(0, 5); // "08:00:00" -> "08:00"
export const faixa = (h) => `${horaCurta(h.inicio)} às ${horaCurta(h.fim)}`;

export const resumoDependencia = (d) => (d.tipo === 'dia'
  ? `Dia inteiro · ${resumoDias(d.dias_semana)}`
  : `${d.horarios.length} ${d.horarios.length === 1 ? 'horário' : 'horários'} por dia · ${resumoDias(d.dias_semana)}`);

// Datas em "aaaa-mm-dd" no horário local (sem pular de dia por fuso)
export const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const dataDeIso = (s) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
// "Sábado, 07 de novembro"
export const dataLonga = (s) => {
  const t = dataDeIso(s).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const dataCurta = (s) => dataDeIso(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
