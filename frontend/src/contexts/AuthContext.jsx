import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext({});

// Dados simulados por contexto — o Master "vê como" este usuário
const SIMULATED_USERS = {
  SINDICO: {
    name: 'Roberto Síndico',
    role: 'SINDICO',
    unidade: 'Administração do Condomínio',
    color: '#4f46e5',
    label: 'Síndico',
  },
  FUNCIONARIO: {
    name: 'Maria Manutenção',
    role: 'FUNCIONARIO',
    unidade: 'Equipe de Manutenção',
    color: '#16a34a',
    label: 'Funcionário',
  },
  MORADOR: {
    name: 'João Morador',
    role: 'MORADOR',
    unidade: 'Bloco B, Apt 502',
    color: '#ea580c',
    label: 'Morador',
  },
};

const CONTEXT_CONFIG = {
  MASTER:      { color: '#7c3aed', label: 'Master Admin' },
  SINDICO:     { color: '#4f46e5', label: 'Síndico' },
  FUNCIONARIO: { color: '#16a34a', label: 'Funcionário' },
  MORADOR:     { color: '#ea580c', label: 'Morador' },
};

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

  // visualContext controla o overlay de UI (MASTER, SINDICO, FUNCIONARIO, MORADOR)
  const [visualContext, setVisualContext] = useState(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState(null);

  // Audit Logs (Master)
  const [auditLogs, setAuditLogs] = useState(initialLogs);
  const [currentSessionStart, setCurrentSessionStart] = useState(null);

  // Sincroniza o contexto visual com o login real
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

  // Master está visualizando como outro contexto?
  const isMasterViewing = currentUser?.role === 'MASTER' && visualContext !== 'MASTER';

  // Dados do usuário simulado no contexto atual
  const simulatedUser = isMasterViewing ? SIMULATED_USERS[visualContext] : null;

  // Config de cor/label do contexto visual atual
  const contextConfig = CONTEXT_CONFIG[visualContext] || CONTEXT_CONFIG['MASTER'];

  const changeVisualContext = (newContext) => {
    if (currentUser?.role !== 'MASTER') return;

    const now = new Date().toISOString();

    // Se estava em contexto simulado, loga o fim da sessão
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

    if (newContext !== 'MASTER') {
      setCurrentSessionStart(now);
      toast.info(`Modo de visualização ativado: ${CONTEXT_CONFIG[newContext]?.label}`);
    } else {
      setCurrentSessionStart(null);
      toast.info(`Retornado ao acesso Master real.`);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      visualContext,
      isMasterViewing,
      simulatedUser,
      contextConfig,
      changeVisualContext,
      toast,
      auditLogs,
      CONTEXT_CONFIG,
    }}>
      {children}

      {/* Global Toast Renderer */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          background: '#0f172a', color: 'white', padding: '1rem 1.5rem',
          borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500, fontSize: '0.9rem',
          borderLeft: '4px solid #7c3aed', animation: 'slideInRight 0.3s ease'
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
