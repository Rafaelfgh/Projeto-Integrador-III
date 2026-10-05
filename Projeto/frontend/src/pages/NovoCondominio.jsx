import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Info, Building2, User, Loader2, Layers } from "lucide-react";
import { supabase } from "../backend/supabaseClient";
import EditorBlocos from "../components/EditorBlocos";
import MarcaHabitare from "../components/MarcaHabitare";
import {
  somenteLetras, letrasENumeros, mascaraCPF, mascaraCNPJ, mascaraTelefone, mascaraEmail,
  cpfCompleto, cnpjCompleto, telefoneCompleto, emailValido, TAMANHO,
} from "../utils/mascaras";
import "./NovoCondominio.css";

// Cada campo só aceita o tipo de dado que o modelo sugere (a senha é livre)
const MASCARAS = {
  condoNome: letrasENumeros,
  condoEndereco: letrasENumeros,
  condoCidade: somenteLetras,
  masterNome: somenteLetras,
  masterTelefone: mascaraTelefone,
  masterEmail: mascaraEmail,
};

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

// Cadastro do condomínio em 2 passos:
//  1. responsável (master): nome, CPF/CNPJ, e-mail, senha e telefone;
//  2. condomínio: nome, endereço, cidade, UF e os blocos (pelo menos um).
// Conta, master, condomínio (pendente) e blocos são criados juntos pelo banco.
const NovoCondominio = () => {
  const navigate = useNavigate();
  const [passo, setPasso] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [blocos, setBlocos] = useState([]);

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

  const problemaDoMaster = () => {
    const documentoOk = formData.tipoDocumento === "CPF" ? cpfCompleto(formData.documento) : cnpjCompleto(formData.documento);
    return (
      !formData.masterNome.trim()                ? "Informe o nome do responsável." :
      !documentoOk                               ? (formData.tipoDocumento === "CPF" ? "O CPF precisa ter 11 números." : "O CNPJ precisa ter 14 números.") :
      !emailValido(formData.masterEmail)         ? "Informe um e-mail válido (ex.: nome@gmail.com)." :
      formData.masterSenha.length < 6            ? "A senha precisa ter pelo menos 6 caracteres." :
      !telefoneCompleto(formData.masterTelefone) ? "O telefone precisa ter DDD + 9 números." :
      null
    );
  };

  const problemaDoCondominio = () => (
    !formData.condoNome.trim()     ? "Informe o nome do condomínio." :
    !formData.condoEndereco.trim() ? "Informe o endereço." :
    !formData.condoCidade.trim()   ? "Informe a cidade." :
    !formData.condoEstado          ? "Escolha o estado (UF)." :
    blocos.length === 0            ? "Adicione pelo menos um bloco do condomínio." :
    null
  );

  const avancar = (e) => {
    e.preventDefault();
    const problema = problemaDoMaster();
    setErrorMsg(problema);
    if (!problema) setPasso(2);
  };

  const voltar = () => {
    setErrorMsg(null);
    setPasso(1);
  };

  const handleCadastrar = async (e) => {
    e.preventDefault();
    const problema = problemaDoMaster() || problemaDoCondominio();
    setErrorMsg(problema);
    if (problema) return;

    setLoading(true);
    try {
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
            blocos,
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

  const campo = (rotulo, props, classe = "") => (
    <div className={`nc-form-group ${classe}`}>
      <label className="nc-label" htmlFor={props.name}>{rotulo}</label>
      <input id={props.name} className="nc-input" value={formData[props.name]} onChange={handleChange} disabled={loading} {...props} />
    </div>
  );

  return (
    <div className="nc-page">
      <div className="nc-topbar">
        <div className="nc-topbar-esquerda">
          <MarcaHabitare brilho={false} />
          <span className="nc-topbar-divisor" aria-hidden="true" />
          <h1 className="nc-title">Solicitar cadastro de condomínio</h1>
        </div>
        <button className="nc-btn-outline" onClick={() => (passo === 2 && !isSuccess ? voltar() : navigate(-1))}>
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
                <button className="nc-btn-primary" onClick={() => navigate("/login")}>
                  Ir para o login
                </button>
              </div>
            </div>
          ) : (
            <>
              <ol className="nc-passos" aria-label="Etapas do cadastro">
                <li className={passo === 1 ? "atual" : "feito"}>
                  <span>{passo > 1 ? <Check size={14} /> : 1}</span> Responsável
                </li>
                <li className={passo === 2 ? "atual" : ""}>
                  <span>2</span> Condomínio e blocos
                </li>
              </ol>

              {errorMsg && <div className="nc-erro" role="alert">{errorMsg}</div>}

              {passo === 1 ? (
                <form onSubmit={avancar} noValidate>
                  <h2 className="nc-step-title">Dados do responsável</h2>
                  <p className="nc-step-subtitle">
                    Quem cadastra o condomínio vira o usuário master. O cadastro passa por uma
                    análise antes de o acesso ser liberado.
                  </p>

                  <div className="nc-section-header">
                    <User size={18} />
                    <h3>Usuário Master</h3>
                  </div>

                  <div className="nc-form-grid">
                    {campo("Nome completo *", { name: "masterNome", type: "text", maxLength: TAMANHO.nome, onCompositionEnd: handleChange, autoComplete: "name" }, "full-width")}

                    <div className="nc-form-group">
                      <label className="nc-label" htmlFor="tipoDocumento">Documento</label>
                      <select id="tipoDocumento" className="nc-select" name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange} disabled={loading}>
                        <option value="CPF">CPF</option>
                        <option value="CNPJ">CNPJ</option>
                      </select>
                    </div>
                    {campo(`${formData.tipoDocumento} *`, {
                      name: "documento", type: "text", inputMode: "numeric",
                      maxLength: formData.tipoDocumento === "CPF" ? TAMANHO.cpf : TAMANHO.cnpj,
                      placeholder: formData.tipoDocumento === "CPF" ? "000.000.000-00" : "00.000.000/0000-00",
                    })}

                    {campo("E-mail de acesso *", { name: "masterEmail", type: "email", maxLength: TAMANHO.email, placeholder: "exemplo@email.com", autoComplete: "email" })}
                    {campo("Senha *", { name: "masterSenha", type: "password", placeholder: "Mínimo 6 caracteres", autoComplete: "new-password" })}

                    {campo("Telefone *", { name: "masterTelefone", type: "text", inputMode: "numeric", maxLength: TAMANHO.telefone, placeholder: "(00) 00000-0000", autoComplete: "tel" }, "full-width")}
                  </div>

                  <button type="submit" className="nc-btn-primary">
                    Continuar <ArrowRight size={18} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCadastrar} noValidate>
                  <h2 className="nc-step-title">Dados do condomínio</h2>
                  <p className="nc-step-subtitle">
                    Informe o endereço e cadastre os blocos: eles definem os apartamentos que os
                    moradores vão escolher.
                  </p>

                  <div className="nc-section-header">
                    <Building2 size={18} />
                    <h3>Dados do Condomínio</h3>
                  </div>

                  <div className="nc-form-grid">
                    {campo("Nome do condomínio *", { name: "condoNome", type: "text", maxLength: TAMANHO.condominio, onCompositionEnd: handleChange }, "full-width")}
                    {campo("Endereço completo *", { name: "condoEndereco", type: "text", maxLength: TAMANHO.endereco, onCompositionEnd: handleChange }, "full-width")}
                    {campo("Cidade *", { name: "condoCidade", type: "text", maxLength: TAMANHO.cidade, onCompositionEnd: handleChange })}
                    <div className="nc-form-group">
                      <label className="nc-label" htmlFor="condoEstado">Estado *</label>
                      <select id="condoEstado" className="nc-select" name="condoEstado" value={formData.condoEstado} onChange={handleChange} disabled={loading}>
                        <option value="">UF</option>
                        {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="nc-divider"></div>

                  <div className="nc-section-header">
                    <Layers size={18} />
                    <h3>Blocos *</h3>
                  </div>
                  <p className="nc-blocos-ajuda">
                    Cadastre cada bloco ou torre com a quantidade de andares e de apartamentos por andar.
                    O condomínio precisa de pelo menos um bloco.
                  </p>

                  <EditorBlocos
                    blocos={blocos}
                    desativado={loading}
                    onSalvar={(bloco) => { setBlocos((prev) => [...prev, bloco]); setErrorMsg(null); return null; }}
                    onRemover={(bloco) => { setBlocos((prev) => prev.filter((b) => b.nome !== bloco.nome)); return null; }}
                  />

                  <div className="nc-info-text">
                    <Info size={16} />
                    <span>Certifique-se de que os dados estão corretos.</span>
                  </div>

                  <div className="nc-acoes">
                    <button type="button" className="nc-btn-outline nc-btn-voltar" onClick={voltar} disabled={loading}>
                      <ArrowLeft size={16} /> Voltar
                    </button>
                    <button type="submit" className="nc-btn-primary" disabled={loading}>
                      {loading ? <Loader2 className="nc-icon-spin" size={20} /> : "Finalizar cadastro"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovoCondominio;
