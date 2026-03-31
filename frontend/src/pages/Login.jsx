import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Building } from 'lucide-react';
import './Login.css';

const CONDOMINIOS_MOCK = [
  { id: 1, name: 'Condomínio Bela Vista' },
  { id: 2, name: 'Residencial Florescer' },
  { id: 3, name: 'Edifício Central Park' }
];

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [condominium, setCondominium] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!condominium) {
      alert("Por favor, informe a qual condomínio você pertence antes de entrar.");
      return;
    }
    
    // Simulate login redirect depending on the user/condominium configuration
    if (email.includes('admin') || email.includes('sindico')) {
      navigate('/painel');
    } else {
      navigate('/dashboard');
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
              <label className="input-label" htmlFor="condominium">
                Condomínio
              </label>
              <div className="input-container">
                <select 
                  id="condominium" 
                  value={condominium} 
                  onChange={(e) => setCondominium(e.target.value)} 
                  className="custom-input" 
                  required
                >
                  <option value="" disabled>Selecione seu Condomínio...</option>
                  {CONDOMINIOS_MOCK.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <Building className="input-icon" />
              </div>
            </div>
            
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

          <p className="login-footer-text">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="text-link">
              Criar conta
            </Link>
          </p>
          <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <Link to="/cadastro-admin" className="text-link" style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>
              Sou Administrador e quero registrar meu Condomínio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
