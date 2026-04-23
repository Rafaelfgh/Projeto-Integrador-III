import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext({});

// Global Mock Logs for Master
const initialLogs = [
  { acao: "SISTEMA_INICIADO", usuario: "sistema", contexto: "MASTER", inicio: new Date().toISOString(), texto: "Plataforma iniciada." }
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('@PM:user');
      if (storedUser) return JSON.parse(storedUser);
    } catch (error) {
      console.error('Error parsing stored user', error);
    }
    return null;
  });

  // visualContext controls the UI overlay (SINDICO, FUNCIONARIO, MORADOR)
  const [visualContext, setVisualContext] = useState(null);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState(null);
  
  // Audit Logs (Master)
  const [auditLogs, setAuditLogs] = useState(initialLogs);
  const [currentSessionStart, setCurrentSessionStart] = useState(null);

  // Synchronize visual context with real user login
  useEffect(() => {
    if (currentUser) {
      if (!visualContext) {
        setVisualContext(currentUser.role);
      }
    } else {
      setVisualContext(null);
    }
  }, [currentUser]);

  const login = (userData) => {
    setCurrentUser(userData);
    setVisualContext(userData.role);
    localStorage.setItem('@PM:user', JSON.stringify(userData));
  };

  const logout = () => {
    setCurrentUser(null);
    setVisualContext(null);
    localStorage.removeItem('@PM:user');
  };

  // Toast Function
  const toast = {
    info: (msg) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Master Viewing Controls
  const isMasterViewing = currentUser?.role === 'MASTER' && visualContext !== 'MASTER';

  const changeVisualContext = (newContext) => {
    if (currentUser?.role !== 'MASTER') return;

    const now = new Date().toISOString();

    // If we are leaving a simulated context, log the session end
    if (isMasterViewing) {
      setAuditLogs([{
        acao: "VISUALIZACAO_CONTEXTO",
        usuario: currentUser.email,
        contexto: visualContext,
        inicio: currentSessionStart,
        fim: now,
        texto: `Sessão de visualização como ${visualContext} encerrada.`
      }, ...auditLogs]);
    }

    setVisualContext(newContext);
    
    // If entering a new simulated context
    if (newContext !== 'MASTER') {
      setCurrentSessionStart(now);
      toast.info(`Você entrou no modo de visualização: ${newContext}`);
    } else {
      setCurrentSessionStart(null);
      toast.info(`Você retornou ao seu acesso Master real.`);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      logout,
      visualContext,
      isMasterViewing,
      changeVisualContext,
      toast,
      auditLogs
    }}>
      {children}
      
      {/* Simple Global Toast Renderer */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          background: '#0f172a', color: 'white', padding: '1rem 1.5rem', 
          borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500, fontSize: '0.9rem',
          borderLeft: '4px solid #3b82f6', animation: 'slideInRight 0.3s ease'
        }}>
          {toastMessage}
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
