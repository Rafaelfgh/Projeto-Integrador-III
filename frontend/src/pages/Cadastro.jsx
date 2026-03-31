import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Home, Building, FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import './Cadastro.css';

const CONDOMINIOS_MOCK = [
  { id: 1, name: 'Condomínio Bela Vista' },
  { id: 2, name: 'Residencial Florescer' },
  { id: 3, name: 'Edifício Central Park' }
];

const Cadastro = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    condominium: '',
    bloco: '',
    apartment: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    // Simulate API registration request...
    setIsSubmitted(true);
  };

  return (
    <div className="cadastro-page">
      {/* Left Column (Logo Area) */}
      <div className="cadastro-left-panel">
        <div className="cadastro-logo-container">
          <span className="cadastro-logo-text">PM</span>
          <h2 className="cadastro-brand-name">Portal do Morador</h2>
        </div>
      </div>

      {/* Right Column (Form Area) */}
      <div className="cadastro-right-panel">
        <div className="cadastro-form-wrapper">
          {isSubmitted ? (
            <div className="cadastro-success-message">
              <CheckCircle className="success-icon" size={64} />
              <h2 className="cadastro-title">Cadastro Realizado!</h2>
              <p className="cadastro-subtitle">
                Seu cadastro foi recebido com sucesso. O seu acesso está <strong>aguardando aprovação</strong> do Síndico ou Administrador.
              </p>
              <Link to="/login" className="btn-primary" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', marginTop: '2rem' }}>
                Voltar ao Login
              </Link>
            </div>
          ) : (
            <>
              <div className="cadastro-header">
                <Link to="/login" className="back-link">
                  <ArrowLeft size={18} /> Voltar
                </Link>
                <h1 className="cadastro-title">Criar Conta</h1>
                <p className="cadastro-subtitle">Preencha os dados para solicitar seu acesso</p>
              </div>

              <form onSubmit={handleRegister} className="cadastro-form">
                <div className="input-group">
                  <label className="input-label" htmlFor="name">Nome Completo</label>
                  <div className="input-container">
                    <input id="name" type="text" value={formData.name} onChange={handleChange} placeholder="Seu nome" className="custom-input" required />
                    <User className="input-icon" />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="email">E-mail</label>
                  <div className="input-container">
                    <input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" className="custom-input" required />
                    <Mail className="input-icon" />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="cpf">CPF</label>
                  <div className="input-container">
                    <input id="cpf" type="text" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" className="custom-input" required />
                    <FileText className="input-icon" />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="condominium">Condomínio</label>
                  <div className="input-container">
                    <select 
                      id="condominium" 
                      value={formData.condominium} 
                      onChange={handleChange} 
                      className="custom-input" 
                      required
                    >
                      <option value="" disabled>Selecione um Condomínio...</option>
                      {CONDOMINIOS_MOCK.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <Building className="input-icon" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label" htmlFor="bloco">Bloco</label>
                    <div className="input-container">
                      <input id="bloco" type="text" value={formData.bloco} onChange={handleChange} placeholder="Ex: A" className="custom-input" required />
                      <Home className="input-icon" />
                    </div>
                  </div>

                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label" htmlFor="apartment">Apartamento</label>
                    <div className="input-container">
                      <input id="apartment" type="text" value={formData.apartment} onChange={handleChange} placeholder="Ex: 101" className="custom-input" required />
                      <Home className="input-icon" />
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="password">Senha</label>
                  <div className="input-container">
                    <input id="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="custom-input" required minLength={6} />
                    <Lock className="input-icon" />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="confirmPassword">Confirmar Senha</label>
                  <div className="input-container">
                    <input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="custom-input" required minLength={6} />
                    <Lock className="input-icon" />
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                  Solicitar Acesso
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
