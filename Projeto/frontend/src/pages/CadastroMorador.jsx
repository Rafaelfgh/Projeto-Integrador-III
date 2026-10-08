import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Info, User, Building2, KeyRound, Loader2, Home } from 'lucide-react';
import { supabase } from '../backend/supabaseClient';
import {
  somenteLetras, mascaraCPF, mascaraTelefone, mascaraEmail,
  cpfCompleto, telefoneCompleto, emailValido, valorDigitado, TAMANHO,
} from '../utils/mascaras';
import SeletorUnidade from '../components/SeletorUnidade';
import MarcaHabitare from '../components/MarcaHabitare';
import { VAZIO_UNIDADE, apartamentoEscolhido, descreverUnidade } from '../utils/unidades';
import './NovoCondominio.css';

// Cada campo só aceita o tipo de dado que o modelo sugere (a senha é livre)
const MASCARAS = {
  nome: somenteLetras,
  cpf: mascaraCPF,
  telefone: mascaraTelefone,
  email: mascaraEmail,
};

// Cadastro de morador, no mesmo molde do cadastro de condomínio (uma etapa só):
// dados pessoais → condomínio e apartamento (UF → cidade → condomínio → bloco → andar →
// apartamento, cada escolha libera a próxima) → acesso. O morador nasce pendente.
const CadastroMorador = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    senha: '',
    condominio_id: '',
  });
  const [todosCondominios, setTodosCondominios] = useState([]); // { id, nome, cidade, estado }
  const [uf, setUf] = useState('');
  const [selectedCidade, setSelectedCidade] = useState('');
  const [blocosDe, setBlocosDe] = useState({ id: '', lista: [] }); // blocos já carregados (de qual condomínio)
  const [unidade, setUnidade] = useState(VAZIO_UNIDADE); // Bloco → Andar → Apartamento
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [enviado, setEnviado] = useState(false);

  // Condomínios cadastrados (uma busca só): a tela filtra UF → cidade → condomínio
  useEffect(() => {
    supabase.from('Condominios').select('id, nome, cidade, estado').then(({ data, error }) => {
      if (error) console.error('Erro ao carregar condomínios:', error);
      setTodosCondominios(data || []);
    });
  }, []);

  const unicos = (lista) => [...new Set(lista.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const ufs = unicos(todosCondominios.map(c => c.estado));
  const cidades = unicos(todosCondominios.filter(c => c.estado === uf).map(c => c.cidade));
  const condominios = todosCondominios
    .filter(c => c.estado === uf && c.cidade === selectedCidade)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  // Blocos do condomínio escolhido: enquanto não chegam, a tela mostra "carregando"
  // (e não "sem blocos"), para não confundir quem está se cadastrando.
  const blocosCarregados = !!formData.condominio_id && blocosDe.id === formData.condominio_id;
  const carregandoBlocos = !!formData.condominio_id && !blocosCarregados;
  const blocos = blocosCarregados ? blocosDe.lista : [];

  // Trocar UF ou cidade limpa o que vem depois (condomínio, bloco, andar, apartamento)
  const limparCondominio = () => {
    setFormData(prev => ({ ...prev, condominio_id: '' }));
    setUnidade(VAZIO_UNIDADE);
  };

  // Blocos do condomínio escolhido (a lista vem do banco; antes do login, por RPC)
  useEffect(() => {
    const id = formData.condominio_id;
    if (!id) return undefined;
    let ativo = true;
    supabase.rpc('blocos_do_condominio', { p_condominio_id: Number(id) })
      .then(({ data, error }) => {
        if (error) console.error('Erro ao carregar blocos:', error);
        if (ativo) setBlocosDe({ id, lista: data || [] });
      });
    return () => { ativo = false; };
  }, [formData.condominio_id]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const mascara = MASCARAS[id];
    if (id === 'condominio_id') setUnidade(VAZIO_UNIDADE);
    setFormData(prev => ({ ...prev, [id]: mascara ? valorDigitado(e, mascara) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const problema =
      !formData.nome.trim()                ? 'Informe seu nome.' :
      !cpfCompleto(formData.cpf)           ? 'O CPF precisa ter 11 números.' :
      !telefoneCompleto(formData.telefone) ? 'O telefone precisa ter DDD + 9 números.' :
      !formData.condominio_id              ? 'Selecione o estado, a cidade e o condomínio.' :
      carregandoBlocos                     ? 'Aguarde: os blocos do condomínio ainda estão carregando.' :
      blocos.length === 0                  ? 'Este condomínio ainda não cadastrou os blocos. Fale com a administração.' :
      !apartamentoEscolhido(unidade)       ? 'Escolha o bloco, o andar e o apartamento.' :
      !emailValido(formData.email)         ? 'Informe um e-mail válido (ex.: nome@gmail.com).' :
      formData.senha.length < 6            ? 'A senha precisa ter pelo menos 6 caracteres.' :
      null;
    if (problema) {
      setErrorMsg(problema);
      return;
    }

    setLoading(true);
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
            bloco: unidade.bloco,
            apartamento: apartamentoEscolhido(unidade),
            condominio_id: parseInt(formData.condominio_id, 10),
          },
        },
      });

      if (authError) {
        if (/already registered/i.test(authError.message)) throw new Error('Este e-mail já está cadastrado.');
        if (/database error/i.test(authError.message)) throw new Error('Não foi possível concluir o cadastro. Verifique se o CPF ou o telefone já não estão cadastrados.');
        throw authError;
      }

      // Só entra depois que o cadastro for aprovado
      await supabase.auth.signOut();
      setEnviado(true);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setErrorMsg(error.message || 'Erro inesperado ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const campo = (rotulo, props, classe = '') => (
    <div className={`nc-form-group ${classe}`}>
      <label className="nc-label" htmlFor={props.id}>{rotulo}</label>
      <input className="nc-input" value={formData[props.id]} onChange={handleInputChange} disabled={loading} {...props} />
    </div>
  );

  return (
    <div className="nc-page">
      <div className="nc-topbar">
        <div className="nc-topbar-esquerda">
          <MarcaHabitare />
          <span className="nc-topbar-divisor" aria-hidden="true" />
          <h1 className="nc-title">Cadastro de morador</h1>
        </div>
        <button className="nc-btn-outline" onClick={() => navigate('/login')}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="nc-content-container">
        <div className="nc-card">
          {enviado ? (
            <div className="nc-success-state">
              <div className="nc-success-icon">
                <Check size={40} />
              </div>
              <h2>Cadastro enviado!</h2>
              <p>
                Seu cadastro foi enviado para a administração do condomínio. Assim que for aprovado,
                você poderá entrar com o e-mail e a senha informados.
              </p>
              <div className="nc-success-actions">
                <button className="nc-btn-primary" onClick={() => navigate('/login')}>
                  Ir para o login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className="nc-step-title">Solicitar acesso</h2>
              <p className="nc-step-subtitle">
                Preencha seus dados e escolha o seu apartamento. A administração do condomínio
                analisa o cadastro antes de liberar o acesso.
              </p>

              {errorMsg && <div className="nc-erro" role="alert">{errorMsg}</div>}

              <div className="nc-section-header">
                <User size={18} />
                <h3>Seus dados</h3>
              </div>
              <div className="nc-form-grid">
                {campo('Nome completo *', { id: 'nome', type: 'text', maxLength: TAMANHO.nome, autoComplete: 'name', onCompositionEnd: handleInputChange }, 'full-width')}
                {campo('CPF *', { id: 'cpf', type: 'text', inputMode: 'numeric', maxLength: TAMANHO.cpf, placeholder: '000.000.000-00' })}
                {campo('Telefone *', { id: 'telefone', type: 'tel', inputMode: 'numeric', maxLength: TAMANHO.telefone, autoComplete: 'tel', placeholder: '(00) 00000-0000' })}
              </div>

              <div className="nc-divider"></div>

              <div className="nc-section-header">
                <Building2 size={18} />
                <h3>Condomínio e apartamento</h3>
              </div>
              <div className="nc-form-grid">
                <div className="nc-form-group">
                  <label className="nc-label" htmlFor="uf">Estado (UF) *</label>
                  <select
                    id="uf"
                    className="nc-select"
                    value={uf}
                    onChange={(e) => { setUf(e.target.value); setSelectedCidade(''); limparCondominio(); }}
                    disabled={loading}
                  >
                    <option value="" disabled>Selecione o estado</option>
                    {ufs.map(sigla => <option key={sigla} value={sigla}>{sigla}</option>)}
                  </select>
                </div>
                <div className="nc-form-group">
                  <label className="nc-label" htmlFor="cidade">Cidade *</label>
                  <select
                    id="cidade"
                    className="nc-select"
                    value={selectedCidade}
                    onChange={(e) => { setSelectedCidade(e.target.value); limparCondominio(); }}
                    disabled={loading || !uf}
                  >
                    <option value="" disabled>{uf ? 'Selecione a cidade' : ''}</option>
                    {cidades.map(cid => <option key={cid} value={cid}>{cid}</option>)}
                  </select>
                </div>
                <div className="nc-form-group full-width">
                  <label className="nc-label" htmlFor="condominio_id">Condomínio *</label>
                  <select
                    id="condominio_id"
                    className="nc-select"
                    value={formData.condominio_id}
                    onChange={handleInputChange}
                    disabled={loading || !selectedCidade}
                  >
                    <option value="" disabled>{selectedCidade ? 'Selecione o condomínio' : ''}</option>
                    {condominios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>

                {/* Bloco (linha inteira) → Andar e Apartamento lado a lado; cada um libera o próximo */}
                <div className="nc-unidade">
                  <SeletorUnidade
                    blocos={blocos}
                    valor={unidade}
                    onChange={setUnidade}
                    desativado={loading || !formData.condominio_id}
                    carregando={carregandoBlocos}
                    classes={{ grupo: 'nc-form-group', rotulo: 'nc-label', select: 'nc-select' }}
                    rotulos={{ bloco: 'Bloco *', andar: 'Andar *', apto: 'Apartamento *' }}
                  />
                </div>
                {/* Confirmação do apartamento escolhido */}
                {apartamentoEscolhido(unidade) && (
                  <p className="nc-unidade-escolhida" aria-live="polite">
                    <Home size={16} />
                    <span>{descreverUnidade(unidade.bloco, apartamentoEscolhido(unidade))}</span>
                  </p>
                )}
                {blocosCarregados && blocos.length === 0 && (
                  <p className="nc-aviso full-width">Este condomínio ainda não cadastrou os blocos e apartamentos.</p>
                )}
              </div>

              <div className="nc-divider"></div>

              <div className="nc-section-header">
                <KeyRound size={18} />
                <h3>Acesso</h3>
              </div>
              <div className="nc-form-grid">
                {campo('E-mail (login) *', { id: 'email', type: 'email', maxLength: TAMANHO.email, autoComplete: 'email', placeholder: 'seu@email.com' })}
                {campo('Senha *', { id: 'senha', type: 'password', autoComplete: 'new-password', placeholder: 'Mínimo 6 caracteres' })}
              </div>

              <div className="nc-info-text">
                <Info size={16} />
                <span>Certifique-se de que os dados estão corretos.</span>
              </div>

              <button type="submit" className="nc-btn-primary" disabled={loading}>
                {loading ? <Loader2 className="nc-icon-spin" size={20} /> : 'Solicitar acesso'}
              </button>

              <p className="nc-rodape">
                Já tem uma conta? <Link to="/login">Voltar ao login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CadastroMorador;
