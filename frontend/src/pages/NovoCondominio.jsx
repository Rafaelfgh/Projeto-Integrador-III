import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Info } from 'lucide-react';
import './NovoCondominio.css';

const NovoCondominio = () => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    nome: '',
    tipoDocumento: 'CNPJ',
    documento: '',
    telefone: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-formatting basic logic could go here, but keeping it simple as requested
    // except for type switch resetting the value or applying a mask (if needed).
    if (name === 'tipoDocumento') {
      setFormData(prev => ({ ...prev, tipoDocumento: value, documento: '' }));
      if (errors.documento) setErrors(prev => ({ ...prev, documento: null }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCadastrar = (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.nome.trim()) newErrors.nome = 'Nome do condomínio é obrigatório';
    if (!formData.documento.trim()) newErrors.documento = `${formData.tipoDocumento} é obrigatório`;
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Simulate API call
      setIsSuccess(true);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipoDocumento: 'CNPJ',
      documento: '',
      telefone: ''
    });
    setErrors({});
    setIsSuccess(false);
  };

  return (
    <div className="nc-page">
      {/* Topbar */}
      <div className="nc-topbar">
        <h1 className="nc-title">Novo condomínio</h1>
        <button className="nc-btn-outline" onClick={() => navigate('/painel-admin')}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      {/* Main Content Area */}
      <div className="nc-content-container">
        <div className="nc-card">
          {isSuccess ? (
            <div className="nc-success-state">
              <div className="nc-success-icon">
                <Check size={40} />
              </div>
              <h2>Condomínio cadastrado com sucesso!</h2>
              <p>ID gerado: #CONDO-2847</p>
              
              <div className="nc-success-actions">
                <button className="nc-btn-primary" onClick={() => navigate('/painel-admin')}>
                  Ir para o dashboard
                </button>
                <button className="nc-btn-outline" onClick={resetForm} style={{ justifyContent: 'center' }}>
                  Cadastrar outro
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCadastrar}>
              <h2 className="nc-step-title">Dados do condomínio</h2>
              <p className="nc-step-subtitle">Preencha as informações para cadastrar o condomínio na plataforma.</p>

              <div className="nc-form-grid">
                <div className="nc-form-group full-width">
                  <label className="nc-label">Nome do condomínio *</label>
                  <input 
                    type="text" 
                    className={`nc-input ${errors.nome ? 'nc-input-error' : ''}`} 
                    placeholder="Ex: Edifício Aurora" 
                    name="nome" 
                    value={formData.nome} 
                    onChange={handleChange} 
                  />
                  {errors.nome && <span className="nc-error-msg">{errors.nome}</span>}
                </div>

                <div className="nc-form-group">
                  <label className="nc-label">Tipo de documento</label>
                  <select 
                    className="nc-select" 
                    name="tipoDocumento" 
                    value={formData.tipoDocumento} 
                    onChange={handleChange}
                  >
                    <option value="CPF">CPF — Pessoa física</option>
                    <option value="CNPJ">CNPJ — Pessoa jurídica</option>
                  </select>
                </div>

                <div className="nc-form-group">
                  <label className="nc-label">{formData.tipoDocumento} *</label>
                  <input 
                    type="text" 
                    className={`nc-input ${errors.documento ? 'nc-input-error' : ''}`} 
                    placeholder={formData.tipoDocumento === 'CPF' ? '000.000.000-00' : '00.000.000/0001-00'} 
                    name="documento" 
                    value={formData.documento} 
                    onChange={handleChange} 
                  />
                  {errors.documento && <span className="nc-error-msg">{errors.documento}</span>}
                </div>

                <div className="nc-form-group">
                  <label className="nc-label">Telefone de contato *</label>
                  <input 
                    type="text" 
                    className={`nc-input ${errors.telefone ? 'nc-input-error' : ''}`} 
                    placeholder="(11) 99999-0000" 
                    name="telefone" 
                    value={formData.telefone} 
                    onChange={handleChange} 
                  />
                  {errors.telefone && <span className="nc-error-msg">{errors.telefone}</span>}
                </div>
              </div>

              <div className="nc-divider"></div>

              <div className="nc-info-text">
                <Info size={16} />
                <span>O ID do condomínio será gerado automaticamente pelo sistema após o cadastro.</span>
              </div>

              <button type="submit" className="nc-btn-primary">
                Cadastrar condomínio
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovoCondominio;
