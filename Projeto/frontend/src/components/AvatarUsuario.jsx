import React from 'react';
import { useUrlFoto } from '../hooks/useUrlFoto';
import './AvatarUsuario.css';

// Bolinha do usuário: a foto (funcionários cadastrados com foto) ou a inicial do nome.
// tamanho em px; sem tamanho, quem usa define pelo className.
export default function AvatarUsuario({ nome, foto, tamanho, cor = 'var(--role-primary-color)', versao = 0, className = '', style }) {
  const url = useUrlFoto(foto, versao);
  const medidas = tamanho ? { width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.4) } : {};

  return (
    <span
      className={`avatar-usuario ${className}`}
      style={{ background: url ? '#e2e8f0' : cor, ...medidas, ...style }}
      aria-hidden="true"
    >
      {url ? <img src={url} alt="" /> : (nome || 'U').trim().charAt(0).toUpperCase()}
    </span>
  );
}
