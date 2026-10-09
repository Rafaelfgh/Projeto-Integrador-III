import React, { useState, useEffect } from 'react';
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

// Tabelas de pessoas (síndico atual e moradores): colunas de largura fixa, títulos e
// conteúdos centralizados nas colunas de dados e etiquetas/botões com a mesma largura
// mínima — o tamanho não muda conforme o valor (ATIVO, PENDENTE, BLOQUEADO...).
const COLUNAS_PESSOAS = [
  { titulo: 'Morador', largura: '30%' },
  { titulo: 'Documentos / Und.', largura: '22%' },
  { titulo: 'Perfil', largura: '14%' },
  { titulo: 'Status', largura: '14%' },
  { titulo: 'Ações', largura: '20%' }, // botões empilhados (Liberar sobre Recusar)
];

const estiloTd = (centro) => ({
  padding: centro ? '14px 8px' : '14px 16px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle', textAlign: centro ? 'center' : 'left',
});

// Etiquetas e botões de perfil, status e ações: mesma largura mínima ("↑ Desbloquear" é o maior)
// e mesma letra da etiqueta de status (fonte do site, maiúsculas, 11 px, negrito) — botões e
// listas usariam a fonte padrão do navegador.
const ETIQUETA = {
  display: 'inline-block', minWidth: 100, boxSizing: 'border-box', textAlign: 'center', textAlignLast: 'center',
  fontFamily: 'inherit', textTransform: 'uppercase',
};

// Lista de perfil (Morador/Síndico) em formato de bolha: seta desenhada na cor do perfil,
// com folga da borda (a seta padrão do navegador fica colada e não aceita espaçamento)
const seletorPerfil = (cor) => {
  const seta = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><path d='M3 4.5l3 3 3-3' fill='none' stroke='${cor}' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
  return {
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundColor: `color-mix(in srgb, ${cor} 14%, #fff)`,
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(seta)}")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '10px',
    padding: '3px 26px 3px 12px',
  };
};

const CabecalhoPessoas = () => (
  <>
    <colgroup>
      {COLUNAS_PESSOAS.map(c => <col key={c.titulo} style={{ width: c.largura }} />)}
    </colgroup>
    <thead>
      <tr style={{ background: '#f8fafc' }}>
        {COLUNAS_PESSOAS.map((c, i) => (
          <th key={c.titulo} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', textAlign: i === 0 ? 'left' : 'center', padding: i === 0 ? '12px 16px' : '12px 8px', borderBottom: '1px solid #e2e8f0' }}>{c.titulo}</th>
        ))}
      </tr>
    </thead>
  </>
);

// Cada sub-aba da Gestão de Moradores mostra um status
const STATUS_DA_ABA = { ativos: 'ATIVO', pendentes: 'PENDENTE', bloqueados: 'BLOQUEADO' };

