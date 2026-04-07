import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, FileText, ArrowLeft, Building, MapPin, Map } from 'lucide-react';
import './Cadastro.css';

const CadastroAdmin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    password: '',
    confirmPassword: '',
    condominiumName: '',
    address: '',
    city: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    // Simulate uniqueness validation
    if (formData.email === 'admin@admin.com') {
      alert("Este e-mail já está em uso!");
      return;
    }
    setStep(2);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    // Mock: create Condominium and Auto-Login as ADMIN
    // Redireciona para o painel de Gerenciamento de Usuários
    navigate('/painel-admin');
  };

  return (
    <div className="cadastro-page">
      {/* Left Column (Logo Area) */}
      <div className="cadastro-left-panel">
        <div className="cadastro-logo-container">
          <span className="cadastro-logo-text">PM</span>
          <h2 className="cadastro-brand-name">Portal do Morador</h2>
          <p style={{ color: '#ffedd5', marginTop: '1rem', textAlign: 'center', maxWidth: '300px' }}>
             Ambiente de configuração inicial. Cadastre seu Condomínio e torne-se o Administrador Principal.
          </p>
        </div>
      </div>

      {/* Right Column (Form Area) */}
      <div className="cadastro-right-panel">
        <div className="cadastro-form-wrapper" style={{ maxWidth: '450px' }}>
            <div className="cadastro-header">
              {step === 1 ? (
                 <Link to="/login" className="back-link">
                    <ArrowLeft size={18} /> Voltar ao Login
                 </Link>
              ) : (
                 <button onClick={() => setStep(1)} className="back-link" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>
                    <ArrowLeft size={18} /> Voltar
                 </button>
              )}
              
              <h1 className="cadastro-title">Setup de Administrador</h1>
              <p className="cadastro-subtitle">
                {step === 1 ? 'Passo 1 de 2: Seus Dados Pessoais' : 'Passo 2 de 2: Dados do Condomínio'}
              </p>
            </div>

            {step === 1 && (
              <form onSubmit={handleNextStep} className="cadastro-form">
                <div className="input-group">
                  <label className="input-label" htmlFor="name">Seu Nome (Admin)</label>
                  <div className="input-container">
                    <input id="name" type="text" value={formData.name} onChange={handleChange} placeholder="Nome completo" className="custom-input" required />
                    <User className="input-icon" />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="email">E-mail Corporativo</label>
                  <div className="input-container">
                    <input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" className="custom-input" required />
                    <Mail className="input-icon" />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="cpf">Seu CPF</label>
                  <div className="input-container">
                    <input id="cpf" type="text" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" className="custom-input" required />
                    <FileText className="input-icon" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label" htmlFor="password">Senha</label>
                    <div className="input-container">
                      <input id="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="custom-input" required minLength={6} />
                      <Lock className="input-icon" />
                    </div>
                  </div>

                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label" htmlFor="confirmPassword">Confirmação</label>
                    <div className="input-container">
                      <input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="custom-input" required minLength={6} />
                      <Lock className="input-icon" />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                  Avançar para o Passo 2
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleRegister} className="cadastro-form">
                <div className="input-group">
                  <label className="input-label" htmlFor="condominiumName">Nome do Condomínio</label>
                  <div className="input-container">
                    <input id="condominiumName" type="text" value={formData.condominiumName} onChange={handleChange} placeholder="Ex: Residencial Flores" className="custom-input" required />
                    <Building className="input-icon" />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="address">Endereço Completo</label>
                  <div className="input-container">
                    <input id="address" type="text" value={formData.address} onChange={handleChange} placeholder="Rua, Número, Bairro" className="custom-input" required />
                    <MapPin className="input-icon" />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="city">Cidade / UF</label>
                  <div className="input-container">
                    <input id="city" type="text" value={formData.city} onChange={handleChange} placeholder="São Paulo - SP" className="custom-input" required />
                    <Map className="input-icon" />
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '1rem', backgroundColor: '#10b981' }}>
                  Finalizar e Entrar
                </button>
              </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default CadastroAdmin;
