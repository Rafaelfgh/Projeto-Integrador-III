import React, { useId } from 'react';
import { LOGO_PATH } from './logoHabitarePath';
import './LogoHabitareAnimada.css';

// Logo do login: o contorno se desenha como neon, o laranja preenche
// e um reflexo de luz passa por cima. animar={false} mostra a logo pronta.
export default function LogoHabitareAnimada({ animar = true, className = '' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className={`logo-anim${animar ? ' logo-anim-ativa' : ''} ${className}`}
      viewBox="0 0 1298.063255 312.969867"
      role="img"
      aria-label="Habitare"
    >
      <defs>
        <clipPath id={`recorte-${id}`}>
          <path d={LOGO_PATH} transform="translate(-1.153270,313.969867) scale(0.1,-0.1)" />
        </clipPath>
        <linearGradient id={`reflexo-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform="translate(-1.153270,313.969867) scale(0.1,-0.1)">
        <path className="logo-anim-preenche" d={LOGO_PATH} />
        <path className="logo-anim-traco" d={LOGO_PATH} pathLength="1" />
      </g>
      <g clipPath={`url(#recorte-${id})`}>
        <rect className="logo-anim-reflexo" x="-260" y="-40" width="220" height="400"
          fill={`url(#reflexo-${id})`} transform="skewX(-20)" />
      </g>
    </svg>
  );
}
