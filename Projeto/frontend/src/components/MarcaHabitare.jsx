import React from 'react';
import './MarcaHabitare.css';

// Marca Habitare (logo horizontal: prédio + nome, em laranja).
// Usada no menu das páginas logadas e no topo das telas de cadastro.
export default function MarcaHabitare({ className = '' }) {
  return (
    <span className={`marca ${className}`}>
      <span className="marca-logo">
        <img src="/Habitare-logo-predio.svg" alt="Habitare" className="marca-logo-img" />
      </span>
    </span>
  );
}
