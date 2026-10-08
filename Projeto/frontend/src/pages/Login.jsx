import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Building, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { carregarPerfil } from '../services/perfilService';
import { supabase } from '../backend/supabaseClient';
import LogoHabitareAnimada from '../components/LogoHabitareAnimada';
import './Login.css';

// A logo "surge" só na primeira vez que o login é aberto neste navegador
const CHAVE_INTRO = 'habitare:intro-logo-vista';
const deveAnimarLogo = () => {
  try {
    if (localStorage.getItem(CHAVE_INTRO)) return false;
    localStorage.setItem(CHAVE_INTRO, '1');
    return true;
  } catch {
    return false;
  }
};

// Faíscas com tamanho, lugar, velocidade, balanço e brilho sorteados,
// para subirem cada uma no seu ritmo (nada de fila padronizada).
const sorteia = (min, max) => min + Math.random() * (max - min);
const FAISCAS = Array.from({ length: 6 }, () => {
  const duracao = sorteia(12, 20);
  return {
    left: `${sorteia(0, 100)}%`,
    '--tam': `${sorteia(4, 10)}px`,
    '--dur': `${duracao}s`,
    '--atraso': `${-sorteia(0, duracao)}s`,
    '--balanco': `${sorteia(8, 24) * (Math.random() < 0.5 ? -1 : 1)}px`,
    '--dur-balanco': `${sorteia(2.5, 6)}s`,
    '--altura': `${-sorteia(55, 110)}vh`,
    '--cor': Math.random() < 0.8 ? '#f47920' : '#e2e8f0',
    '--brilho': sorteia(0.7, 1).toFixed(2),
  };
});

const Login = () => {
  const [animarLogo] = useState(deveAnimarLogo);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Autenticação no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new Error('E-mail ou senha inválidos.');
      }

      // 2. Papel, condomínio e status vêm do banco em uma única chamada
      const userData = await carregarPerfil();
      if (!userData) {
        await supabase.auth.signOut();
        throw new Error('Perfil de usuário não encontrado no sistema.');
      }

      login(userData);

      // 3. Redirecionamento por papel
      if (userData.role === 'DEV') {
        navigate('/painel-dev');
      } else if (userData.role === 'MASTER') {
        navigate('/painel-master');
      } else if (userData.role === 'SINDICO') {
        navigate('/painel');
      } else if (userData.role === 'FUNCIONARIO') {
        navigate('/painel-funcionario');
      } else {
        navigate('/solicitacoes');
      }

    } catch (error) {
      console.error('Erro no login:', error);
      setErrorMsg(error.message || 'Erro inesperado ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Column (Logo Area) */}
      <div className="login-left-panel">
        {/* Fundo vivo: uma luz laranja bem fraca, grade em perspectiva e poucos pontos de luz */}
        <div className="login-fundo" aria-hidden="true">
          <span className="login-luz login-luz-1" />
          <span className="login-grade" />
          {FAISCAS.map((f, i) => (
            <span key={i} className="login-particula" style={f}>
              <span className="login-particula-ponto" />
            </span>
          ))}
        </div>
        <div className={`login-logo-container${animarLogo ? ' login-logo-intro' : ''}`}>
          <LogoHabitareAnimada animar={animarLogo} className="login-logo-img" />
          <p className="login-slogan">Seu condomínio, conectado.</p>
        </div>
      </div>

      {/* Right Column (Form Area) */}
      <div className="login-right-panel">
        <div className={`login-form-wrapper${animarLogo ? ' login-form-intro' : ''}`}>
          <div className="login-header">
            <h1 className="login-title">Bem-vindo<span className="login-ponto">.</span></h1>
            <p className="login-subtitle">Entre para acessar seu painel</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            
            {errorMsg && (
              <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {errorMsg}
              </div>
            )}

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
              <div className="login-label-linha">
                <label className="input-label" htmlFor="password">
                  Senha
                </label>
                <a href="#" className="text-link login-esqueceu">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="input-container">
                <input
                  id="password"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="custom-input"
                  required
                />
                <Lock className="input-icon" />
                <button
                  type="button"
                  className="login-ver-senha"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Loader2 className="input-icon" style={{ animation: 'spin 1s linear infinite', position: 'static', color: 'inherit' }} size={20} />
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="login-rodape">
            <div className="login-divisor"><span>ainda não tem conta?</span></div>
            <Link to="/cadastro" className="login-btn-secundario">
              Cadastrar-me como morador
            </Link>
            <Link to="/novo-condominio" className="login-link-admin">
              Sou administrador e quero solicitar o cadastro do meu condomínio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;