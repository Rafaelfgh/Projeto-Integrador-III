import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import './PrimeiroAcesso.css';

const PrimeiroAcesso = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    senhaProvisoria: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.novaSenha !== formData.confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }
    
    // Simula a validação com a API pra trocar a senha
    setIsSuccess(true);
    
    // Redireciona pro dashboard após mostrar o sucesso brevemente
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  return (
    <div className="primeiro-acesso-page">
      <div className="pa-panel-container">
        {isSuccess ? (
          <div className="pa-success-state">
            <CheckCircle className="pa-success-icon" size={64} />
            <h2 className="pa-title">Senha Alterada!</h2>
            <p className="pa-subtitle">
              Sua senha foi redefinida com sucesso. Redirecionando para o seu dashboard...
            </p>
          </div>
        ) : (
          <>
            <div className="pa-header">
              <div className="pa-logo">
                <span className="pa-logo-text">PM</span>
              </div>
              <h1 className="pa-title">Primeiro Acesso</h1>
              <p className="pa-subtitle">
                Para sua segurança, é obrigatório redefinir a senha provisória informada pelo Síndico/Administrador.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="pa-form">
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

              <button type="submit" className="btn-primary pa-btn-submit">
                Definir Nova Senha e Entrar
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PrimeiroAcesso;
