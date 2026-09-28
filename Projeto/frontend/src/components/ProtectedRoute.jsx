import React from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const INICIO_POR_PAPEL = {
  DEV: '/painel-dev',
  MASTER: '/painel-master',
  SINDICO: '/painel',
  FUNCIONARIO: '/painel-funcionario',
};

// Texto da tela de espera/bloqueio conforme papel e situação
const mensagemBloqueio = (usuario) => {
  const master = usuario.role === 'MASTER';
  if (usuario.status === 'RECUSADO') {
    return {
      titulo: 'Cadastro do condomínio recusado',
      texto: usuario.motivoRecusa
        ? `O cadastro deste condomínio não foi aprovado. Motivo: ${usuario.motivoRecusa}`
        : 'O cadastro deste condomínio não foi aprovado.',
      bloqueado: true,
    };
  }
  if (usuario.status === 'BLOQUEADO') {
    return {
      titulo: 'Acesso bloqueado',
      texto: 'Sua conta foi suspensa ou bloqueada pela administração. Entre em contato com o síndico para mais informações.',
      bloqueado: true,
    };
  }
  return {
    titulo: master ? 'Condomínio em análise' : 'Seu pedido está em análise',
    texto: master
      ? 'Recebemos o cadastro do seu condomínio. Ele está em análise e o acesso será liberado assim que for aprovado.'
      : 'Seu cadastro foi recebido com sucesso. Aguarde enquanto o administrador do condomínio analisa e libera o seu acesso à plataforma.',
    bloqueado: false,
  };
};

const ProtectedRoute = ({ allowedRoles }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Pendente, bloqueado ou recusado: mostra o aviso antes de qualquer página
  if (['PENDENTE', 'BLOQUEADO', 'RECUSADO'].includes(currentUser.status)) {
    const { titulo, texto, bloqueado } = mensagemBloqueio(currentUser);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, sans-serif', padding: '1rem' }}>
        <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ backgroundColor: bloqueado ? '#fee2e2' : '#fef3c7', color: bloqueado ? '#dc2626' : '#d97706', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            {bloqueado ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            )}
          </div>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>{titulo}</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>{texto}</p>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  // Master vê as telas do condomínio (inclusive "ver como"), mas não as da equipe Dev
  if (currentUser.role === 'MASTER' && !allowedRoles?.includes('DEV')) {
    return <Outlet />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to={INICIO_POR_PAPEL[currentUser.role] || '/dashboard'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