const PainelMaster = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, changeVisualContext, visualContext } = useAuth();
  const [ctxOpen, setCtxOpen] = useState(false);

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
  const activeUsers = users.filter(u => u.status === 'ATIVO').length;
  const pendingUsers = users.filter(u => u.status === 'PENDENTE').length;
  const blockedUsers = users.filter(u => u.status === 'BLOQUEADO').length;

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

  const roleColor = { MASTER: '#7c3aed', SINDICO: '#4f46e5', FUNCIONARIO: '#16a34a', MORADOR: '#ea580c' };
  const roleLabel = { MASTER: 'Master', SINDICO: 'Síndico', FUNCIONARIO: 'Funcionário', MORADOR: 'Morador' };
  const statusColor = { ATIVO: { text: '#16a34a', bg: '#dcfce7' }, PENDENTE: { text: '#d97706', bg: '#fef3c7' }, BLOQUEADO: { text: '#dc2626', bg: '#fee2e2' } };

  // Ocorrencias KPIs
  // Status reais do banco: Aberta, Em Análise, Em Andamento e Resolvida (exibida como "Concluída")
  const pipeAberta    = ocorrencias.filter(o => o.status === 'Aberta').length;
  const pipeAnalise   = ocorrencias.filter(o => o.status === 'Em Análise').length;
  const pipeAndamento = ocorrencias.filter(o => o.status === 'Em Andamento').length;
  const pipeConcluida = ocorrencias.filter(o => o.status === 'Resolvida').length;
  const totalOcc = ocorrencias.length || 1;

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
                background: 'var(--role-primary-color)', color: 'white',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {[
                  { label: 'OCORRÊNCIAS ABERTAS', value: String(ocorrencias.length - pipeConcluida), trend: 'requerem atenção', trendColor: '#f59e0b' },
                  { label: 'TOTAL DE OCORRÊNCIAS', value: String(ocorrencias.length), trend: 'registradas no sistema', trendColor: '#16a34a' },
                  { label: 'USUÁRIOS CADASTRADOS', value: String(totalUsers), trend: `${pendingUsers} pendentes de aprovação`, trendColor: pendingUsers > 0 ? '#f59e0b' : '#16a34a' },
                ].map((k, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.07em', margin: '0 0 10px' }}>{k.label}</p>
                    <p style={{ fontSize: '32px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px', lineHeight: 1 }}>{k.value}</p>
                    <p style={{ fontSize: '12px', color: k.trendColor, margin: 0, fontWeight: 500 }}>{k.trend}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>Pipeline de ocorrências</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 24px' }}>Todas as ocorrências do sistema por status.</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '130px' }}>
                    {[
                      { label: 'Aberta', value: pipeAberta, color: '#9CA3AF' },
                      { label: 'Em análise', value: pipeAnalise, color: '#3B82F6' },
                      { label: 'Em andamento', value: pipeAndamento, color: '#F59E0B' },
                      { label: 'Concluída', value: pipeConcluida, color: '#10B981' },
                    ].map((col, i) => {
                      const barH = Math.max(10, Math.round((col.value / totalOcc) * 100));
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', height: '100%' }}>
                          <span style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{col.value}</span>
                          <div style={{ width: '100%', height: `${barH}px`, background: col.color, borderRadius: '4px 4px 0 0' }} />
                          <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.3 }}>{col.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 4px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Últimas Ocorrências</h3>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 24px' }}>Atividades recentes registradas.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {ocorrencias.slice(0, 3).map((occ, i) => (
                      <div key={i} style={{ borderLeft: `4px solid ${occ.status === 'Resolvida' ? '#10B981' : '#f59e0b'}`, paddingLeft: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{occ.titulo}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0, marginLeft: '8px' }}>{new Date(occ.created_at).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{occ.descricao}</p>
                      </div>
                    ))}
                    {ocorrencias.length === 0 && <p style={{ fontSize: '12px', color: '#94a3b8' }}>Nenhuma ocorrência registrada.</p>}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'usuarios' && (() => {
            const list = users.filter(u => u.role !== 'FUNCIONARIO');
            const hasActiveSindico = list.some(u => u.role === 'SINDICO');
            const moradoresDaAba = list.filter(u => u.role !== 'SINDICO' && u.status === STATUS_DA_ABA[moradoresSubTab] && passaFiltro(u));
            const lActive = list.filter(u => u.status === 'ATIVO').length;
            const lPending = list.filter(u => u.status === 'PENDENTE').length;
            const lBlocked = list.filter(u => u.status === 'BLOQUEADO').length;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Gestão de Moradores</h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Gerencie aprovações, permissões e acessos dos moradores do condomínio.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  {[
                    { label: 'TOTAL DE MORADORES', value: list.length, color: '#475569' },
                    { label: 'ATIVOS', value: lActive, color: '#16a34a' },
                    { label: 'PENDENTES', value: lPending, color: '#d97706' },
                    { label: 'BLOQUEADOS', value: lBlocked, color: '#dc2626' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px 20px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.07em', margin: '0 0 6px' }}>{s.label}</p>
                      <p style={{ fontSize: '28px', fontWeight: 600, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                  {[
                    { key: 'ativos',     label: 'Ativos',     total: lActive },
                    { key: 'pendentes',  label: 'Pendentes',  total: lPending },
                    { key: 'bloqueados', label: 'Bloqueados', total: lBlocked },
                  ].map(aba => (
                    <button
                      key={aba.key}
                      onClick={() => setMoradoresSubTab(aba.key)}
                      style={{ background: moradoresSubTab === aba.key ? 'var(--role-primary-color)' : '#f8fafc', color: moradoresSubTab === aba.key ? '#fff' : '#64748b', border: '1px solid', borderColor: moradoresSubTab === aba.key ? 'var(--role-primary-color)' : '#e2e8f0', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      {aba.label} ({aba.total})
                    </button>
                  ))}
                </div>

                {/* Filtro Bloco → Andar → Apartamento (cada um libera o próximo, igual ao cadastro) */}
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

                {/* ── Seção Síndico Atual (só aparece na aba Ativos e quando existe síndico) ── */}
                {moradoresSubTab === 'ativos' && (() => {
                  const sindico = list.find(u => u.role === 'SINDICO');
                  if (!sindico) return null;
                  const rc = roleColor['SINDICO'] || '#4f46e5';
                  const sc = statusColor[sindico.status] || { text: '#475569', bg: '#f1f5f9' };
                  return (
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em', margin: '0 0 8px' }}>Síndico Atual</p>
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                          <CabecalhoPessoas />
                          <tbody>
                            <tr style={{ background: '#f5f3ff' }}>
                              <td style={estiloTd(false)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div
                                    onClick={() => handleViewDetails(sindico)}
                                    style={{ width: 36, height: 36, borderRadius: '50%', background: `${rc}18`, color: rc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 0 2px transparent' }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${rc}40`}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 0 2px transparent'}
                                  >
                                    {(sindico.nome || sindico.name || 'S').charAt(0)}
                                  </div>
                                  <div>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{sindico.nome || sindico.name}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{sindico.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td style={{ ...estiloTd(true), fontSize: '12px', color: '#64748b' }}>
                                {sindico.cpf}<br />
                                {sindico.bloco && <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>{rotuloBloco(sindico.bloco)} · Apto {sindico.apartamento}</span>}
                              </td>
                              <td style={estiloTd(true)}>
                                <select
                                  value="SINDICO"
                                  onChange={(e) => handleRoleChange(sindico.id, e.target.value)}
                                  style={{ ...ETIQUETA, ...seletorPerfil(rc), fontSize: '11px', fontWeight: 700, color: rc, border: 'none', borderRadius: '99px', cursor: 'pointer' }}
                                >
                                  <option value="MORADOR">Morador</option>
                                  <option value="SINDICO">Síndico</option>
                                </select>
                              </td>
                              <td style={estiloTd(true)}>
                                <span style={{ ...ETIQUETA, fontSize: '11px', fontWeight: 700, color: sc.text, background: sc.bg, padding: '3px 10px', borderRadius: '99px' }}>{sindico.status}</span>
                              </td>
                              <td style={estiloTd(true)}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                  <button disabled style={{ ...ETIQUETA, fontSize: '11px', fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', border: 'none', borderRadius: '99px', padding: '3px 10px', cursor: 'not-allowed', opacity: 0.6 }}>
                                    ✕ Bloquear
                                  </button>
                                  <div style={{ position: 'relative', display: 'inline-flex' }}
                                    onMouseEnter={e => {
                                      const tip = document.getElementById('sindico-block-tip');
                                      if (tip) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        tip.style.display = 'block';
                                        tip.style.top = (rect.top + rect.height / 2) + 'px';
                                        tip.style.left = (rect.left) + 'px';
                                        tip.style.transform = 'translate(calc(-100% - 10px), -50%)';
                                      }
                                    }}
                                    onMouseLeave={() => {
                                      const tip = document.getElementById('sindico-block-tip');
                                      if (tip) tip.style.display = 'none';
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'help' }}>
                                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* Tooltip global para bloqueio do síndico */}
                <div id="sindico-block-tip" style={{ display: 'none', position: 'fixed', background: '#1e293b', color: 'white', fontSize: '11.5px', fontWeight: 500, padding: '8px 14px', borderRadius: '8px', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 6px 20px rgba(0,0,0,0.2)', pointerEvents: 'none' }}>
                  Para bloquear, retorne-o para Morador primeiro
                  <div style={{ position: 'absolute', top: '50%', left: '100%', transform: 'translateY(-50%)', borderWidth: '5px', borderStyle: 'solid', borderColor: 'transparent transparent transparent #1e293b' }} />
                </div>

                {/* ── Seção Moradores ── */}
                <div>
                  {moradoresSubTab === 'ativos' && (
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em', margin: '0 0 8px' }}>Moradores</p>
                  )}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <CabecalhoPessoas />
                      <tbody>
                        {moradoresDaAba.map((user, i) => {
                          const rc = roleColor[user.role] || '#475569';
                          const rl = roleLabel[user.role] || user.role;
                          const sc = statusColor[user.status] || { text: '#475569', bg: '#f1f5f9' };
                          const isBlocked = user.status === 'BLOQUEADO';
                          const canPromote = !hasActiveSindico && moradoresSubTab === 'ativos' && !isBlocked;
                          return (
                            <tr key={user.id}
                              style={{ background: isBlocked ? '#fffafa' : 'white', transition: 'background 0.1s', opacity: isBlocked ? 0.7 : 1 }}
                              onMouseEnter={e => { if (!isBlocked) e.currentTarget.style.background = '#fafafa'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = isBlocked ? '#fffafa' : 'white'; }}
                            >
                              <td style={estiloTd(false)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div
                                    onClick={() => handleViewDetails(user)}
                                    style={{ width: 36, height: 36, borderRadius: '50%', background: isBlocked ? '#e2e8f0' : `${rc}18`, color: isBlocked ? '#94a3b8' : rc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 0 2px transparent' }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${isBlocked ? '#94a3b8' : rc}40`}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 0 2px transparent'}
                                  >
                                    {(user.nome || user.name || 'U').charAt(0)}
                                  </div>
                                  <div>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{user.nome || user.name}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td style={{ ...estiloTd(true), fontSize: '12px', color: '#64748b' }}>
                                {user.cpf}<br />
                                {user.bloco && <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>{rotuloBloco(user.bloco)} · Apto {user.apartamento}</span>}
                              </td>
                              <td style={estiloTd(true)}>
                                {canPromote ? (
                                  <select
                                    value="MORADOR"
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    style={{ ...ETIQUETA, ...seletorPerfil(rc), fontSize: '11px', fontWeight: 700, color: rc, border: 'none', borderRadius: '99px', cursor: 'pointer' }}
                                  >
                                    <option value="MORADOR">Morador</option>
                                    <option value="SINDICO">Síndico</option>
                                  </select>
                                ) : (
                                  <span style={{ ...ETIQUETA, fontSize: '11px', fontWeight: 700, color: rc, background: `color-mix(in srgb, ${rc} 14%, #fff)`, border: 'none', borderRadius: '99px', padding: '3px 10px' }}>{rl}</span>
                                )}
                              </td>
                              <td style={estiloTd(true)}>
                                <span style={{ ...ETIQUETA, fontSize: '11px', fontWeight: 700, color: sc.text, background: sc.bg, padding: '3px 10px', borderRadius: '99px' }}>{user.status}</span>
                              </td>
                              <td style={estiloTd(true)}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                  {user.status === 'PENDENTE' && (
                                    <button onClick={() => handleApprove(user)} style={{ ...ETIQUETA, fontSize: '11px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', border: 'none', borderRadius: '99px', padding: '3px 10px', cursor: 'pointer' }}>✓ Liberar</button>
                                  )}
                                  {user.status === 'PENDENTE' && (
                                    <button onClick={() => handleBlock(user)} title="Recusar o pedido (vai para Bloqueados)" style={{ ...ETIQUETA, fontSize: '11px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', border: 'none', borderRadius: '99px', padding: '3px 10px', cursor: 'pointer' }}>✕ Recusar</button>
                                  )}
                                  {user.status !== 'PENDENTE' && user.id !== currentUser?.id && (
                                    <button onClick={() => handleBlock(user)} style={{ ...ETIQUETA, fontSize: '11px', fontWeight: 700, color: isBlocked ? '#16a34a' : '#dc2626', background: isBlocked ? '#dcfce7' : '#fee2e2', border: 'none', borderRadius: '99px', padding: '3px 10px', cursor: 'pointer' }}>
                                      {isBlocked ? '↑ Desbloquear' : '✕ Bloquear'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {moradoresDaAba.length === 0 && (
                          <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                            {filtrando ? 'Nenhum morador nesse bloco, andar ou apartamento.'
                              : moradoresSubTab === 'pendentes' ? 'Nenhum pedido de acesso pendente.'
                              : moradoresSubTab === 'bloqueados' ? 'Nenhum morador bloqueado.'
                              : 'Nenhum morador ativo neste condomínio.'}
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
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
              <button type="button" className="janela-btn janela-btn-sec" onClick={() => setPapelEdit(null)} disabled={salvandoPapel}>Cancelar</button>
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
                : <>O que ele registrou como síndico (encaminhamentos, pronunciamentos, respostas) continua no histórico.</>}
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
