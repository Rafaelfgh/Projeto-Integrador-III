import React, { useState } from 'react';
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
  // No celular os três campos ficam atrás de um botão "Data" (economiza espaço na tela)
  const [aberto, setAberto] = useState(false);
  const ativo = temFiltroData(valor);
  const muda = (campo) => (e) => onChange({ ...valor, [campo]: e.target.value });
  return (
    <div className={`filtro-data${aberto || ativo ? ' aberto' : ''}`}>
      <span className="filtro-data-rotulo"><CalendarDays size={16} /> {rotulo}</span>
      <button type="button" className={`filtro-data-alternar${ativo ? ' ativo' : ''}`} aria-expanded={aberto || ativo} onClick={() => setAberto(a => !a)}>
        <CalendarDays size={15} /> {ativo ? 'Data (filtrando)' : 'Data'}
      </button>
      <div className="filtro-data-campos">
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
      </div>
      {ativo && (
        <button type="button" className="btn-secondary filtro-data-limpar" onClick={() => onChange(FILTRO_DATA_VAZIO)}>
          Limpar
        </button>
      )}
    </div>
  );
}
