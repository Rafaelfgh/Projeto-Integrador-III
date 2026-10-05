import React from 'react';
import './MarcaHabitare.css';

// Marca Habitare (logo sem caixa + nome em laranja, com brilho leve que pulsa).
// Usada no menu das páginas logadas e no topo das telas de cadastro.
// brilho={false}: sem desfoque nem pulso (telas de cadastro, fundo claro).
export default function MarcaHabitare({ brilho = true, className = '' }) {
  return (
    <span className={`marca${brilho ? '' : ' marca-limpa'} ${className}`}>
      {/* a cópia de cima da logo só pulsa na transparência (leve para a placa de vídeo) */}
      <span className="marca-logo">
        <img src="/logo_habitare.png" alt="" className="marca-logo-img" />
        <img src="/logo_habitare.png" alt="" aria-hidden="true" className="marca-logo-img marca-brilho" />
      </span>
      <span className="marca-nome" data-texto="Habitare">Habitare</span>
    </span>
  );
}
