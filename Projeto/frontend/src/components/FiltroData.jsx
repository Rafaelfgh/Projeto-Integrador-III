import React from 'react';
import { CalendarDays } from 'lucide-react';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const FILTRO_DATA_VAZIO = { dia: '', mes: '', ano: '' };
export const temFiltroData = (f) => Boolean(f.dia || f.mes || f.ano);

// Dia, mês e ano são independentes: só "25" = dia 25 de qualquer mês/ano;
// os três juntos = aquele dia exato.
export const passaFiltroData = (data, f) => {
  if (!temFiltroData(f)) return true;
  if (!data) return false;
  const d = new Date(data);
  return (!f.dia || d.getDate() === Number(f.dia))
    && (!f.mes || d.getMonth() + 1 === Number(f.mes))
    && (!f.ano || d.getFullYear() === Number(f.ano));
};

// anos: lista de anos para escolher (normalmente os que aparecem nos dados)
export const anosDe = (datas) =>
  [...new Set(datas.filter(Boolean).map(d => new Date(d).getFullYear()))].sort((a, b) => b - a);

export default function FiltroData({ valor, onChange, anos, rotulo = 'Filtrar por data' }) {
  const muda = (campo) => (e) => onChange({ ...valor, [campo]: e.target.value });
  return (
    <div className="filtro-data">
      <span className="filtro-data-rotulo"><CalendarDays size={16} /> {rotulo}</span>
      <select className="saas-select" value={valor.dia} onChange={muda('dia')} aria-label="Dia">
        <option value="">Dia</option>
        {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
      </select>
      <select className="saas-select" value={valor.mes} onChange={muda('mes')} aria-label="Mês">
        <option value="">Mês</option>
        {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </select>
      <select className="saas-select" value={valor.ano} onChange={muda('ano')} aria-label="Ano">
        <option value="">Ano</option>
        {anos.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
      {temFiltroData(valor) && (
        <button type="button" className="btn-secondary filtro-data-limpar" onClick={() => onChange(FILTRO_DATA_VAZIO)}>
          Limpar
        </button>
      )}
    </div>
  );
}
