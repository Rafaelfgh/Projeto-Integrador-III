import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // MASTER tem acesso irrestrito a todas as rotas
  if (currentUser.role === 'MASTER') {
    return <Outlet />;
  }

  // Intercepta usuários com status PENDENTE ou BLOQUEADO
  if (currentUser.status === 'PENDENTE' || currentUser.status === 'BLOQUEADO') {
    const isBlocked = currentUser.status === 'BLOQUEADO';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ backgroundColor: isBlocked ? '#fee2e2' : '#fef3c7', color: isBlocked ? '#dc2626' : '#d97706', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            {isBlocked ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            )}
          </div>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>
            {isBlocked ? 'Acesso Bloqueado' : 'Seu pedido está em análise'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
            {isBlocked 
              ? 'Sua conta foi suspensa ou bloqueada pela administração. Entre em contato com o síndico para mais informações.'
              : 'Seu cadastro foi recebido com sucesso. Aguarde enquanto o administrador do condomínio analisa e libera o seu acesso à plataforma.'
            }
          </p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === 'ADMIN') {
      return <Navigate to="/painel-master" replace />;
    }
    if (currentUser.role === 'SINDICO') {
      return <Navigate to="/painel" replace />;
    }
    if (currentUser.role === 'FUNCIONARIO') {
      return <Navigate to="/painel-funcionario" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
