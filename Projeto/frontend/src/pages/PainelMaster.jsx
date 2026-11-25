import React, { useState, useEffect } from 'react';
import { FaixaStatus, Pictograma } from '../components/Placa';
import { classeStatus } from '../utils/statusOcorrencia';
import ErroCarregamento from '../components/ErroCarregamento';
import {
  Menu, Search, UserCheck, Shield, User, Building, MoreVertical, Check, X, Users, UserPlus, FileText, Ban, Edit2, Key, LayoutDashboard, Clock, Settings, AlertTriangle, Eye, TrendingUp, TrendingDown, DollarSign, AlertCircle, Loader2, Trash2, ShieldOff, Wrench
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import Janela from '../components/Janela';
import { rotuloBloco, VAZIO_UNIDADE, partesDoApartamento } from '../utils/unidades';
import SeletorUnidade from '../components/SeletorUnidade';
import { avisarMudancaOcorrencias as atualizarContadores } from '../hooks/useContadoresGestao';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import { useCategorias } from '../hooks/useCategorias';
import './PainelMaster.css';

// Faixa do pé da placa do morador: as mesmas cores fixas de status do resto do site
const FAIXA_MORADOR = {
  ATIVO: ['st-resolvida', 'Ativo'],
  PENDENTE: ['st-andamento', 'Pendente'],
  BLOQUEADO: ['st-aberta', 'Bloqueado'],
};

// Cada sub-aba da Gestão de Moradores mostra um status
const STATUS_DA_ABA = { ativos: 'ATIVO', pendentes: 'PENDENTE', bloqueados: 'BLOQUEADO' };

const PainelMaster = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';

  // A gestão de funcionários virou página própria (/funcionarios), usada também pelo síndico
  useEffect(() => {
    if (activeTab === 'funcionarios') navigate('/funcionarios', { replace: true });
  }, [activeTab, navigate]);

  const [users, setUsers] = useState([]);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  // Modals state (For Users)
  const [papelEdit, setPapelEdit] = useState(null); // { user, acao: 'promover' | 'revogar' }
  const [salvandoPapel, setSalvandoPapel] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filtro Bloco → Andar → Apartamento da Gestão de Moradores (vazio = todos)
  const [blocosCond, setBlocosCond] = useState([]);
  const [filtroUnidade, setFiltroUnidade] = useState(VAZIO_UNIDADE);

  useEffect(() => {
    if (!currentUser?.condominio_id || currentUser.role !== 'MASTER') return undefined;
    let ativo = true;
    supabase.rpc('blocos_do_condominio', { p_condominio_id: currentUser.condominio_id }).then(({ data, error }) => {
      if (error) console.error('Erro ao carregar blocos:', error);
      if (ativo) setBlocosCond(data || []);
    });
    return () => { ativo = false; };
  }, [currentUser?.condominio_id, currentUser?.role]);

  const filtrando = !!filtroUnidade.bloco;
  const passaFiltro = (u) => {
    if (!filtroUnidade.bloco) return true;
    if ((u.bloco || '').trim().toLowerCase() !== filtroUnidade.bloco.toLowerCase()) return false;
    const partes = partesDoApartamento(u.apartamento);
    if (filtroUnidade.andar && partes?.andar !== filtroUnidade.andar) return false;
    if (filtroUnidade.apto && partes?.apto !== filtroUnidade.apto) return false;
    return true;
  };

  const [moradoresSubTab, setMoradoresSubTab] = useState(() => {
    const sub = new URLSearchParams(window.location.search).get('sub');
    return ['ativos', 'pendentes', 'bloqueados'].includes(sub) ? sub : 'ativos';
  });

  // Forms states
  const { rotulo } = useCategorias();

  const [feedbackModal, setFeedbackModal] = useState({ show: false, title: '', message: '', type: 'success' });

  // Avisos na janela padrão (no lugar do alerta do navegador)
  const avisar = (title, message, type = 'error') => setFeedbackModal({ show: true, title, message, type });
  const fecharAviso = () => setFeedbackModal({ show: false, title: '', message: '', type: 'success' });

  // User Stats
  const totalUsers = users.length;
  const pendingUsers = users.filter(u => u.status === 'PENDENTE').length;

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'MASTER') return;

    const fetchDashboardData = async () => {
      setLoadingData(true);
      setErroCarga(false);
      try {
        const { data: masterData, error: erroMaster } = await supabase.from('Masters').select('condominio_id').eq('id', currentUser.id).single();
        if (erroMaster || !masterData) throw erroMaster || new Error('Master sem condomínio');

        const condId = masterData.condominio_id;

        // Tudo ao mesmo tempo (antes era uma consulta depois da outra)
        const resultados = await Promise.all([
          supabase.from('Moradores').select('*').eq('condominio_id', condId),
          supabase.from('Funcionarios').select('*').eq('condominio_id', condId),
          supabase.from('Gestao_Sindicos').select('morador_id').eq('condominio_id', condId).eq('ativo', true),
          supabase.rpc('emails_do_condominio', { p_condominio_id: condId }),
          supabase.from('funcionario_especialidades').select('funcionario_id, categoria'),
          supabase.from('Ocorrencias').select('*').eq('condominio_id', condId),
        ]);
        const falha = resultados.find(res => res.error);
        if (falha) throw falha.error;
        const [{ data: moradores }, { data: funcionarios }, { data: gestao }, { data: userEmails }, { data: esp }, { data: occ }] = resultados;
        const espPorFunc = {};
        (esp || []).forEach(e => { (espPorFunc[e.funcionario_id] ||= []).push(e.categoria); });

        const sindicosIds = gestao ? gestao.map(g => g.morador_id) : [];
        const getEmail = (id) => userEmails?.find(e => e.id === id)?.email || 'Sem e-mail';

        let allUsers = [];
        if (moradores) allUsers.push(...moradores.map(m => ({ ...m, role: sindicosIds.includes(m.id) ? 'SINDICO' : 'MORADOR', status: m.status || 'ATIVO', email: getEmail(m.id) })));
        if (funcionarios) allUsers.push(...funcionarios.map(f => ({ ...f, role: 'FUNCIONARIO', status: f.status || 'ATIVO', email: getEmail(f.id), especialidades: espPorFunc[f.id] || [] })));

        // Sort: PENDENTES first
        allUsers.sort((a, b) => {
          if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
          if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
          return 0;
        });

        setUsers(allUsers);

        setOcorrencias(occ || []);

      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setErroCarga(true);
      } finally {
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [currentUser, tentativa]);

  const handleApprove = async (user) => {
    try {
      let table = '';
      if (user.role === 'MORADOR') table = 'Moradores';
      else if (user.role === 'FUNCIONARIO') table = 'Funcionarios';
      else return;

      // A notificação para o morador é criada pelo banco (trigger)
      const { error } = await supabase.from(table).update({ status: 'ATIVO' }).eq('id', user.id);
      if (error) throw error;

      setUsers(users.map(u => u.id === user.id ? { ...u, status: 'ATIVO' } : u));
      atualizarContadores();
    } catch (e) {
      avisar('Não foi possível aprovar', e.message);
    }
  };

  const handleBlock = async (user) => {
    const newStatus = user.status === 'BLOQUEADO' ? 'ATIVO' : 'BLOQUEADO';
    try {
      let table = '';
      if (user.role === 'MORADOR') table = 'Moradores';
      else if (user.role === 'FUNCIONARIO') table = 'Funcionarios';
      else return;

      // A notificação de bloqueio/desbloqueio é criada pelo banco (trigger)
      const { error } = await supabase.from(table).update({ status: newStatus }).eq('id', user.id);
      if (error) throw error;

      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      atualizarContadores();
    } catch (e) {
      avisar('Não foi possível atualizar o status', e.message);
    }
  };

  // Nomear ou revogar síndico: sempre confirma na janela antes de salvar
  const handleRoleChange = (userId, newRole) => {
    const alvo = users.find(u => u.id === userId);
    if (!alvo) return;

    if (newRole === 'SINDICO') {
      const atual = users.find(u => u.role === 'SINDICO');
      if (atual && atual.id !== userId) {
        avisar('Já existe um síndico', `${atual.nome} é o síndico atual. Volte ${atual.nome} para morador antes de nomear outra pessoa.`);
        return;
      }
      setPapelEdit({ user: alvo, acao: 'promover' });
    } else if (newRole === 'MORADOR' && alvo.role === 'SINDICO') {
      setPapelEdit({ user: alvo, acao: 'revogar' });
    }
  };

  const confirmarPapel = async () => {
    if (!papelEdit || salvandoPapel) return;
    const { user, acao } = papelEdit;
    setSalvandoPapel(true);
    try {
      const { error } = acao === 'promover'
        ? await supabase.from('Gestao_Sindicos').insert({ morador_id: user.id, condominio_id: user.condominio_id, ativo: true })
        : await supabase.from('Gestao_Sindicos').update({ ativo: false }).eq('morador_id', user.id);
      if (error) throw error;
      setUsers(users.map(u => (u.id === user.id ? { ...u, role: acao === 'promover' ? 'SINDICO' : 'MORADOR' } : u)));
      setPapelEdit(null);
    } catch (err) {
      avisar(acao === 'promover' ? 'Não foi possível nomear o síndico' : 'Não foi possível revogar o síndico', err.message);
    } finally {
      setSalvandoPapel(false);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const roleColor = { MASTER: '#121417', SINDICO: '#121417', FUNCIONARIO: '#16a34a', MORADOR: '#ea580c' };
  const roleLabel = { MASTER: 'Master', SINDICO: 'Síndico', FUNCIONARIO: 'Funcionário', MORADOR: 'Morador' };
  const statusColor = { ATIVO: { text: '#16a34a', bg: '#dcfce7' }, PENDENTE: { text: '#d97706', bg: '#fef3c7' }, BLOQUEADO: { text: '#dc2626', bg: '#fee2e2' } };

  // Ocorrencias KPIs
  // Status reais do banco: Aberta, Em Análise, Em Andamento e Resolvida (exibida como "Concluída")
  const pipeAberta    = ocorrencias.filter(o => o.status === 'Aberta').length;
  const pipeAnalise   = ocorrencias.filter(o => o.status === 'Em Análise').length;
  const pipeAndamento = ocorrencias.filter(o => o.status === 'Em Andamento').length;
  const pipeConcluida = ocorrencias.filter(o => o.status === 'Resolvida').length;

  if (erroCarga) {
    return (
      <div className="dashboard-layout">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ErroCarregamento onTentar={() => setTentativa(t => t + 1)} />
        </main>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="dashboard-layout">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="input-icon" style={{ animation: 'spin 1s linear infinite', position: 'static', color: 'var(--role-primary-color)' }} size={32} />
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">{activeTab === 'usuarios' ? 'Gestão de Moradores' : 'Visão Geral do Condomínio'}</h2>
              <p className="header-date">Painel Administrativo ({currentUser?.name})</p>
            </div>
          </div>
          <div className="header-right">
            <NotificationMenu />
            <div
              className="user-profile-dropdown"
              onClick={() => navigate('/perfil')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                borderLeft: '1px solid #e2e8f0',
                paddingLeft: '1rem',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background:'var(--hab-laranja)', color:'var(--hab-tinta)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}>
                {currentUser?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        <ContextBanner />

        <div className="dashboard-content-scroll" style={{ padding: '2rem' }}>

          {activeTab === 'overview' && (
            <div className="mo-visao">
              {/* Placas de status do condomínio */}
              <div className="painel-placas">
                {[
                  { status: 'Aberta', valor: pipeAberta },
                  { status: 'Em Análise', valor: pipeAnalise },
                  { status: 'Em Andamento', valor: pipeAndamento },
                  { status: 'Resolvida', valor: pipeConcluida },
                ].map(k => (
                  <button key={k.status} type="button" className="placa placa-clicavel placa-status" onClick={() => navigate(k.status === 'Em Análise' ? '/ocorrencias-analise' : k.status === 'Resolvida' ? '/ocorrencias-concluidas' : '/feed')}>
                    <span className="placa-status-numero">{k.valor}</span>
                    <span className="placa-status-sub">de {ocorrencias.length} ocorrências</span>
                    <FaixaStatus status={k.status} />
                  </button>
                ))}
              </div>

              <div className="mo-colunas">
                <section className="placa mo-moradores">
                  <div className="placa-cabeca">
                    <div className="placa-local">
                      <span className="placa-rotulo">Usuários cadastrados</span>
                      <span className="placa-valor">{totalUsers}</span>
                    </div>
                    <span className="placa-picto"><Users size={20} /></span>
                  </div>
                  <div className="placa-corpo">
                    <p className="placa-texto">
                      {pendingUsers > 0
                        ? <><strong>{pendingUsers} {pendingUsers === 1 ? 'pedido' : 'pedidos'} de acesso</strong> esperando a sua aprovação.</>
                        : 'Nenhum pedido de acesso pendente.'}
                    </p>
                  </div>
                  <div className="placa-acoes">
                    <button type="button" className={pendingUsers > 0 ? 'btn-hab' : 'btn-secondary'} style={{ padding: '0.55rem 1rem' }} onClick={() => navigate('/painel-master?tab=usuarios')}>
                      {pendingUsers > 0 ? 'Revisar pedidos' : 'Ver moradores'}
                    </button>
                  </div>
                </section>

                <section className="placa mo-ultimas">
                  <h3 className="section-title" style={{ margin: '0.9rem 0.95rem 0.25rem' }}>Últimas ocorrências</h3>
                  <ul className="mo-lista">
                    {ocorrencias.slice().sort((x, y) => new Date(y.created_at) - new Date(x.created_at)).slice(0, 4).map(occ => (
                      <li key={occ.id}>
                        <Pictograma categoria={occ.categoria} tamanho={16} />
                        <div className="mo-lista-texto">
                          <strong>{occ.titulo}</strong>
                          <span>{new Date(occ.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <span className={`mo-pilula ${classeStatus(occ.status)}`}>{occ.status === 'Resolvida' ? 'Concluída' : occ.status}</span>
                      </li>
                    ))}
                    {ocorrencias.length === 0 && <li className="mo-vazio">Nenhuma ocorrência registrada.</li>}
                  </ul>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'usuarios' && (() => {
            const list = users.filter(u => u.role !== 'FUNCIONARIO');
            const hasActiveSindico = list.some(u => u.role === 'SINDICO');
            const sindico = list.find(u => u.role === 'SINDICO');
            const moradoresDaAba = list.filter(u => u.role !== 'SINDICO' && u.status === STATUS_DA_ABA[moradoresSubTab] && passaFiltro(u));
            const lActive = list.filter(u => u.status === 'ATIVO').length;
            const lPending = list.filter(u => u.status === 'PENDENTE').length;
            const lBlocked = list.filter(u => u.status === 'BLOQUEADO').length;

            // Mesma linguagem das outras telas: placa com a unidade em destaque e a faixa do status no pé
            const cartao = (u, ehSindico = false) => {
              const bloqueado = u.status === 'BLOQUEADO';
              const [classeFaixa, nomeStatus] = FAIXA_MORADOR[u.status] || ['placa-faixa-neutra', u.status];
              const unidade = u.apartamento ? `${u.bloco ? `${rotuloBloco(u.bloco)} · ` : ''}Apto ${u.apartamento}` : 'Sem unidade';
              const podePromover = !hasActiveSindico && u.status === 'ATIVO';
              return (
                <article key={u.id} className={`placa placa-entra gm-placa${bloqueado ? ' gm-placa-bloqueada' : ''}`}>
                  <div className="placa-cabeca">
                    <div className="placa-local">
                      <span className="placa-rotulo">Unidade</span>
                      <span className="placa-valor placa-valor-longo">{unidade}</span>
                    </div>
                    {ehSindico && <span className="gm-selo-sindico"><Shield size={13} /> Síndico</span>}
                  </div>

                  <button type="button" className="gm-pessoa" onClick={() => handleViewDetails(u)} title="Ver detalhes">
                    <span className="gm-avatar">{(u.nome || u.name || 'M').charAt(0).toUpperCase()}</span>
                    <span className="gm-pessoa-texto">
                      <strong>{u.nome || u.name}</strong>
                      <small>{u.email}</small>
                    </span>
                  </button>
                  {u.cpf && <p className="gm-doc">CPF {u.cpf}</p>}

                  <div className="gm-acoes">
                    {u.status === 'PENDENTE' && (<>
                      <button type="button" className="btn-hab gm-btn" onClick={() => handleApprove(u)}><Check size={15} /> Liberar</button>
                      <button type="button" className="gm-btn gm-btn-sec gm-btn-perigo" onClick={() => handleBlock(u)} title="Recusar o pedido (vai para Bloqueados)"><X size={15} /> Recusar</button>
                    </>)}
                    {ehSindico && (
                      <button type="button" className="gm-btn gm-btn-sec" onClick={() => handleRoleChange(u.id, 'MORADOR')}><ShieldOff size={15} /> Revogar síndico</button>
                    )}
                    {!ehSindico && podePromover && (
                      <button type="button" className="gm-btn gm-btn-sec" onClick={() => handleRoleChange(u.id, 'SINDICO')}><Shield size={15} /> Tornar síndico</button>
                    )}
                    {!ehSindico && u.status !== 'PENDENTE' && u.id !== currentUser?.id && (
                      <button type="button" className={`gm-btn gm-btn-sec${bloqueado ? '' : ' gm-btn-perigo'}`} onClick={() => handleBlock(u)}>
                        {bloqueado ? <><Check size={15} /> Desbloquear</> : <><Ban size={15} /> Bloquear</>}
                      </button>
                    )}
                  </div>
                  {ehSindico && <p className="gm-nota">Para bloquear, revogue o síndico primeiro.</p>}

                  <div className={`placa-faixa ${classeFaixa}`}>
                    <span className="placa-faixa-status">{nomeStatus}</span>
                  </div>
                </article>
              );
            };

            return (
              <div className="gm">
                <div className="painel-placas gm-placas">
                  <div className="placa placa-status">
                    <span className="placa-status-numero">{list.length}</span>
                    <span className="placa-status-sub">moradores no condomínio</span>
                    <div className="placa-faixa placa-faixa-neutra"><span className="placa-faixa-status">Total</span></div>
                  </div>
                  {[
                    ['ativos', lActive, 'com acesso liberado'],
                    ['pendentes', lPending, 'esperando aprovação'],
                    ['bloqueados', lBlocked, 'sem acesso'],
                  ].map(([aba, n, sub]) => {
                    const [classeFaixa, nome] = FAIXA_MORADOR[STATUS_DA_ABA[aba]];
                    return (
                      <button key={aba} type="button" className={`placa placa-clicavel placa-status${moradoresSubTab === aba ? ' gm-placa-ativa' : ''}`} onClick={() => setMoradoresSubTab(aba)}>
                        <span className="placa-status-numero">{n}</span>
                        <span className="placa-status-sub">{sub}</span>
                        <div className={`placa-faixa ${classeFaixa}`}><span className="placa-faixa-status">{nome}s</span></div>
                      </button>
                    );
                  })}
                </div>

                <div className="oc-abas" role="tablist">
                  {[['ativos', 'Ativos', lActive], ['pendentes', 'Pendentes', lPending], ['bloqueados', 'Bloqueados', lBlocked]].map(([k, rotulo, n]) => (
                    <button key={k} role="tab" aria-selected={moradoresSubTab === k} className={moradoresSubTab === k ? 'ativa' : ''} onClick={() => setMoradoresSubTab(k)}>
                      {rotulo} <span>{n}</span>
                    </button>
                  ))}
                </div>

                {moradoresSubTab === 'ativos' && sindico && (
                  <section>
                    <h3 className="gm-secao">Síndico atual</h3>
                    <div className="placas-grade tres">{cartao(sindico, true)}</div>
                  </section>
                )}

                {/* Filtro Bloco → Andar → Apartamento, abaixo do síndico (vale para a lista de moradores) */}
                {blocosCond.length > 0 && (
                  <div className="pm-filtro">
                    <span className="pm-filtro-titulo">Filtrar por apartamento</span>
                    <div className="pm-filtro-campos">
                      <SeletorUnidade
                        blocos={blocosCond}
                        valor={filtroUnidade}
                        onChange={setFiltroUnidade}
                        idBase="filtro-morador"
                        obrigatorio={false}
                        classes={{ grupo: 'pm-filtro-grupo', rotulo: 'pm-filtro-rotulo', select: 'pm-filtro-select' }}
                        vazios={{ bloco: 'Todos os blocos', andar: 'Todos os andares', apto: 'Todos' }}
                      />
                    </div>
                    {filtrando && (
                      <button type="button" className="pm-filtro-limpar" onClick={() => setFiltroUnidade(VAZIO_UNIDADE)}>
                        Limpar filtro
                      </button>
                    )}
                  </div>
                )}

                <section>
                  {moradoresSubTab === 'ativos' && <h3 className="gm-secao">Moradores</h3>}
                  {moradoresDaAba.length === 0 ? (
                    <div className="oc-vazio">
                      <Users size={36} />
                      <h4>{filtrando ? 'Nenhum morador nesse bloco, andar ou apartamento'
                        : moradoresSubTab === 'pendentes' ? 'Nenhum pedido de acesso pendente'
                        : moradoresSubTab === 'bloqueados' ? 'Nenhum morador bloqueado'
                        : 'Nenhum morador ativo neste condomínio'}</h4>
                    </div>
                  ) : (
                    <div className="placas-grade tres">{moradoresDaAba.map(u => cartao(u))}</div>
                  )}
                </section>
              </div>
            );
          })()}

        </div>
      </main>

      {papelEdit && (() => {
        const promover = papelEdit.acao === 'promover';
        const alvo = papelEdit.user;
        const cor = roleColor[alvo.role] || roleColor.MORADOR;
        return (
          <Janela
            icone={promover ? Shield : ShieldOff}
            tom={promover ? 'padrao' : 'perigo'}
            titulo={promover ? 'Nomear síndico' : 'Revogar síndico'}
            subtitulo={promover
              ? 'O morador passa a ter acesso à gestão do condomínio.'
              : 'Ele volta a ser morador e perde o acesso à gestão.'}
            largura="pequena"
            bloqueada={salvandoPapel}
            onFechar={() => setPapelEdit(null)}
            rodape={<>
              <button type="button" className="janela-btn janela-btn-sec btn-cancelar" onClick={() => setPapelEdit(null)} disabled={salvandoPapel}>Cancelar</button>
              <button type="button" className={`janela-btn ${promover ? 'janela-btn-pri' : 'janela-btn-perigo'}`} onClick={confirmarPapel} disabled={salvandoPapel}>
                {salvandoPapel ? <><Loader2 size={16} className="janela-girando" /> Salvando...</>
                  : promover ? <><Shield size={16} /> Nomear síndico</> : <><ShieldOff size={16} /> Revogar síndico</>}
              </button>
            </>}
          >
            <div className="janela-pessoa">
              <span className="janela-avatar" style={{ background: `${cor}18`, color: cor }}>{(alvo.nome || 'M').charAt(0)}</span>
              <div>
                <p className="janela-pessoa-nome">{alvo.nome}</p>
                <p className="janela-pessoa-sub">Bloco {alvo.bloco || '—'} · Apto {alvo.apartamento || '—'}{alvo.cpf ? ` · CPF ${alvo.cpf}` : ''}</p>
              </div>
            </div>
            <p className="janela-texto">
              {promover
                ? <>O síndico acompanha ocorrências e reclamações, encaminha tarefas aos funcionários e publica avisos. <strong>Só pode haver um síndico por vez.</strong></>
                : <>O que ele registrou como síndico (encaminhamentos, pronunciamentos, respostas) continua no histórico. <strong>Os recados que ele enviou aos funcionários ficam encerrados:</strong> continuam visíveis, mas ninguém pode mais responder.</>}
            </p>
          </Janela>
        );
      })()}

      {showDetailsModal && selectedUser && (() => {
        const userRole = selectedUser.role || 'MORADOR';
        const userRoleColor = roleColor[userRole] || '#475569';
        const userStatusColor = statusColor[selectedUser.status] || { text: '#475569', bg: '#f1f5f9' };
        const ehFuncionario = userRole === 'FUNCIONARIO';
        const fechar = () => { setShowDetailsModal(false); setSelectedUser(null); };

        return (
          <Janela
            icone={Eye}
            titulo={`Detalhes do ${ehFuncionario ? 'funcionário' : userRole === 'SINDICO' ? 'síndico' : 'morador'}`}
            onFechar={fechar}
            fecharAoClicarFora
            rodape={<button type="button" className="janela-btn janela-btn-sec" onClick={fechar}>Fechar</button>}
          >
            <div className="janela-pessoa">
              <span className="janela-avatar" style={{ background: `${userRoleColor}18`, color: userRoleColor }}>
                {(selectedUser.nome || selectedUser.name || 'U').charAt(0)}
              </span>
              <div style={{ minWidth: 0 }}>
                <p className="janela-pessoa-nome">{selectedUser.nome || selectedUser.name}</p>
                <p className="janela-pessoa-sub">{selectedUser.email}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  <span className="janela-etiqueta" style={{ color: userRoleColor, background: `${userRoleColor}15` }}>{roleLabel[userRole] || userRole}</span>
                  <span className="janela-etiqueta" style={{ color: userStatusColor.text, background: userStatusColor.bg }}>{selectedUser.status}</span>
                </div>
              </div>
            </div>

            <dl className="janela-ficha">
              {ehFuncionario ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt>Especialidades</dt>
                  <dd>{(selectedUser.especialidades || []).map(c => rotulo(c)).join(' · ') || 'Nenhuma'}</dd>
                </div>
              ) : (
                <>
                  <div><dt>CPF</dt><dd>{selectedUser.cpf || 'Não informado'}</dd></div>
                  <div><dt>Telefone</dt><dd>{selectedUser.telefone || 'Não informado'}</dd></div>
                  <div><dt>Bloco</dt><dd>{selectedUser.bloco || 'Não informado'}</dd></div>
                  <div><dt>Apartamento</dt><dd>{selectedUser.apartamento || 'Não informado'}</dd></div>
                </>
              )}
              <div>
                <dt>Cadastrado em</dt>
                <dd>{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('pt-BR') : 'Não disponível'}</dd>
              </div>
            </dl>
          </Janela>
        );
      })()}

      {feedbackModal.show && (
        <Janela
          icone={feedbackModal.type === 'success' ? Check : AlertCircle}
          tom={feedbackModal.type === 'success' ? 'sucesso' : 'erro'}
          titulo={feedbackModal.title}
          largura="pequena"
          onFechar={fecharAviso}
          fecharAoClicarFora
          rodape={<button type="button" className="janela-btn janela-btn-pri janela-btn-largo" onClick={fecharAviso}>Entendido</button>}
        >
          <p className="janela-texto">{feedbackModal.message}</p>
        </Janela>
      )}

    </div>
  );
};

export default PainelMaster;
