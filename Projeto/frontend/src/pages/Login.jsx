import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Building, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
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

// Tela inicial de cada perfil depois do login
const destinoPorPapel = (papel) => ({
  DEV: '/painel-dev', MASTER: '/painel-master', SINDICO: '/painel', FUNCIONARIO: '/painel-funcionario',
}[papel] || '/solicitacoes');

// Logo oficial do Google (4 cores), exigida no botão "Entrar com Google"
const LogoGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const Login = () => {
  const [animarLogo] = useState(deveAnimarLogo);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  // login() muda a cada render do contexto: guardado em ref para a verificação rodar uma vez só
  const loginRef = useRef(login);
  useEffect(() => { loginRef.current = login; }, [login]);

  // Volta do Google: a conta já está conectada. Com perfil no Habitare entra direto;
  // sem perfil (1º acesso) vai completar o cadastro de morador com o e-mail do Google.
  useEffect(() => {
    let ativo = true;
    const erroGoogle = new URLSearchParams(window.location.search).get('error_description')
      || new URLSearchParams(window.location.hash.slice(1)).get('error_description');
    if (erroGoogle) setErrorMsg('Não foi possível entrar com o Google. Tente novamente.');

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!ativo || !session) return;
      const viaGoogle = (session.user.app_metadata?.providers || []).includes('google');
      setLoadingGoogle(true);
      try {
        const perfil = await carregarPerfil();
        if (!ativo) return;
        if (perfil) {
          loginRef.current(perfil);
          navigate(destinoPorPapel(perfil.role), { replace: true });
        } else if (viaGoogle) {
          navigate('/cadastro?google=1', { replace: true });
        } else {
          await supabase.auth.signOut();
          setLoadingGoogle(false);
        }
      } catch (err) {
        console.error('Erro ao entrar com o Google:', err);
        if (ativo) {
          setErrorMsg('Não foi possível entrar com o Google. Tente novamente.');
          setLoadingGoogle(false);
        }
      }
    });
    return () => { ativo = false; };
  }, [navigate]);

  const entrarComGoogle = async () => {
    setErrorMsg(null);
    setLoadingGoogle(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: { prompt: 'select_account' }, // deixa escolher a conta Google
      },
    });
    if (error) {
      console.error('Erro ao abrir o Google:', error);
      setErrorMsg('Não foi possível abrir o login do Google.');
      setLoadingGoogle(false);
    }
  };

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

      if (authError && /email not confirmed/i.test(authError.message)) {
        throw new Error('Confirme seu e-mail pelo link que enviamos antes de entrar.');
      }
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
      navigate(destinoPorPapel(userData.role));

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
        {/* Fundo vivo: grade em perspectiva e poucos pontos de luz */}
        <div className="login-fundo" aria-hidden="true">
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

          <div className="login-divisor login-divisor-google"><span>ou</span></div>
          <button type="button" className="login-btn-google" onClick={entrarComGoogle} disabled={loading || loadingGoogle}>
            {loadingGoogle ? <Loader2 size={18} className="login-girando" /> : <LogoGoogle />}
            {loadingGoogle ? 'Conectando…' : 'Entrar com Google'}
          </button>

          <div className="login-rodape">
            <div className="login-divisor"><span>ainda não tem conta?</span></div>
            <Link to="/cadastro" className="login-btn-secundario">
              Cadastrar-me como morador
            </Link>
            <Link to="/novo-condominio" className="login-link-admin">
              Sou administrador e quero solicitar o cadastro do meu condomínio
              <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;