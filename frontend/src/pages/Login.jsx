import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Building, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    // Simula a verificação de primeiro acesso (Temporário até implementação final)
    if (email.includes('novo') || password === 'senha123') {
      navigate('/primeiro-acesso');
      setLoading(false);
      return;
    }

    try {
      // 1. Autenticação no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error('E-mail ou senha inválidos.');
      }

      if (!authData.user) {
        throw new Error('Usuário não encontrado.');
      }

      const userId = authData.user.id;
      let userProfile = null;
      let userRole = null;

      // 2. Procurar na tabela Masters
      let { data: masterData } = await supabase
        .from('Masters')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (masterData) {
        userProfile = masterData;
        userRole = 'MASTER';
      } else {
        // Procurar na tabela Funcionarios
        let { data: funcData } = await supabase
          .from('Funcionarios')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (funcData) {
          userProfile = funcData;
          userRole = 'FUNCIONARIO';
        } else {
          // Procurar na tabela Moradores
          let { data: moradorData } = await supabase
            .from('Moradores')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (moradorData) {
            userProfile = moradorData;
            userRole = 'MORADOR';

            // Verifica se o morador é um síndico ativo
            let { data: gestaoData } = await supabase
              .from('Gestao_Sindicos')
              .select('*')
              .eq('sindico_id', userId)
              .eq('ativo', true)
              .single();
              
            if (gestaoData) {
               userRole = 'SINDICO';
            }
          }
        }
      }

      if (!userRole || !userProfile) {
        throw new Error('Perfil de usuário não encontrado no sistema.');
      }

      // 3. Montar dados para o AuthContext
      const userData = {
        id: userId,
        name: userProfile.nome || userProfile.name || 'Usuário',
        email: email,
        role: userRole,
        unidade: userProfile.unidade || userProfile.condominio_id || 'Sem unidade',
        phone: userProfile.telefone || '',
        cpf: userProfile.cpf_ou_cnpj || userProfile.cpf || '',
        status: 'Ativo'
      };

      // 4. Efetuar Login no Contexto
      login(userData);

      // 5. Redirecionamento por role
      if (userRole === 'MASTER') {
        navigate('/painel-master');
      } else if (userRole === 'SINDICO') {
        navigate('/painel');
      } else if (userRole === 'FUNCIONARIO') {
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

          <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <Link to="/cadastro" className="text-link" style={{ color: '#7c3aed', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>
               Ainda não tem conta? Cadastre-se como morador
            </Link>
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
