import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Building, Phone, Home, Loader2, Key, MapPin } from 'lucide-react';
import { supabase } from '../backend/supabaseClient';
import {
  somenteLetras, somenteNumeros, mascaraBloco, mascaraCPF, mascaraTelefone, mascaraEmail,
  cpfCompleto, telefoneCompleto, emailValido, valorDigitado, TAMANHO,
} from '../utils/mascaras';

// Cada campo só aceita o tipo de dado que o modelo sugere (a senha é livre)
const MASCARAS = {
  nome: somenteLetras,
  cpf: mascaraCPF,
  telefone: mascaraTelefone,
  bloco: mascaraBloco,
  apartamento: (v) => somenteNumeros(v, TAMANHO.apartamento),
  email: mascaraEmail,
};
import './Login.css';

const CadastroMorador = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    bloco: '',
    apartamento: '',
    email: '',
    senha: '',
    condominio_id: ''
  });
  const [cidades, setCidades] = useState([]);
  const [selectedCidade, setSelectedCidade] = useState('');
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Busca todas as cidades únicas que têm condomínios cadastrados
  useEffect(() => {
    const fetchCidades = async () => {
      const { data, error } = await supabase.from('Condominios').select('cidade');
      if (error) console.error('Erro ao carregar cidades:', error);
      if (data) {
        const uniqueCidades = [...new Set(data.map(c => c.cidade).filter(Boolean))].sort();
        setCidades(uniqueCidades);
      }
    };
    fetchCidades();
  }, []);

  // Busca os condomínios da cidade selecionada
  useEffect(() => {
    const fetchCondominios = async () => {
      if (!selectedCidade) {
        setCondominios([]);
        return;
      }
      const { data, error } = await supabase.from('Condominios').select('id, nome').eq('cidade', selectedCidade);
      if (error) console.error('Erro ao carregar condomínios:', error);
      if (data) setCondominios(data);
    };
    fetchCondominios();
  }, [selectedCidade]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const mascara = MASCARAS[id];
    setFormData(prev => ({ ...prev, [id]: mascara ? valorDigitado(e, mascara) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const problema =
      !formData.nome.trim()                ? 'Informe seu nome.' :
      !cpfCompleto(formData.cpf)           ? 'O CPF precisa ter 11 números.' :
      !telefoneCompleto(formData.telefone) ? 'O telefone precisa ter DDD + 9 números.' :
      !formData.condominio_id              ? 'Selecione um condomínio.' :
      formData.bloco.length !== 1          ? 'O bloco é uma única letra.' :
      !formData.apartamento                ? 'Informe o número do apartamento.' :
      !emailValido(formData.email)         ? 'Informe um e-mail válido (ex.: nome@gmail.com).' :
      null;
    if (problema) {
       setErrorMsg(problema);
       setLoading(false);
       return;
    }

    try {
      // A conta e o cadastro de morador (PENDENTE) são criados juntos pelo banco:
      // se o CPF ou o telefone já existirem, nada é criado.
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: {
            tipo: 'morador',
            nome: formData.nome,
            cpf: formData.cpf,
            telefone: formData.telefone,
            bloco: formData.bloco,
            apartamento: formData.apartamento,
            condominio_id: parseInt(formData.condominio_id),
          },
        },
      });

      if (authError) {
        if (/already registered/i.test(authError.message)) throw new Error('Este e-mail já está cadastrado.');
        if (/database error/i.test(authError.message)) throw new Error('Não foi possível concluir o cadastro. Verifique se o CPF ou o telefone já não estão cadastrados.');
        throw authError;
      }

      // Só entra depois que o Master aprovar
      await supabase.auth.signOut();

      setSuccessMsg('Cadastro realizado com sucesso! Aguarde a aprovação do seu síndico para acessar.');
      setTimeout(() => navigate('/login'), 5000);
      
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setErrorMsg(error.message || 'Erro inesperado ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Column (Logo Area) */}
      <div className="login-left-panel">
        <div className="login-logo-container">
          <img
            src="/Design_sem_nome-removebg-preview.png"
            alt="Habitare"
            className="login-logo-img"
          />
        </div>
      </div>

      {/* Right Column (Form Area) */}
      <div className="login-right-panel" style={{ overflowY: 'auto', alignItems: 'flex-start', padding: '0 1.5rem' }}>
        <div className="login-form-wrapper" style={{ margin: '6rem auto 4rem auto', maxWidth: '28rem' }}>
          <div className="login-header" style={{ marginBottom: '1.5rem' }}>
            <h1 className="login-title" style={{ fontSize: '1.8rem' }}>Cadastro de Morador</h1>
            <p className="login-subtitle" style={{ fontSize: '0.85rem' }}>Preencha seus dados para solicitar acesso ao seu condomínio</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            
            {errorMsg && (
              <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                {successMsg}
              </div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="nome">Nome Completo</label>
              <div className="input-container">
                <input id="nome" type="text" maxLength={TAMANHO.nome} autoComplete="name" value={formData.nome} onChange={handleInputChange} onCompositionEnd={handleInputChange} placeholder="Seu nome" className="custom-input" required disabled={loading} />
                <User className="input-icon" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="cpf">CPF</label>
              <div className="input-container">
                <input id="cpf" type="text" inputMode="numeric" maxLength={TAMANHO.cpf} value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" className="custom-input" required disabled={loading} />
                <User className="input-icon" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="telefone">Telefone</label>
              <div className="input-container">
                <input id="telefone" type="tel" inputMode="numeric" maxLength={TAMANHO.telefone} autoComplete="tel" value={formData.telefone} onChange={handleInputChange} placeholder="(00) 00000-0000" className="custom-input" required disabled={loading} />
                <Phone className="input-icon" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="cidade">Cidade do Condomínio</label>
              <div className="input-container">
                <select 
                  id="cidade" 
                  value={selectedCidade} 
                  onChange={(e) => {
                     setSelectedCidade(e.target.value);
                     setFormData(prev => ({ ...prev, condominio_id: '' }));
                  }} 
                  className="custom-input" 
                  required 
                  disabled={loading} 
                  style={{ appearance: 'none' }}
                >
                  <option value="" disabled>Selecione a cidade</option>
                  {cidades.map(cid => (
                    <option key={cid} value={cid}>{cid}</option>
                  ))}
                </select>
                <MapPin className="input-icon" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="condominio_id">Condomínio</label>
              <div className="input-container">
                <select 
                  id="condominio_id" 
                  value={formData.condominio_id} 
                  onChange={handleInputChange} 
                  className="custom-input" 
                  required 
                  disabled={loading || !selectedCidade} 
                  style={{ appearance: 'none' }}
                >
                  <option value="" disabled>
                    {selectedCidade ? "Selecione o Condomínio" : "Selecione uma cidade primeiro"}
                  </option>
                  {condominios.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <Building className="input-icon" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="bloco">Bloco/Torre</label>
                <div className="input-container">
                  <input id="bloco" type="text" maxLength={TAMANHO.bloco} value={formData.bloco} onChange={handleInputChange} placeholder="Ex: A" className="custom-input" required disabled={loading} />
                  <Building className="input-icon" />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="apartamento">Apartamento</label>
                <div className="input-container">
                  <input id="apartamento" type="text" inputMode="numeric" maxLength={TAMANHO.apartamento} value={formData.apartamento} onChange={handleInputChange} placeholder="Ex: 101" className="custom-input" required disabled={loading} />
                  <Home className="input-icon" />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="email">E-mail (Login)</label>
              <div className="input-container">
                <input id="email" type="email" maxLength={TAMANHO.email} autoComplete="email" value={formData.email} onChange={handleInputChange} placeholder="seu@email.com" className="custom-input" required disabled={loading} />
                <Mail className="input-icon" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="senha">Senha</label>
              <div className="input-container">
                <input id="senha" type="password" value={formData.senha} onChange={handleInputChange} placeholder="Mínimo 6 caracteres" minLength="6" className="custom-input" required disabled={loading} />
                <Lock className="input-icon" />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Loader2 className="input-icon" style={{ animation: 'spin 1s linear infinite', position: 'static', color: 'inherit' }} size={20} />
                  Registrando...
                </div>
              ) : (
                'Solicitar Acesso'
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <Link to="/login" className="text-link" style={{ color: 'var(--role-primary-color)', fontSize: '0.85rem', fontWeight: 600 }}>
               Já tenho uma conta. Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadastroMorador;
