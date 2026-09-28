import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, ArrowLeftCircle } from 'lucide-react';

const ContextBanner = () => {
  const { isMasterViewing, visualContext, changeVisualContext, simulatedUser, contextConfig } = useAuth();

  if (!isMasterViewing) return null;

  const bgColor = contextConfig?.color || '#4f46e5';
  const roleName = contextConfig?.label || visualContext;
  const userName = simulatedUser?.name || '';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.55rem 1.5rem',
      background: `${bgColor}18`,
      borderBottom: `1px solid ${bgColor}30`,
      borderLeft: `4px solid ${bgColor}`,
      backdropFilter: 'blur(4px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      flexShrink: 0,
    }}>
      {/* Lado esquerdo: ícone + texto */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Dot com pulse */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            display: 'block',
            width: '8px', height: '8px', borderRadius: '50%',
            background: bgColor,
            boxShadow: `0 0 0 4px ${bgColor}30`,
            animation: 'ctx-pulse 2s ease-in-out infinite',
          }} />
        </div>

        <Eye size={15} style={{ color: bgColor, opacity: 0.8 }} />

        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
          Visualizando como{' '}
          <span style={{ color: bgColor }}>{roleName}</span>
          {userName && (
            <span style={{ fontWeight: 400, color: '#475569' }}> — {userName}</span>
          )}
        </span>

        <span style={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em',
          background: `${bgColor}20`, color: bgColor,
          padding: '0.15rem 0.5rem', borderRadius: '99px',
          border: `1px solid ${bgColor}40`,
        }}>
          MODO SIMULAÇÃO
        </span>
      </div>

      {/* Botão: Voltar ao Master */}
      <button
        onClick={() => changeVisualContext('MASTER')}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'white', border: `1px solid ${bgColor}50`,
          color: '#0f172a', padding: '0.35rem 0.85rem',
          borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = bgColor;
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.color = '#0f172a';
        }}
      >
        <ArrowLeftCircle size={13} />
        Voltar ao Master
      </button>

      {/* Keyframe para pulse via style tag inline */}
      <style>{`
        @keyframes ctx-pulse {
          0%, 100% { box-shadow: 0 0 0 0px ${bgColor}60; }
          50%       { box-shadow: 0 0 0 6px ${bgColor}00; }
        }
      `}</style>
    </div>
  );
};

export default ContextBanner;
