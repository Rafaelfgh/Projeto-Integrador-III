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

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === 'ADMIN') {
      return <Navigate to="/painel-admin" replace />;
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
