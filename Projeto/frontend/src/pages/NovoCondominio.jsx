import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Info, Building2, User, Loader2 } from "lucide-react";
import { supabase } from "../backend/supabaseClient";
import {
  somenteLetras, letrasENumeros, mascaraCPF, mascaraCNPJ, mascaraTelefone, mascaraEmail,
  cpfCompleto, cnpjCompleto, telefoneCompleto, emailValido, TAMANHO,
} from "../utils/mascaras";

// Cada campo só aceita o tipo de dado que o modelo sugere (a senha é livre)
const MASCARAS = {
  condoNome: letrasENumeros,
  condoEndereco: letrasENumeros,
  condoCidade: somenteLetras,
  masterNome: somenteLetras,
  masterTelefone: mascaraTelefone,
  masterEmail: mascaraEmail,
};
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
    const compondo = e.nativeEvent?.isComposing;
    setFormData((prev) => {
      if (name === "documento") {
        return { ...prev, documento: prev.tipoDocumento === "CPF" ? mascaraCPF(value) : mascaraCNPJ(value) };
      }
      if (name === "tipoDocumento") {
        // Refaz a máscara do documento já digitado no novo formato
        return { ...prev, tipoDocumento: value, documento: value === "CPF" ? mascaraCPF(prev.documento) : mascaraCNPJ(prev.documento) };
      }
      const mascara = MASCARAS[name];
      return { ...prev, [name]: mascara && !compondo ? mascara(value) : value };
    });
  };

  const handleCadastrar = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const documentoOk = formData.tipoDocumento === "CPF" ? cpfCompleto(formData.documento) : cnpjCompleto(formData.documento);
    const problema =
      !formData.condoNome.trim()                ? "Informe o nome do condomínio." :
      !formData.condoEndereco.trim()            ? "Informe o endereço." :
      !formData.condoCidade.trim()              ? "Informe a cidade." :
      !formData.masterNome.trim()               ? "Informe o nome do responsável." :
      !emailValido(formData.masterEmail)        ? "Informe um e-mail válido (ex.: nome@gmail.com)." :
      !documentoOk                              ? (formData.tipoDocumento === "CPF" ? "O CPF precisa ter 11 números." : "O CNPJ precisa ter 14 números.") :
      !telefoneCompleto(formData.masterTelefone) ? "O telefone precisa ter DDD + 9 números." :
      null;
    if (problema) {
      setErrorMsg(problema);
      return;
    }

    setLoading(true);
    try {
      // Conta, Master e Condomínio (pendente) são criados juntos pelo banco (tudo ou nada)
      const { error: authError } = await supabase.auth.signUp({
        email: formData.masterEmail,
        password: formData.masterSenha,
        options: {
          data: {
            tipo: "master",
            nome: formData.masterNome,
            telefone: formData.masterTelefone,
            documento: formData.documento,
            condominio_nome: formData.condoNome,
            endereco: formData.condoEndereco,
            cidade: formData.condoCidade,
            estado: formData.condoEstado,
          },
        },
      });

      if (authError) {
        if (/already registered/i.test(authError.message)) throw new Error("Este e-mail já está cadastrado.");
        if (/database error/i.test(authError.message)) throw new Error("Não foi possível concluir o cadastro. Verifique os dados informados.");
        throw authError;
      }

      // O condomínio fica pendente até ser aprovado: sai da sessão
      await supabase.auth.signOut();
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
        <h1 className="nc-title">Solicitar cadastro de condomínio</h1>
        <button
          className="nc-btn-outline"
          onClick={() => navigate(-1)}
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
              <h2>Solicitação enviada!</h2>
              <p>
                O cadastro do condomínio foi enviado para análise. Assim que for aprovado,
                você poderá entrar com o e-mail e a senha informados.
              </p>
              <div className="nc-success-actions">
                <button
                  className="nc-btn-primary"
                  onClick={() => navigate("/login")}
                >
                  Ir para o login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCadastrar}>
              <h2 className="nc-step-title">Cadastro Geral</h2>
              <p className="nc-step-subtitle">
                Preencha os dados do condomínio e do responsável (master). O cadastro passa
                por uma análise antes de o acesso ser liberado.
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
                    onCompositionEnd={handleChange}
                    maxLength={TAMANHO.condominio}
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
                    onCompositionEnd={handleChange}
                    maxLength={TAMANHO.endereco}
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
                    onCompositionEnd={handleChange}
                    maxLength={TAMANHO.cidade}
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
                    onCompositionEnd={handleChange}
                    maxLength={TAMANHO.nome}
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
                    maxLength={TAMANHO.email}
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
                    inputMode="numeric"
                    maxLength={formData.tipoDocumento === "CPF" ? TAMANHO.cpf : TAMANHO.cnpj}
                    value={formData.documento}
                    onChange={handleChange}
                    placeholder={formData.tipoDocumento === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                    required
                  />
                </div>

                <div className="nc-form-group full-width">
                  <label className="nc-label">Telefone *</label>
                  <input
                    type="text"
                    className="nc-input"
                    name="masterTelefone"
                    inputMode="numeric"
                    maxLength={TAMANHO.telefone}
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
                  Certifique-se que os dados estão corretos.
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
