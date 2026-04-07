import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Return to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // User is logged in but doesn't have the required role.
    // Redirect to a specific dashboard based on their actual role or a general unauthorized page
    if (currentUser.role === 'ADMIN') {
        return <Navigate to="/gerenciamento-usuarios" replace />;
    }
    if (currentUser.role === 'SINDICO') {
        return <Navigate to="/painel" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // User is logged in and authorized
  return <Outlet />;
};

export default ProtectedRoute;
