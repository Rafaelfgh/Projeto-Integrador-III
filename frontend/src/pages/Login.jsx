import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login
    navigate('/dashboard');
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

          <p className="login-footer-text">
            Não tem uma conta?{' '}
            <a href="#" className="text-link">
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
