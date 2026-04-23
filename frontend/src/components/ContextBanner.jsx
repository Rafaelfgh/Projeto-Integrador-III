import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

const ContextBanner = () => {
  const { isMasterViewing, visualContext, changeVisualContext, currentUser } = useAuth();

  if (!isMasterViewing) return null;

  // Determinar cores e nome baseado no contexto atual
  let bgColor = '#4f46e5'; // Indigo (Sindico)
  let name = 'Roberto Síndico';
  let roleName = 'Síndico';

  if (visualContext === 'FUNCIONARIO') {
    bgColor = '#16a34a'; // Green
    name = 'Maria Manutenção';
    roleName = 'Funcionário';
  } else if (visualContext === 'MORADOR') {
    bgColor = '#ea580c'; // Orange
    name = 'João Morador, Apto 502';
    roleName = 'Morador';
  }

  // Estilo do banner
  const bannerStyle = {
    position: 'fixed',
    top: '0', // Fixo no topo da área do app
    left: 'var(--sidebar-width, 260px)', // Evita sobrepor a sidebar
    width: 'calc(100% - var(--sidebar-width, 260px))',
    zIndex: 999,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 1.5rem',
    background: `${bgColor}1a`, // 10% opacity (hex + 1a)
    borderLeft: `4px solid ${bgColor}`,
    borderBottom: `1px solid ${bgColor}33`,
    backdropFilter: 'blur(4px)',
  };

  return (
    <div style={bannerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%', background: bgColor,
          boxShadow: `0 0 0 3px ${bgColor}33`
        }}></div>
        <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 600 }}>
          Visualizando como {roleName} — <span style={{ color: '#475569', fontWeight: 400 }}>{name}</span>
        </span>
      </div>
      <button 
        onClick={() => changeVisualContext('MASTER')}
        style={{
          background: 'white', border: `1px solid ${bgColor}40`, color: '#0f172a',
          padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        <LogOut size={14} /> Voltar ao Master
      </button>
    </div>
  );
};

export default ContextBanner;
