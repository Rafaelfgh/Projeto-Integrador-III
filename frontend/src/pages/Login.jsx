import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Building } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const CONDOMINIOS_MOCK = [
  { id: 1, name: 'Condomínio Bela Vista' },
  { id: 2, name: 'Residencial Florescer' },
  { id: 3, name: 'Edifício Central Park' }
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Simula a verificação de primeiro acesso
    if (email.includes('novo') || password === 'senha123') {
      navigate('/primeiro-acesso');
      return;
    }

    let userRole = 'MORADOR';
    let userName = 'João Morador';
    
    if (email.includes('admin')) {
      userRole = 'ADMIN';
      userName = 'Carlos Admin';
    } else if (email.includes('sindico')) {
      userRole = 'SINDICO';
      userName = 'Roberto Síndico';
    } else if (email.includes('func')) {
      userRole = 'FUNCIONARIO';
      userName = 'Maria Funcionária';
    }
    
    login({
        id: Date.now(),
        name: userName,
        email: email,
        role: userRole,
        apto: userRole === 'MORADOR' ? '102' : undefined
    });

    // Simulate login redirect depending on role
    if (userRole === 'ADMIN') {
      navigate('/painel-admin');
    } else if (userRole === 'SINDICO') {
      navigate('/painel');
    } else if (userRole === 'FUNCIONARIO') {
      navigate('/painel-funcionario');
    } else {
      navigate('/solicitacoes');
    }
  };

  return (
    <div className="login-page">
      {/* Left Column (Logo Area) */}
      <div className="login-left-panel">
        <div className="login-logo-container">
          <span className="login-logo-text">
            PM
          </span>
          <h2 className="login-brand-name">
            Portal do Morador
          </h2>
        </div>
      </div>

      {/* Right Column (Form Area) */}
      <div className="login-right-panel">
        <div className="login-form-wrapper">
          <div className="login-header">
            <h1 className="login-title">Bem-vindo</h1>
            <p className="login-subtitle">Entre para acessar seu painel</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            
            <div className="input-group">
              <label className="input-label" htmlFor="email">
                E-mail
              </label>
              <div className="input-container">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="custom-input"
                  required
                />
                <Mail className="input-icon" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">
                Senha
              </label>
              <div className="input-container">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="custom-input"
                  required
                />
                <Lock className="input-icon" />
              </div>
              <div className="forgot-password-container">
                <a href="#" className="text-link">
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            <button type="submit" className="btn-primary">
              Entrar
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <Link to="/novo-condominio" className="text-link" style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>
               Sou Administrador e quero registrar meu Condomínio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
