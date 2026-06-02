import React, { useState, useEffect } from 'react';
import {
  Menu, Search, UserCheck, Shield, User, Building, MoreVertical, Check, X, Users, UserPlus, FileText, Ban, Edit2, Key, LayoutDashboard, Clock, Settings, AlertTriangle, Eye, TrendingUp, TrendingDown, DollarSign, AlertCircle, Loader2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { criarNotificacao } from '../services/notificationService';
import './PainelMaster.css';

const secondarySupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storageKey: 'secondary-client-key',
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const PainelMaster = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, changeVisualContext, visualContext } = useAuth();
  const [ctxOpen, setCtxOpen] = useState(false);
  
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';

  const [users, setUsers] = useState([]);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals state (For Users)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [userToPromote, setUserToPromote] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [moradoresSubTab, setMoradoresSubTab] = useState('ativos');

  // Forms states
  const [newFunc, setNewFunc] = useState({ nome: '', email: '', cpf: '', cargo: '', senha: 'Mudar@123' });
  const [userToEdit, setUserToEdit] = useState(null);

  // User Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'ATIVO').length;
  const pendingUsers = users.filter(u => u.status === 'PENDENTE').length;
  const blockedUsers = users.filter(u => u.status === 'BLOQUEADO').length;

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'MASTER') return;

    const fetchDashboardData = async () => {
      setLoadingData(true);
      try {
        const { data: masterData } = await supabase.from('Masters').select('condominio_id').eq('id', currentUser.id).single();
        if (!masterData) throw new Error('Master sem condomínio');
        
        const condId = masterData.condominio_id;
        
        // Fetch users
        const { data: moradores } = await supabase.from('Moradores').select('*').eq('condominio_id', condId);
        const { data: funcionarios } = await supabase.from('Funcionarios').select('*').eq('condominio_id', condId);
        const { data: gestao } = await supabase.from('Gestao_Sindicos').select('morador_id').eq('condominio_id', condId).eq('ativo', true);
        const { data: userEmails } = await supabase.from('user_emails').select('*');
        
        const sindicosIds = gestao ? gestao.map(g => g.morador_id) : [];
        const getEmail = (id) => userEmails?.find(e => e.id === id)?.email || 'Sem e-mail';
        
        let allUsers = [];
        if (moradores) allUsers.push(...moradores.map(m => ({ ...m, role: sindicosIds.includes(m.id) ? 'SINDICO' : 'MORADOR', status: m.status || 'ATIVO', email: getEmail(m.id) })));
        if (funcionarios) allUsers.push(...funcionarios.map(f => ({ ...f, role: 'FUNCIONARIO', status: f.status || 'ATIVO', email: getEmail(f.id) })));
        
        // Sort: PENDENTES first
        allUsers.sort((a, b) => {
           if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
           if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
           return 0;
        });

        setUsers(allUsers);
        
        // Fetch Ocorrencias
        const { data: occ } = await supabase.from('Ocorrencias').select('*').eq('condominio_id', condId);
        if (occ) setOcorrencias(occ);
        
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);

  const handleApprove = async (user) => {
    try {
      let table = '';
      if (user.role === 'MORADOR') table = 'Moradores';
      else if (user.role === 'FUNCIONARIO') table = 'Funcionarios';
      else return;

      const { error } = await supabase.from(table).update({ status: 'ATIVO' }).eq('id', user.id);
      if (error) {
         console.error(error);
      } else {
        await criarNotificacao({
          destinatario_id: user.id,
          condominio_id: user.condominio_id,
          tipo: 'CADASTRO_APROVADO',
          titulo: 'Cadastro Aprovado',
          descricao: 'Seu cadastro foi aprovado pela administração! Bem-vindo.',
          remetente_id: currentUser.id,
          remetente_nome: currentUser.name || 'Master'
        });
      }

      setUsers(users.map(u => u.id === user.id ? { ...u, status: 'ATIVO' } : u));
    } catch (e) {
      alert('Erro ao aprovar usuário: ' + e.message);
    }
  };

  const handleBlock = async (user) => {
    const newStatus = user.status === 'BLOQUEADO' ? 'ATIVO' : 'BLOQUEADO';
    try {
      let table = '';
      if (user.role === 'MORADOR') table = 'Moradores';
      else if (user.role === 'FUNCIONARIO') table = 'Funcionarios';
      else return;

      const { error } = await supabase.from(table).update({ status: newStatus }).eq('id', user.id);
      if (error) console.error(error);
      else {
        await criarNotificacao({
          destinatario_id: user.id,
          condominio_id: user.condominio_id,
          tipo: newStatus === 'BLOQUEADO' ? 'CADASTRO_BLOQUEADO' : 'CADASTRO_APROVADO',
          titulo: newStatus === 'BLOQUEADO' ? 'Acesso Bloqueado' : 'Acesso Desbloqueado',
          descricao: newStatus === 'BLOQUEADO' ? 'Seu acesso foi temporariamente bloqueado pela administração.' : 'Seu acesso foi restabelecido.',
          remetente_id: currentUser.id,
          remetente_nome: currentUser.name || 'Master'
        });
      }

      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (e) {
      alert('Erro ao atualizar status: ' + e.message);
    }
  };

  const handleDeleteFuncionario = async (user) => {
    if (!window.confirm(`Tem certeza que deseja excluir o funcionário ${user.nome}?`)) return;
    try {
      const { error } = await supabase.from('Funcionarios').delete().eq('id', user.id);
      if (error) throw error;
      setUsers(users.filter(u => u.id !== user.id));
      alert('Funcionário excluído com sucesso!');
    } catch (e) {
      alert('Erro ao excluir funcionário: ' + e.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const userToChange = users.find(u => u.id === userId);
    if (!userToChange) return;

    if (newRole === 'SINDICO') {
      const currentSindico = users.find(u => u.role === 'SINDICO');
      if (currentSindico && currentSindico.id !== userId) {
         alert('Já existe um Síndico ativo neste condomínio. Remova o síndico atual (volte para Morador) antes de promover outro.');
         return;
      }

      setUserToPromote(userToChange);
      setShowPromoteModal(true);
    } else if (newRole === 'MORADOR' && userToChange.role === 'SINDICO') {
      try {
        const { error } = await supabase.from('Gestao_Sindicos').update({ ativo: false }).eq('morador_id', userId);
        if (error) throw error;
        
        await criarNotificacao({
          destinatario_id: userId,
          condominio_id: userToChange.condominio_id,
          tipo: 'SINDICO_REMOVIDO',
          titulo: 'Acesso de Síndico Removido',
          descricao: 'Seu perfil retornou para Morador.',
          remetente_id: currentUser.id,
          remetente_nome: currentUser.name || 'Master'
        });

        setUsers(users.map(u => u.id === userId ? { ...u, role: 'MORADOR' } : u));
      } catch(err) {
        alert('Erro ao remover síndico. Detalhes: ' + err.message);
      }
    }
  };

  const confirmPromotion = async () => {
    if (!userToPromote) return;
    try {
      const { error } = await supabase.from('Gestao_Sindicos').insert({
         morador_id: userToPromote.id,
         condominio_id: userToPromote.condominio_id,
         ativo: true
      });
      if (error) throw error;
      
      await criarNotificacao({
        destinatario_id: userToPromote.id,
        condominio_id: userToPromote.condominio_id,
        tipo: 'SINDICO_PROMOVIDO',
        titulo: 'Promovido a Síndico',
        descricao: 'Você foi promovido a Síndico do condomínio. Acesse seu novo painel.',
        remetente_id: currentUser.id,
        remetente_nome: currentUser.name || 'Master'
      });

      setUsers(users.map(u => u.id === userToPromote.id ? { ...u, role: 'SINDICO' } : u));
      setShowPromoteModal(false);
      setUserToPromote(null);
    } catch (err) {
      alert('Erro ao promover a síndico. Detalhes: ' + err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoadingData(true);
    try {
      const { data: authData, error: authError } = await secondarySupabase.auth.signUp({
        email: newFunc.email,
        password: newFunc.senha,
      });
      if (authError) throw authError;

      const { data: masterData } = await supabase.from('Masters').select('condominio_id').eq('id', currentUser.id).single();
      
      const { error: insertError } = await supabase.from('Funcionarios').insert({
        id: authData.user.id,
        nome: newFunc.nome,
        cargo: newFunc.cargo || 'Funcionário',
        condominio_id: masterData.condominio_id
      });
      if (insertError) throw insertError;

      alert('Funcionário criado com sucesso! Ele já pode fazer login com a senha: ' + newFunc.senha);
      setShowCreateModal(false);
      setNewFunc({ nome: '', email: '', cargo: '', senha: 'Mudar@123' });
      setUsers([{ id: authData.user.id, nome: newFunc.nome, email: newFunc.email, role: 'FUNCIONARIO', status: 'ATIVO', condominio_id: masterData.condominio_id }, ...users]);
    } catch(err) {
      console.error(err);
      alert('Erro ao criar funcionário: ' + err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setUsers(users.map(u => u.id === userToEdit.id ? { ...u, nome: userToEdit.nome, email: userToEdit.email, cpf: userToEdit.cpf } : u));
    setShowEditModal(false);
    setUserToEdit(null);
  };

  const handleViewAs = (user) => {
    if (window.confirm(`Entrar no modo supervisão como ${user.nome}? Você terá acesso ao painel equivalente a este usuário.`)) {
      alert(`Redirecionando para o painel de ${user.role}... (Simulação)`);
      let route = '/';
      if (user.role === 'SINDICO') route = '/painel-sindico';
      else if (user.role === 'FUNCIONARIO') route = '/painel-funcionario';
      else if (user.role === 'MORADOR') route = '/dashboard';
      navigate(route);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const roleColor = { MASTER: '#7c3aed', ADMIN: '#7c3aed', SINDICO: '#4f46e5', FUNCIONARIO: '#16a34a', MORADOR: '#ea580c' };
  const roleLabel = { MASTER: 'Master', ADMIN: 'Admin', SINDICO: 'Síndico', FUNCIONARIO: 'Funcionário', MORADOR: 'Morador' };
  const statusColor = { ATIVO: { text: '#16a34a', bg: '#dcfce7' }, PENDENTE: { text: '#d97706', bg: '#fef3c7' }, BLOQUEADO: { text: '#dc2626', bg: '#fee2e2' } };

  // Ocorrencias KPIs
  const pipeRecebida = ocorrencias.filter(o => o.status === 'Recebida').length;
  const pipeAnalise = ocorrencias.filter(o => o.status === 'Em análise').length;
  const pipeAguardando = ocorrencias.filter(o => o.status === 'Aguardando').length;
  const pipeExecucao = ocorrencias.filter(o => o.status === 'Em execução').length;
  const pipeConcluida = ocorrencias.filter(o => o.status === 'Concluída').length;
  const totalOcc = ocorrencias.length || 1;

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
              <h2 className="header-title">Governança Global</h2>
              <p className="header-date">Painel Administrativo ({currentUser?.name})</p>
            </div>
          </div>
          <div className="header-right">
            <NotificationMenu />
            <div 
              className="user-profile-dropdown" 
              onClick={() => navigate('/perfil')} 
              style={{ 
                display:'flex', 
                alignItems:'center', 
                gap:'0.75rem', 
                borderLeft:'1px solid #e2e8f0', 
                paddingLeft:'1rem',
                cursor: 'pointer' 
              }}
            >
              <div style={{
                width:36, height:36, borderRadius:'50%',
                background:'var(--role-primary-color)', color:'white',
                display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700,
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
                  { label: 'OCORRÊNCIAS ABERTAS',   value: String(ocorrencias.filter(o => o.status !== 'Concluída').length), trend: 'requerem atenção', trendColor: '#f59e0b' },
                  { label: 'TOTAL DE OCORRÊNCIAS', value: String(ocorrencias.length),       trend: 'registradas no sistema', trendColor: '#16a34a' },
                  { label: 'USUÁRIOS CADASTRADOS',  value: String(totalUsers), trend: `${pendingUsers} pendentes de aprovação`,     trendColor: pendingUsers > 0 ? '#f59e0b' : '#16a34a' },
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
                      { label: 'Recebida',    value: pipeRecebida,  color: '#9CA3AF' },
                      { label: 'Em análise', value: pipeAnalise,  color: '#3B82F6' },
                      { label: 'Aguardando',  value: pipeAguardando,  color: '#F59E0B' },
                      { label: 'Em execução', value: pipeExecucao,  color: '#8B5CF6' },
                      { label: 'Concluída',   value: pipeConcluida, color: '#10B981' },
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
                      <div key={i} style={{ borderLeft: `4px solid ${occ.status === 'Concluída' ? '#10B981' : '#f59e0b'}`, paddingLeft: '12px' }}>
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
                    { label: 'TOTAL DE MORADORES',  value: list.length, color: '#475569' },
                    { label: 'ATIVOS',              value: lActive, color: '#16a34a' },
                    { label: 'PENDENTES',           value: lPending, color: '#d97706' },
                    { label: 'BLOQUEADOS',          value: lBlocked, color: '#dc2626' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px 20px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.07em', margin: '0 0 6px' }}>{s.label}</p>
                      <p style={{ fontSize: '28px', fontWeight: 600, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                  <button 
                    onClick={() => setMoradoresSubTab('ativos')}
                    style={{ background: moradoresSubTab === 'ativos' ? 'var(--role-primary-color)' : '#f8fafc', color: moradoresSubTab === 'ativos' ? '#fff' : '#64748b', border: '1px solid', borderColor: moradoresSubTab === 'ativos' ? 'var(--role-primary-color)' : '#e2e8f0', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    Ativos e Bloqueados ({lActive + lBlocked})
                  </button>
                  <button 
                    onClick={() => setMoradoresSubTab('pendentes')}
                    style={{ background: moradoresSubTab === 'pendentes' ? 'var(--role-primary-color)' : '#f8fafc', color: moradoresSubTab === 'pendentes' ? '#fff' : '#64748b', border: '1px solid', borderColor: moradoresSubTab === 'pendentes' ? 'var(--role-primary-color)' : '#e2e8f0', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    Pendentes ({lPending})
                  </button>
                </div>

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
                          <colgroup>
                            <col style={{ width: '28%' }} />
                            <col style={{ width: '22%' }} />
                            <col style={{ width: '16%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '20%' }} />
                          </colgroup>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              {['Morador', 'Documentos / Und.', 'Perfil', 'Status', 'Ações'].map(h => (
                                <th key={h} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ background: '#f5f3ff' }}>
                              <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
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
                              <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', color: '#64748b' }}>
                                {sindico.cpf}<br/>
                                {sindico.bloco && <span style={{fontSize:'10px', background:'#f1f5f9', padding:'2px 4px', borderRadius:'4px', display:'inline-block', marginTop:'4px'}}>Bl. {sindico.bloco} Apt. {sindico.apartamento}</span>}
                              </td>
                              <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                <select
                                  value="SINDICO"
                                  onChange={(e) => handleRoleChange(sindico.id, e.target.value)}
                                  style={{ fontSize: '11px', fontWeight: 700, color: rc, background: `${rc}15`, border: `1px solid ${rc}40`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                                >
                                  <option value="MORADOR">Morador</option>
                                  <option value="SINDICO">Síndico</option>
                                </select>
                              </td>
                              <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: sc.text, background: sc.bg, padding: '3px 10px', borderRadius: '99px' }}>{sindico.status}</span>
                              </td>
                              <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button disabled style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', cursor: 'not-allowed', opacity: 0.6 }}>
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
                                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
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
                      <colgroup>
                        <col style={{ width: '28%' }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '20%' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Morador', 'Documentos / Und.', 'Perfil', 'Status', 'Ações'].map(h => (
                            <th key={h} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {list.filter(u => {
                          if (u.role === 'SINDICO') return false;
                          return moradoresSubTab === 'ativos' ? u.status !== 'PENDENTE' : u.status === 'PENDENTE';
                        }).map((user, i) => {
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
                              <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
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
                              <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', color: '#64748b' }}>
                                {user.cpf}<br/>
                                {user.bloco && <span style={{fontSize:'10px', background:'#f1f5f9', padding:'2px 4px', borderRadius:'4px', display:'inline-block', marginTop:'4px'}}>Bl. {user.bloco} Apt. {user.apartamento}</span>}
                              </td>
                              <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                {canPromote ? (
                                  <select
                                    value="MORADOR"
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    style={{ fontSize: '11px', fontWeight: 700, color: rc, background: `${rc}15`, border: `1px solid ${rc}40`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                                  >
                                    <option value="MORADOR">Morador</option>
                                    <option value="SINDICO">Síndico</option>
                                  </select>
                                ) : (
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: rc, background: `${rc}15`, border: `1px solid ${rc}40`, borderRadius: '6px', padding: '4px 8px', display: 'inline-block' }}>{rl}</span>
                                )}
                              </td>
                              <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: sc.text, background: sc.bg, padding: '3px 10px', borderRadius: '99px' }}>{user.status}</span>
                              </td>
                              <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  {user.status === 'PENDENTE' && (
                                    <button onClick={() => handleApprove(user)} style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>✓ Liberar</button>
                                  )}
                                  {user.status !== 'PENDENTE' && user.id !== currentUser?.id && (
                                    <button onClick={() => handleBlock(user)} style={{ fontSize: '11px', fontWeight: 700, color: isBlocked ? '#16a34a' : '#dc2626', background: isBlocked ? '#dcfce7' : '#fee2e2', border: `1px solid ${isBlocked ? '#bbf7d0' : '#fecaca'}`, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                                      {isBlocked ? '↑ Desbloquear' : '✕ Bloquear'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {list.filter(u => u.role !== 'SINDICO' && (moradoresSubTab === 'ativos' ? u.status !== 'PENDENTE' : u.status === 'PENDENTE')).length === 0 && (
                          <tr><td colSpan="5" style={{padding:'20px', textAlign:'center', color:'#94a3b8', fontSize:'13px'}}>Nenhum morador cadastrado neste condomínio.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === 'funcionarios' && (() => {
            const list = users.filter(u => u.role === 'FUNCIONARIO');
            const lActive = list.filter(u => u.status === 'ATIVO').length;
            const lPending = list.filter(u => u.status === 'PENDENTE').length;
            const lBlocked = list.filter(u => u.status === 'BLOQUEADO').length;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Gestão de Funcionários</h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Gerencie o corpo técnico e operacional do seu condomínio.</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--role-primary-color)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <UserPlus size={16} /> Cadastrar Funcionário
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', maxWidth: '300px' }}>
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px 20px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.07em', margin: '0 0 6px' }}>TOTAL FUNCIONÁRIOS</p>
                    <p style={{ fontSize: '28px', fontWeight: 600, color: '#475569', margin: 0, lineHeight: 1 }}>{list.length}</p>
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Funcionário', 'Cargo', 'Ações'].map(h => (
                          <th key={h} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((user, i) => {
                        const rc = roleColor[user.role] || '#475569';
                        const rl = roleLabel[user.role] || user.role;
                        const sc = statusColor[user.status] || { text: '#475569', bg: '#f1f5f9' };
                        const isBlocked = user.status === 'BLOQUEADO';
                        return (
                          <tr key={user.id}
                            style={{ background: isBlocked ? '#fffafa' : 'white', transition: 'background 0.1s', opacity: isBlocked ? 0.7 : 1 }}
                            onMouseEnter={e => { if (!isBlocked) e.currentTarget.style.background = '#fafafa'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = isBlocked ? '#fffafa' : 'white'; }}
                          >
                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div 
                                  onClick={() => handleViewDetails(user)}
                                  style={{ width: 36, height: 36, borderRadius: '50%', background: isBlocked ? '#e2e8f0' : `${rc}18`, color: isBlocked ? '#94a3b8' : rc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 0 2px transparent' }}
                                  onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${isBlocked ? '#94a3b8' : rc}40`}
                                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 0 2px transparent'}
                                >
                                  {(user.nome || user.name || 'F').charAt(0)}
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{user.nome || user.name}</p>
                                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                               {user.cargo || 'Funcionário'}
                            </td>
                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <button onClick={() => handleDeleteFuncionario(user)} style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                                  Remover
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {list.length === 0 && (
                          <tr><td colSpan="4" style={{padding:'20px', textAlign:'center', color:'#94a3b8', fontSize:'13px'}}>Nenhum funcionário cadastrado neste condomínio.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        </div>
      </main>

      {showCreateModal && (
        <div className="gu-modal-overlay">
          <div className="gu-modal">
            <div className="gu-modal-header">
              <h2>Cadastrar Funcionário</h2>
              <button onClick={() => setShowCreateModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateUser} className="gu-modal-form">
              <div className="gu-form-group"><label>Nome Completo</label><input type="text" value={newFunc.nome} onChange={e => setNewFunc({...newFunc, nome: e.target.value})} required className="gu-input"/></div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="gu-form-group" style={{ marginBottom: 0 }}><label>E-mail (Login)</label><input type="email" value={newFunc.email} onChange={e => setNewFunc({...newFunc, email: e.target.value})} required className="gu-input"/></div>
                <div className="gu-form-group" style={{ marginBottom: 0 }}><label>Senha Inicial</label><input type="text" value={newFunc.senha} onChange={e => setNewFunc({...newFunc, senha: e.target.value})} required className="gu-input"/></div>
              </div>

              <div className="gu-form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Cargo</label>
                <input type="text" value={newFunc.cargo} onChange={e => setNewFunc({...newFunc, cargo: e.target.value})} placeholder="Ex: Porteiro" required className="gu-input"/>
              </div>
              <div className="gu-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar Funcionário</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && userToEdit && (
        <div className="gu-modal-overlay">
          <div className="gu-modal">
            <div className="gu-modal-header">
              <h2>Editar Cadastro Básico</h2>
              <button onClick={() => setShowEditModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleEditSubmit} className="gu-modal-form">
              <div className="gu-form-group"><label>Nome Completo</label><input type="text" value={userToEdit.nome || userToEdit.name} onChange={e => setUserToEdit({...userToEdit, nome: e.target.value})} required className="gu-input"/></div>
              <div className="gu-form-group"><label>E-mail / Login</label><input type="email" value={userToEdit.email} onChange={e => setUserToEdit({...userToEdit, email: e.target.value})} required className="gu-input"/></div>
              <div className="gu-form-group"><label>CPF</label><input type="text" value={userToEdit.cpf} onChange={e => setUserToEdit({...userToEdit, cpf: e.target.value})} required className="gu-input"/></div>
              <div className="gu-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Sobrescrever</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPromoteModal && userToPromote && (
        <div className="gu-modal-overlay">
          <div className="gu-modal" style={{ maxWidth: '400px' }}>
            <div className="gu-modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h2 style={{ fontSize: '18px', color: '#0f172a' }}>Confirmar Promoção</h2>
              <button onClick={() => { setShowPromoteModal(false); setUserToPromote(null); }}><X size={20}/></button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 20px', lineHeight: '1.5' }}>
                Tem certeza que deseja promover este morador a <strong>Síndico</strong>?
              </p>
              
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Nome:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{userToPromote.nome || userToPromote.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>CPF:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{userToPromote.cpf || 'Não informado'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Bloco:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{userToPromote.bloco || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Ap:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{userToPromote.apartamento || '-'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => { setShowPromoteModal(false); setUserToPromote(null); }}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#64748b', fontWeight: 500, fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmPromotion}
                  style={{ padding: '8px 16px', background: 'var(--role-primary-color)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 500, fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer' }}
                >
                  Confirmar Promoção
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedUser && (() => {
        const userRole = selectedUser.role || 'MORADOR';
        const userRoleColor = roleColor[userRole] || '#475569';
        const userRoleLabel = roleLabel[userRole] || userRole;
        const userStatusColor = statusColor[selectedUser.status] || { text: '#475569', bg: '#f1f5f9' };
        
        return (
          <div className="gu-modal-overlay">
            <div className="gu-modal" style={{ maxWidth: '500px' }}>
              <div className="gu-modal-header">
                <h2>Detalhes do {userRole === 'FUNCIONARIO' ? 'Funcionário' : userRole === 'SINDICO' ? 'Síndico' : 'Morador'}</h2>
                <button 
                  onClick={() => { setShowDetailsModal(false); setSelectedUser(null); }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.color = 'inherit'}
                  style={{ transition: 'color 0.2s' }}
                >
                  <X size={20}/>
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                {/* Avatar e Nome */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${userRoleColor}18`, color: userRoleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '24px', flexShrink: 0 }}>
                    {(selectedUser.nome || selectedUser.name || 'U').charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                      {selectedUser.nome || selectedUser.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 8px' }}>
                      {selectedUser.email}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: userRoleColor, background: `${userRoleColor}15`, border: `1px solid ${userRoleColor}40`, borderRadius: '6px', padding: '4px 10px', display: 'inline-block' }}>
                        {userRoleLabel}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: userStatusColor.text, background: userStatusColor.bg, padding: '3px 10px', borderRadius: '99px', display: 'inline-block' }}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informações Pessoais */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', margin: '0 0 6px' }}>CPF</p>
                    <p style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500, margin: 0 }}>
                      {selectedUser.cpf || 'Não informado'}
                    </p>
                  </div>
                  {userRole === 'FUNCIONARIO' && (
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', margin: '0 0 6px' }}>Cargo</p>
                      <p style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500, margin: 0 }}>
                        {selectedUser.cargo || 'Funcionário'}
                      </p>
                    </div>
                  )}
                  {userRole !== 'FUNCIONARIO' && (
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', margin: '0 0 6px' }}>Telefone</p>
                      <p style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500, margin: 0 }}>
                        {selectedUser.telefone || 'Não informado'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bloco e Apartamento (apenas para moradores e síndicos) */}
                {userRole !== 'FUNCIONARIO' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', margin: '0 0 6px' }}>Bloco</p>
                      <p style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500, margin: 0 }}>
                        {selectedUser.bloco || 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', margin: '0 0 6px' }}>Apartamento</p>
                      <p style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500, margin: 0 }}>
                        {selectedUser.apartamento || 'Não informado'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Informações adicionais */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', margin: '0 0 12px' }}>Informações Adicionais</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '10px', color: '#64748b', margin: '0 0 4px' }}>Data de Cadastro</p>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                        {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('pt-BR') : 'Não disponível'}
                      </p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '10px', color: '#64748b', margin: '0 0 4px' }}>Condomínio ID</p>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                        {selectedUser.condominio_id || 'Não disponível'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default PainelMaster;
