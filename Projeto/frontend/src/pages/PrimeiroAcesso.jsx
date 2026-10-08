import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import './PrimeiroAcesso.css';

const INICIO_POR_PAPEL = {
  MASTER: '/painel-master',
  SINDICO: '/painel',
  FUNCIONARIO: '/painel-funcionario',
};

const PrimeiroAcesso = () => {
  const navigate = useNavigate();
  const { currentUser, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    senhaProvisoria: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    if (formData.novaSenha !== formData.confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (formData.novaSenha === formData.senhaProvisoria) {
      setErro('A nova senha precisa ser diferente da provisória.');
      return;
    }

    setEnviando(true);
    try {
      // Confirma a senha atual antes de trocar
      const { error: erroLogin } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: formData.senhaProvisoria,
      });
      if (erroLogin) throw new Error('A senha provisória está incorreta.');

      const { error: erroTroca } = await supabase.auth.updateUser({ password: formData.novaSenha });
      if (erroTroca) throw new Error(erroTroca.message);

      // Tira o aviso do painel e marca a notificação como lida
      const { error: erroMarca } = await supabase.rpc('marcar_senha_trocada');
      if (erroMarca) throw new Error(erroMarca.message);

      await refreshProfile();
      setIsSuccess(true);
      setTimeout(() => {
        navigate(INICIO_POR_PAPEL[currentUser.role] || '/solicitacoes');
      }, 2000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="primeiro-acesso-page">
      <div className="pa-panel-container">
        {isSuccess ? (
          <div className="pa-success-state">
            <CheckCircle className="pa-success-icon" size={64} />
            <h2 className="pa-title">Senha Alterada!</h2>
            <p className="pa-subtitle">
              Sua senha foi redefinida com sucesso. Redirecionando para o seu painel...
            </p>
          </div>
        ) : (
          <>
            <div className="pa-header">
              <img
                src="/Habitare-logo-predio.svg"
                alt="Habitare"
                style={{ width: 200, height: 'auto', margin: '0 auto 1rem', display: 'block' }}
              />
              <h1 className="pa-title">Trocar senha provisória</h1>
              <p className="pa-subtitle">
                Para sua segurança, defina uma nova senha no lugar da senha provisória informada pelo Master.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="pa-form">
              {erro && (
                <p role="alert" style={{ margin: 0, padding: '0.75rem 1rem', borderRadius: 8, background: '#fee2e2', color: '#b91c1c', fontSize: '0.875rem' }}>
                  {erro}
                </p>
              )}
              <div className="pa-input-group">
                <label className="pa-input-label" htmlFor="senhaProvisoria">Senha Provisória</label>
                <div className="pa-input-container">
                  <input
                    id="senhaProvisoria"
                    type="password"
                    value={formData.senhaProvisoria}
                    onChange={handleChange}
                    placeholder="Sua senha temporária"
                    className="pa-input"
                    required
                  />
                  <Lock className="pa-input-icon" size={18} />
                </div>
              </div>

              <div className="pa-input-group">
                <label className="pa-input-label" htmlFor="novaSenha">Nova Senha</label>
                <div className="pa-input-container">
                  <input
                    id="novaSenha"
                    type="password"
                    value={formData.novaSenha}
                    onChange={handleChange}
                    placeholder="No mínimo 6 caracteres"
                    className="pa-input"
                    required
                    minLength={6}
                  />
                  <Lock className="pa-input-icon" size={18} />
                </div>
              </div>

              <div className="pa-input-group">
                <label className="pa-input-label" htmlFor="confirmarSenha">Confirmar Nova Senha</label>
                <div className="pa-input-container">
                  <input
                    id="confirmarSenha"
                    type="password"
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    placeholder="Repita a nova senha"
                    className="pa-input"
                    required
                    minLength={6}
                  />
                  <Lock className="pa-input-icon" size={18} />
                </div>
              </div>

              <button type="submit" className="btn-primary pa-btn-submit" disabled={enviando}>
                {enviando ? 'Salvando...' : 'Definir nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PrimeiroAcesso;
