import React, { useState, useEffect, useCallback } from 'react';
import FiltroData, { FILTRO_DATA_VAZIO, passaFiltroData, anosDe } from '../components/FiltroData';
import { combinaBusca } from '../utils/busca';
import ErroCarregamento from '../components/ErroCarregamento';
import {
  Menu, Search, Building2, MapPin, CalendarDays, User, Mail, Phone, IdCard, X, Check, Ban, RefreshCw, Inbox, Users, Layers,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import { resumoBloco } from '../utils/unidades';
import './Dashboard.css';
import './PainelDev.css';

const ABAS = [
  { key: 'PENDENTE', label: 'Pendentes' },
  { key: 'ATIVO',    label: 'Aprovados' },
  { key: 'RECUSADO', label: 'Recusados' },
];

const SITUACAO = {
  PENDENTE: { label: 'Aguardando aprovação', classe: 'dev-st-pendente' },
  ATIVO:    { label: 'Aprovado',             classe: 'dev-st-ativo'    },
  RECUSADO: { label: 'Recusado',             classe: 'dev-st-recusado' },
};

const formatar = (d) => (d
  ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—');

const tipoDocumento = (doc) => (String(doc || '').replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF');

// ---------------------------------------------------------------------------
// Ficha do condomínio (dados do condomínio + de quem está cadastrando)
// ---------------------------------------------------------------------------
const FichaCondominio = ({ condominio, onFechar, onDecidido }) => {
  const [acao, setAcao]         = useState(null); // 'aprovar' | 'recusar'
  const [motivo, setMotivo]     = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro]         = useState(null);
  const [blocos, setBlocos]     = useState({ id: null, lista: [] }); // blocos deste condomínio

  useEffect(() => {
    let ativo = true;
    supabase.rpc('blocos_do_condominio', { p_condominio_id: condominio.id }).then(({ data, error }) => {
      if (error) console.error('Erro ao carregar blocos:', error);
      if (ativo) setBlocos({ id: condominio.id, lista: data || [] });
    });
    return () => { ativo = false; };
  }, [condominio.id]);

  const carregouBlocos = blocos.id === condominio.id;
  const listaBlocos = carregouBlocos ? blocos.lista : [];
  const totalApartamentos = listaBlocos.reduce((soma, b) => soma + b.andares * b.aptos_por_andar, 0);

  const decidir = async (aprovar) => {
    setEnviando(true);
    setErro(null);
    const { error } = await supabase.rpc('decidir_condominio', {
      p_condominio_id: condominio.id,
      p_aprovar: aprovar,
      p_motivo: aprovar ? null : motivo.trim(),
    });
    setEnviando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    onDecidido();
  };

  const situacao = SITUACAO[condominio.status] || SITUACAO.PENDENTE;

  return (
    <>
      <div className="dev-overlay" onClick={onFechar} />
      <aside className="dev-ficha" role="dialog" aria-label={`Ficha de ${condominio.nome}`}>
        <header className="dev-ficha-topo">
          <div>
            <span className="dev-protocolo">Solicitação #{String(condominio.id).padStart(4, '0')}</span>
            <h2>{condominio.nome}</h2>
            <span className={`dev-situacao ${situacao.classe}`}>{situacao.label}</span>
          </div>
          <button className="dev-fechar" onClick={onFechar} aria-label="Fechar"><X size={18} /></button>
        </header>

        <div className="dev-ficha-corpo">
          <section className="dev-secao">
            <h3><Building2 size={15} /> Condomínio</h3>
            <dl>
              <dt>Nome</dt><dd>{condominio.nome}</dd>
              <dt>Endereço</dt><dd>{condominio.endereco}</dd>
              <dt>Cidade / UF</dt><dd>{condominio.cidade} / {condominio.estado}</dd>
              <dt>Solicitado em</dt><dd>{formatar(condominio.criado_em)}</dd>
              <dt>Moradores cadastrados</dt><dd>{condominio.total_moradores}</dd>
              {condominio.decidido_em && (<><dt>Decidido em</dt><dd>{formatar(condominio.decidido_em)}</dd></>)}
              {condominio.motivo_recusa && (<><dt>Motivo da recusa</dt><dd>{condominio.motivo_recusa}</dd></>)}
            </dl>
          </section>

          <section className="dev-secao">
            <h3><Layers size={15} /> Blocos e apartamentos</h3>
            {!carregouBlocos ? (
              <p className="dev-blocos-vazio">Carregando...</p>
            ) : listaBlocos.length === 0 ? (
              <p className="dev-blocos-vazio">Nenhum bloco cadastrado (cadastro anterior aos blocos).</p>
            ) : (
              <>
                <div className="dev-blocos-totais">
                  <div><strong>{listaBlocos.length}</strong><span>{listaBlocos.length === 1 ? 'bloco' : 'blocos'}</span></div>
                  <div><strong>{totalApartamentos}</strong><span>apartamentos no total</span></div>
                </div>
                <ul className="dev-blocos-lista">
                  {listaBlocos.map(b => (
                    <li key={b.id}><strong>{b.nome}</strong><span>{resumoBloco(b)}</span></li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="dev-secao">
            <h3><User size={15} /> Responsável (Master)</h3>
            <dl>
              <dt>Nome</dt><dd>{condominio.master_nome || '—'}</dd>
              <dt>E-mail</dt><dd>{condominio.master_email || '—'}</dd>
              <dt>Telefone</dt><dd>{condominio.master_telefone || '—'}</dd>
              <dt>{tipoDocumento(condominio.master_documento)}</dt><dd>{condominio.master_documento || '—'}</dd>
              <dt>Conta criada em</dt><dd>{formatar(condominio.master_criado_em)}</dd>
            </dl>
          </section>

          {condominio.status !== 'ATIVO' && (
            <section className="dev-acoes">
              {acao === null && (
                <div className="dev-botoes">
                  {condominio.status === 'PENDENTE' && (
                    <button className="dev-btn dev-btn-recusar" onClick={() => setAcao('recusar')}><Ban size={15} /> Recusar</button>
                  )}
                  <button className="dev-btn dev-btn-aprovar" onClick={() => setAcao('aprovar')}><Check size={15} /> Aprovar condomínio</button>
                </div>
              )}

              {acao === 'aprovar' && (
                <div className="dev-confirmar">
                  <p>O master <strong>{condominio.master_nome}</strong> passa a ter acesso ao painel e moradores poderão se cadastrar neste condomínio.</p>
                  <div className="dev-botoes">
                    <button className="dev-btn dev-btn-sec" onClick={() => setAcao(null)} disabled={enviando}>Cancelar</button>
                    <button className="dev-btn dev-btn-aprovar" onClick={() => decidir(true)} disabled={enviando}>
                      <Check size={15} /> {enviando ? 'Aprovando...' : 'Confirmar aprovação'}
                    </button>
                  </div>
                </div>
              )}

              {acao === 'recusar' && (
                <div className="dev-confirmar">
                  <label htmlFor="dev-motivo">Motivo da recusa (o master vai receber)</label>
                  <textarea
                    id="dev-motivo"
                    maxLength={500}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ex.: dados do responsável incompletos; endereço não confere."
                  />
                  <div className="dev-botoes">
                    <button className="dev-btn dev-btn-sec" onClick={() => setAcao(null)} disabled={enviando}>Cancelar</button>
                    <button className="dev-btn dev-btn-recusar" onClick={() => decidir(false)} disabled={enviando || !motivo.trim()}>
                      <Ban size={15} /> {enviando ? 'Recusando...' : 'Confirmar recusa'}
                    </button>
                  </div>
                </div>
              )}

              {erro && <p className="dev-erro" role="alert">{erro}</p>}
            </section>
          )}
        </div>
      </aside>
    </>
  );
};

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
const PainelDev = () => {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [condominios, setCondominios] = useState([]);
  const [aba,         setAba]         = useState('PENDENTE');
  const [busca,       setBusca]       = useState('');
  const [aberto,      setAberto]      = useState(null);
  const [erroCarga,   setErroCarga]   = useState(false);
  const [filtroData,  setFiltroData]  = useState(FILTRO_DATA_VAZIO);
  const [params, setParams] = useSearchParams();

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarga(false);
    const { data, error } = await supabase.rpc('condominios_para_revisao');
    if (error) {
      console.error('Erro ao buscar condomínios:', error);
      setErroCarga(true);
      setLoading(false);
      return;
    }
    setCondominios(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const daAba = condominios.filter(c => c.status === aba);
  const lista = daAba.filter(c =>
    combinaBusca(busca, [c.nome, c.cidade, c.uf, c.master_nome, c.master_email]) &&
    passaFiltroData(c.criado_em, filtroData)
  );


  // Abre também pelo link da notificação (?condominio=<id>); fechar tira o parâmetro
  const condominioDoLink = params.get('condominio');
  const abertoAtual = aberto || condominios.find(c => String(c.id) === condominioDoLink) || null;
  const fecharFicha = () => {
    setAberto(null);
    if (condominioDoLink) setParams({}, { replace: true });
  };
  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Condomínios</h2>
              <p className="header-date">Solicitações de cadastro de novos condomínios</p>
            </div>
          </div>
          <div className="header-right">
            <NotificationMenu />
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', borderLeft:'1px solid #e2e8f0', paddingLeft:'1rem' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--role-primary-color)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                {currentUser?.name?.charAt(0) || 'D'}
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content-scroll" style={{ backgroundColor: '#f8fafc' }}>
          <div className="dev-container">
            <div className="dev-barra">
              <div className="dev-abas" role="tablist">
                {ABAS.map(a => (
                  <button key={a.key} role="tab" aria-selected={aba === a.key} className={aba === a.key ? 'ativa' : ''} onClick={() => setAba(a.key)}>
                    {a.label} <span>{condominios.filter(c => c.status === a.key).length}</span>
                  </button>
                ))}
              </div>
              <div className="dev-busca">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar por condomínio, cidade ou responsável..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>
            <FiltroData rotulo="Solicitado em" valor={filtroData} onChange={setFiltroData} anos={anosDe(daAba.map(c => c.criado_em))} />

            {loading ? (
              <div className="dev-vazio"><RefreshCw size={30} className="dev-girar" /><p>Carregando...</p></div>
            ) : erroCarga ? (
              <ErroCarregamento onTentar={carregar} />
            ) : lista.length === 0 ? (
              <div className="dev-vazio">
                <Inbox size={40} />
                <h4>{aba === 'PENDENTE' ? 'Nenhuma solicitação aguardando' : 'Nada por aqui'}</h4>
              </div>
            ) : (
              <div className="dev-lista">
                {lista.map(c => (
                  <article key={c.id} className={`dev-card dev-card-${c.status.toLowerCase()}`}>
                    <div className="dev-card-info">
                      <h3>{c.nome}</h3>
                      <div className="dev-meta">
                        <span><MapPin size={14} /> {c.cidade} / {c.estado}</span>
                        <span><CalendarDays size={14} /> {formatar(c.criado_em)}</span>
                        <span><User size={14} /> {c.master_nome || '—'}</span>
                        <span><Mail size={14} /> {c.master_email || '—'}</span>
                        {c.status === 'ATIVO' && <span><Users size={14} /> {c.total_moradores} moradores</span>}
                      </div>
                    </div>
                    <button className="dev-btn dev-btn-pri" onClick={() => setAberto(c)}>
                      <IdCard size={15} /> Abrir ficha
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {abertoAtual && (
        <FichaCondominio
          condominio={abertoAtual}
          onFechar={fecharFicha}
          onDecidido={() => { fecharFicha(); carregar(); }}
        />
      )}
    </div>
  );
};

export default PainelDev;
