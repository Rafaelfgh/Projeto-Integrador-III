import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Mostrado quando a busca dos dados falha: nunca exibir "0 itens" sem ter certeza.
export default function ErroCarregamento({ onTentar }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
      <AlertTriangle size={36} color="#f59e0b" />
      <h4 style={{ margin: 0, color: '#0f172a' }}>Não foi possível carregar os dados</h4>
      <p style={{ margin: 0, fontSize: '0.9rem' }}>Verifique sua conexão e tente de novo.</p>
      <button type="button" className="btn-primary" onClick={onTentar}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', width: 'auto', cursor: 'pointer' }}>
        <RefreshCw size={16} /> Tentar novamente
      </button>
    </div>
  );
}
