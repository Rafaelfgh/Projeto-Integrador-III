import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Info, Building2, User, Loader2 } from "lucide-react";
import { supabase } from "../backend/supabaseClient"; // Importe ajustado conforme sua estrutura
import "./NovoCondominio.css";

const NovoCondominio = () => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const estadosBR = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ];

  const [formData, setFormData] = useState({
    condoNome: "",
    condoEndereco: "",
    condoCidade: "",
    condoEstado: "",
    masterNome: "",
    tipoDocumento: "CNPJ",
    documento: "",
    masterTelefone: "",
    masterEmail: "",
    masterSenha: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCadastrar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // PASSO 1: Criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.masterEmail,
        password: formData.masterSenha,
      });

      if (authError) throw authError;
      if (!authData.user)
        throw new Error("Erro ao criar usuário de autenticação.");

      const userId = authData.user.id;

      // PASSO 2: Criar o perfil na tabela Masters usando o ID do Auth
      const { data: masterData, error: masterError } = await supabase
        .from("Masters")
        .insert([
          {
            id: userId, // Aqui vinculamos o perfil ao usuário criado no Passo 1
            nome: formData.masterNome,
            telefone: formData.masterTelefone,
            cpf_ou_cnpj: formData.documento,
          },
        ])
        .select()
        .single();

      if (masterError) throw masterError;

      // PASSO 3: Criar o Condomínio
      const { data: condoData, error: condoError } = await supabase
        .from("Condominios")
        .insert([
          {
            nome: formData.condoNome,
            endereco: formData.condoEndereco,
            cidade: formData.condoCidade,
            estado: formData.condoEstado,
            master_id: userId,
          },
        ])
        .select()
        .single();

      if (condoError) throw condoError;

      // PASSO 4: Atualizar o Master com o ID do Condomínio
      const { error: updateError } = await supabase
        .from("Masters")
        .update({ condominio_id: condoData.id })
        .eq("id", userId);

      if (updateError) throw updateError;

      setIsSuccess(true);
    } catch (err) {
      console.error("Erro no fluxo de cadastro:", err);
      setErrorMsg(err.message || "Erro ao realizar cadastro completo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nc-page">
      <div className="nc-topbar">
        <h1 className="nc-title">Novo condomínio</h1>
        <button
          className="nc-btn-outline"
          onClick={() => navigate("/painel-admin")}
        >
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="nc-content-container">
        <div className="nc-card">
          {isSuccess ? (
            <div className="nc-success-state">
              <div className="nc-success-icon">
                <Check size={40} />
              </div>
              <h2>Sucesso!</h2>
              <p>Condomínio e Master cadastrados e vinculados.</p>
              <div className="nc-success-actions">
                <button
                  className="nc-btn-primary"
                  onClick={() => navigate("/painel-admin")}
                >
                  Dashboard
                </button>
                <button
                  className="nc-btn-outline"
                  onClick={() => setIsSuccess(false)}
                >
                  Novo cadastro
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCadastrar}>
              <h2 className="nc-step-title">Cadastro Geral</h2>
              <p className="nc-step-subtitle">
                Insira os dados para criação simultânea do condomínio e usuário
                master.
              </p>

              {errorMsg && (
                <div
                  style={{
                    backgroundColor: "#fee2e2",
                    color: "#b91c1c",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <div className="nc-section-header">
                <Building2 size={18} />
                <h3>Dados do Condomínio</h3>
              </div>

              <div className="nc-form-grid">
                <div className="nc-form-group full-width">
                  <label className="nc-label">Nome do condomínio *</label>
                  <input
                    type="text"
                    className="nc-input"
                    name="condoNome"
                    value={formData.condoNome}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="nc-form-group full-width">
                  <label className="nc-label">Endereço completo *</label>
                  <input
                    type="text"
                    className="nc-input"
                    name="condoEndereco"
                    value={formData.condoEndereco}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="nc-form-group">
                  <label className="nc-label">Cidade *</label>
                  <input
                    type="text"
                    className="nc-input"
                    name="condoCidade"
                    value={formData.condoCidade}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="nc-form-group">
                  <label className="nc-label">Estado *</label>
                  <select
                    className="nc-select"
                    name="condoEstado"
                    value={formData.condoEstado}
                    onChange={handleChange}
                    required
                  >
                    <option value="">UF</option>
                    {estadosBR.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="nc-divider"></div>

              <div className="nc-section-header">
                <User size={18} />
                <h3>Usuário Master</h3>
              </div>

              <div className="nc-form-grid">
                <div className="nc-form-group full-width">
                  <label className="nc-label">Nome Completo *</label>
                  <input
                    type="text"
                    className="nc-input"
                    name="masterNome"
                    value={formData.masterNome}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* --- NOVOS CAMPOS DE AUTENTICAÇÃO --- */}
                <div className="nc-form-group">
                  <label className="nc-label">E-mail de acesso *</label>
                  <input
                    type="email"
                    className="nc-input"
                    name="masterEmail"
                    value={formData.masterEmail}
                    onChange={handleChange}
                    placeholder="exemplo@email.com"
                    required
                  />
                </div>

                <div className="nc-form-group">
                  <label className="nc-label">Senha *</label>
                  <input
                    type="password"
                    className="nc-input"
                    name="masterSenha"
                    value={formData.masterSenha}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
                {/* ------------------------------------ */}

                <div className="nc-form-group">
                  <label className="nc-label">Documento</label>
                  <select
                    className="nc-select"
                    name="tipoDocumento"
                    value={formData.tipoDocumento}
                    onChange={handleChange}
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                  </select>
                </div>

                <div className="nc-form-group">
                  <label className="nc-label">{formData.tipoDocumento} *</label>
                  <input
                    type="text"
                    className="nc-input"
                    name="documento"
                    value={formData.documento}
                    onChange={handleChange}
                    placeholder="Apenas números"
                    required
                  />
                </div>

                <div className="nc-form-group full-width">
                  <label className="nc-label">Telefone *</label>
                  <input
                    type="text"
                    className="nc-input"
                    name="masterTelefone"
                    value={formData.masterTelefone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>

              <div className="nc-info-text">
                <Info size={16} />
                <span>
                  Esta ação criará registros em ambas as tabelas do banco de
                  dados.
                </span>
              </div>

              {console.log(
                "Variáveis carregadas:",
                !!import.meta.env.VITE_SUPABASE_URL
              )}

              <button
                type="submit"
                className="nc-btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="nc-icon-spin" size={20} />
                ) : (
                  "Finalizar Cadastro"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovoCondominio;
