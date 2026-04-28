import React, { useState } from 'react';
import {
  Menu, Search, UserCheck, Shield, User, Building, MoreVertical, Check, X, Users, UserPlus, FileText, Ban, Edit2, Key, LayoutDashboard, Clock, Settings, AlertTriangle, Eye, TrendingUp, TrendingDown, DollarSign, AlertCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import { useAuth } from '../contexts/AuthContext';
import './PainelAdmin.css';

const PainelAdmin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, changeVisualContext, visualContext } = useAuth();
  const [ctxOpen, setCtxOpen] = useState(false);
  
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';

  // Mock data for users
  const [users, setUsers] = useState([
    { id: 1, name: 'João Marcos', email: 'joao@email.com', cpf: '111.222.333-44', role: 'MORADOR', status: 'ATIVO' },
    { id: 2, name: 'Maria Silva', email: 'maria@email.com', cpf: '555.666.777-88', role: 'MORADOR', status: 'PENDENTE' },
    { id: 3, name: 'Carlos Admin', email: 'carlos@email.com', cpf: '999.888.777-66', role: 'ADMIN', status: 'ATIVO' },
    { id: 4, name: 'Ana Oliveira', email: 'ana@email.com', cpf: '222.333.444-55', role: 'FUNCIONARIO', status: 'ATIVO' },
  ]);

  // Auditoria Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 101, action: 'Sistema Iniciado', targetUser: 'System', performedBy: 'System', date: new Date().toISOString() },
    { id: 102, action: 'Alteração de Papel para ADMIN', targetUser: 'Carlos Admin', performedBy: 'Carlos Admin', date: new Date().toISOString() },
  ]);

  // Modals state (For Users)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Forms states
  const [newUser, setNewUser] = useState({ name: '', email: '', cpf: '', role: 'MORADOR', condominium: '', bloco: '', apartment: '' });
  const [userToEdit, setUserToEdit] = useState(null);

  // User Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'ATIVO').length;
  const pendingUsers = users.filter(u => u.status === 'PENDENTE').length;
  const blockedUsers = users.filter(u => u.status === 'BLOQUEADO').length;

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString('pt-BR');
  };

  const addAuditLog = (action, targetName) => {
    const newLog = {
      id: Date.now(),
      action,
      targetUser: targetName,
      performedBy: currentUser?.name || 'Administrador',
      date: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleApprove = (user) => {
    setUsers(users.map(u => u.id === user.id ? { ...u, status: 'ATIVO' } : u));
    addAuditLog('Aprovação de Cadastro', user.name);
  };

  const handleBlock = (user) => {
    const newStatus = user.status === 'BLOQUEADO' ? 'ATIVO' : 'BLOQUEADO';
    setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    addAuditLog(newStatus === 'BLOQUEADO' ? 'Bloqueio de Usuário' : 'Desbloqueio de Usuário', user.name);
  };

  const handleRoleChange = (userId, newRole) => {
    const userToChange = users.find(u => u.id === userId);
    if (!userToChange) return;
    if (userToChange.id === currentUser.id) {
       alert("O sistema impede a alteração do próprio papel por motivos de segurança.");
       return;
    }
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    addAuditLog(`Alteração de Papel para ${newRole}`, userToChange.name);
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    const createdUser = {
      id: users.length + 1,
      ...newUser,
      status: 'ATIVO'
    };
    setUsers([...users, createdUser]);
    addAuditLog(`Criação de Usuário (${newUser.role})`, newUser.name);
    setShowCreateModal(false);
    
    setTimeout(() => {
        alert(`O usuário ${newUser.name} foi criado e notificado.`);
    }, 300);

    setNewUser({ name: '', email: '', cpf: '', role: 'MORADOR', condominium: '', bloco: '', apartment: '' });
  };

  const handleResetPassword = (user) => {
    if (window.confirm(`Deseja forçar o reset de senha de ${user.name}?`)) {
       alert(`Senha provisória enviada para ${user.email}`);
       addAuditLog('Envio de Reset de Senha Forçado', user.name);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setUsers(users.map(u => u.id === userToEdit.id ? { ...u, name: userToEdit.name, email: userToEdit.email, cpf: userToEdit.cpf } : u));
    addAuditLog('Edição de Perfil Administrativa', userToEdit.name);
    setShowEditModal(false);
    setUserToEdit(null);
  };

  const handleViewAs = (user) => {
    if (window.confirm(`Entrar no modo supervisão como ${user.name} (${user.role})? Você terá acesso ao painel equivalente a este usuário.`)) {
      addAuditLog(`Modo Supervisão ativado`, user.name);
      alert(`Redirecionando para o painel de ${user.role}... (Simulação)`);
      // Simulação do redirecionamento de acordo com o papel
      let route = '/';
      if (user.role === 'SINDICO') route = '/painel-sindico';
      else if (user.role === 'FUNCIONARIO') route = '/painel-funcionario';
      else if (user.role === 'MORADOR') route = '/dashboard';
      navigate(route);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'ADMIN': return 'badge-admin';
      case 'SINDICO': return 'badge-sindico';
      case 'FUNCIONARIO': return 'badge-funcionario';
      default: return 'badge-morador';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
       case 'ATIVO': return 'badge-ativo';
       case 'BLOQUEADO': return 'badge-bloqueado';
       default: return 'badge-pendente';
    }
  };

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
            {/* Dropdown: Visualizar como */}
            {currentUser?.role === 'MASTER' && (
              <div style={{ position: 'relative', marginRight: '0.75rem' }}>
                <button
                  onClick={() => setCtxOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '0.35rem 0.85rem', borderRadius: '7px',
                    border: '1px solid #cbd5e1', background: 'white',
                    fontSize: '0.8rem', fontWeight: 600, color: '#475569',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#94a3b8'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                >
                  <Eye size={13} />
                  Visualizar como
                  <span style={{ fontSize: '0.65rem' }}>▾</span>
                </button>
                {ctxOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    background: 'white', border: '1px solid #e2e8f0',
                    borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    minWidth: '180px', zIndex: 200, overflow: 'hidden',
                  }}>
                    {[
                      { key: 'SINDICO',     label: 'Síndico',      color: '#4f46e5', route: '/painel?tab=overview' },
                      { key: 'FUNCIONARIO', label: 'Funcionário',   color: '#16a34a', route: '/painel-funcionario' },
                      { key: 'MORADOR',     label: 'Morador',       color: '#ea580c', route: '/dashboard' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { changeVisualContext(opt.key); navigate(opt.route); setCtxOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          width: '100%', padding: '0.6rem 1rem',
                          background: 'transparent', border: 'none',
                          fontSize: '0.85rem', color: '#334155', cursor: 'pointer',
                          textAlign: 'left', borderBottom: '1px solid #f1f5f9',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color, flexShrink: 0, display: 'inline-block' }} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button className="btn-primary" style={{ marginRight: '1rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => navigate('/novo-condominio')}>
              + Novo Condomínio
            </button>
            <NotificationMenu />
            <div className="user-profile-dropdown" onClick={() => navigate('/perfil')}>
              <div className="user-avatar"><span>{currentUser?.name?.charAt(0) || 'A'}</span></div>
            </div>
          </div>
        </header>

        {/* Banner de Contexto Visual (Master) */}
        <ContextBanner />

        <div className="dashboard-content-scroll" style={{ padding: '2rem' }}>
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* ── BLOCO 1: KPIs ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {[
                  { label: 'MRR CONSOLIDADO',       value: 'R$ 14.500', trend: '↑ +12% anual',          trendColor: '#16a34a' },
                  { label: 'TAXA DE INADIMPLÊNCIA', value: '8,4%',       trend: '↑ +1,2% req. atenção', trendColor: '#dc2626' },
                  { label: 'USUÁRIOS CADASTRADOS',  value: String(totalUsers), trend: '+1 este mês',     trendColor: '#16a34a' },
                  { label: 'CONDOMÍNIOS ATIVOS',    value: '1',         trend: 'em operação',          trendColor: '#94a3b8' },
                ].map((k, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.07em', margin: '0 0 10px' }}>{k.label}</p>
                    <p style={{ fontSize: '32px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px', lineHeight: 1 }}>{k.value}</p>
                    <p style={{ fontSize: '12px', color: k.trendColor, margin: 0, fontWeight: 500 }}>{k.trend}</p>
                  </div>
                ))}
              </div>

              {/* ── BLOCO 2: Condomínios + Alertas ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>

                {/* Tabela de Condomínios */}
                <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Condomínios ativos</h3>
                    <a href="#" style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }} onClick={e => { e.preventDefault(); navigate('/painel-admin?tab=estrutura'); }}>Ver todos →</a>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Condomínio', 'Síndico', 'Unidades', 'Adimplência', 'Ocorrências', 'Saúde'].map(h => (
                          <th key={h} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'left', padding: '0 8px 10px 0', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Edífico Aurora',     sindico: 'Rafael Santos', units: 48, adim: 91, occ: 3,  badge: 'Saudável', bc: '#16a34a', bb: '#dcfce7' },
                        { name: 'Cond. Bela Vista',   sindico: '—',            units: 32, adim: 78, occ: 12, badge: 'Atenção',  bc: '#dc2626', bb: '#fee2e2' },
                        { name: 'Res. Parque Verde',  sindico: 'Ana Lima',      units: 60, adim: 95, occ: 1,  badge: 'Saudável', bc: '#16a34a', bb: '#dcfce7' },
                      ].map((row, i) => (
                        <tr key={i}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                        >
                          <td style={{ padding: '11px 8px 11px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{row.name}</td>
                          <td style={{ padding: '11px 8px 11px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#475569' }}>{row.sindico}</td>
                          <td style={{ padding: '11px 8px 11px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#475569' }}>{row.units}</td>
                          <td style={{ padding: '11px 8px 11px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px', fontWeight: 600, color: row.adim >= 90 ? '#16a34a' : row.adim >= 80 ? '#f59e0b' : '#dc2626' }}>{row.adim}%</td>
                          <td style={{ padding: '11px 8px 11px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#475569' }}>{row.occ} abertas</td>
                          <td style={{ padding: '11px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: row.bc, background: row.bb, padding: '3px 9px', borderRadius: '99px' }}>{row.badge}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Alertas com ação */}
                <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Alertas</h3>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '99px' }}>2</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      { border: '#dc2626', icon: '⦸', title: 'Ocorrências Vencidas', desc: '12 chamados sem resposta há mais de 7 dias úteis.', condo: 'Cond. Bela Vista', time: 'há 2h' },
                      { border: '#f59e0b', icon: '⚠', title: 'Risco de Churn',         desc: 'Inadimplência acentuada no mês.',                 condo: 'Cond. Bela Vista', time: 'há 5h' },
                    ].map((al, i) => (
                      <div key={i} style={{ borderLeft: `4px solid ${al.border}`, paddingLeft: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px' }}>{al.icon}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{al.title}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0, marginLeft: '8px' }}>{al.time}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>{al.desc}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px' }}>{al.condo}</span>
                          <button
                            style={{ fontSize: '11px', fontWeight: 600, color: '#7c3aed', background: 'transparent', border: '1px solid #7c3aed', padding: '3px 10px', borderRadius: '5px', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7c3aed'; }}
                          >Verificar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── BLOCO 3: Pipeline + Atividade ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Pipeline de ocorrências */}
                <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>Pipeline de ocorrências</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 24px' }}>Todas as ocorrências do sistema por status.</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '130px' }}>
                    {[
                      { label: 'Recebida',    value: 4,  color: '#9CA3AF' },
                      { label: 'Em análise', value: 6,  color: '#3B82F6' },
                      { label: 'Aguardando',  value: 8,  color: '#F59E0B' },
                      { label: 'Em execução', value: 3,  color: '#8B5CF6' },
                      { label: 'Concluída',   value: 34, color: '#10B981' },
                    ].map((col, i) => {
                      const barH = Math.round((col.value / 34) * 80);
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

                {/* Atividade recente */}
                <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>Atividade recente</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px' }}>Últimas ações no sistema.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0', flex: 1 }}>
                    {[
                      { dot: '#16a34a', text: 'Novo usuário cadastrado: Maria Lima — Moradora',        time: 'há 10min' },
                      { dot: '#8B5CF6', text: 'Síndico Rafael atribuiu tarefa de limpeza',              time: 'há 32min' },
                      { dot: '#dc2626', text: 'Ocorrência crítica aberta: Infiltração Bloco B',         time: 'há 1h'    },
                      { dot: '#94a3b8', text: 'Backup automático concluído com sucesso',                time: 'há 2h'    },
                      { dot: '#f59e0b', text: 'Inadimplência do Cond. Bela Vista atingiu 22%',          time: 'há 3h'    },
                      { dot: '#3B82F6', text: 'Novo condomínio em configuração: Res. Jardins',          time: 'há 5h'    },
                    ].map((item, i, arr) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.dot, flexShrink: 0, marginTop: '4px', display: 'inline-block' }} />
                        <span style={{ fontSize: '13px', color: '#334155', flex: 1, lineHeight: 1.4 }}>{item.text}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0, whiteSpace: 'nowrap' }}>{item.time}</span>
                      </div>
                    ))}
                  </div>
                  <a href="#" style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, textDecoration: 'none', marginTop: '12px' }} onClick={e => { e.preventDefault(); navigate('/painel-admin?tab=auditoria'); }}>Ver histórico completo →</a>
                </div>
              </div>

            </div>
          )}

          {/* TAB: USUARIOS */}
          {activeTab === 'usuarios' && (() => {
            const roleColor = { MASTER: '#7c3aed', ADMIN: '#7c3aed', SINDICO: '#4f46e5', FUNCIONARIO: '#16a34a', MORADOR: '#ea580c' };
            const roleLabel = { MASTER: 'Master', ADMIN: 'Admin', SINDICO: 'Síndico', FUNCIONARIO: 'Funcionário', MORADOR: 'Morador' };
            const statusColor = { ATIVO: { text: '#16a34a', bg: '#dcfce7' }, PENDENTE: { text: '#d97706', bg: '#fef3c7' }, BLOQUEADO: { text: '#dc2626', bg: '#fee2e2' } };
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Cabeçalho com ação */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Gestão de Perfis & Acesso</h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Gerencie permissões, status e acessos de todos os usuários cadastrados.</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <UserPlus size={16} /> Cadastrar Nova Conta
                  </button>
                </div>

                {/* Cards de estatísticas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  {[
                    { label: 'TOTAL DE USUÁRIOS',  value: users.length,                                          color: '#475569' },
                    { label: 'ATIVOS',              value: users.filter(u => u.status === 'ATIVO').length,        color: '#16a34a' },
                    { label: 'PENDENTES',           value: users.filter(u => u.status === 'PENDENTE').length,     color: '#d97706' },
                    { label: 'BLOQUEADOS',          value: users.filter(u => u.status === 'BLOQUEADO').length,    color: '#dc2626' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px 20px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.07em', margin: '0 0 6px' }}>{s.label}</p>
                      <p style={{ fontSize: '28px', fontWeight: 600, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Tabela moderna */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Usuário', 'CPF', 'Papel', 'Status', 'Ações'].map(h => (
                          <th key={h} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, i) => {
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
                            {/* Usuário */}
                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: isBlocked ? '#e2e8f0' : `${rc}18`, color: isBlocked ? '#94a3b8' : rc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                                  {user.name.charAt(0)}
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{user.name}</p>
                                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{user.email}</p>
                                </div>
                              </div>
                            </td>
                            {/* CPF */}
                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{user.cpf}</td>
                            {/* Papel */}
                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                              <select
                                value={user.role}
                                onChange={e => handleRoleChange(user.id, e.target.value)}
                                disabled={user.id === currentUser?.id}
                                style={{ fontSize: '11px', fontWeight: 700, color: rc, background: `${rc}15`, border: `1px solid ${rc}40`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', outline: 'none', appearance: 'none', paddingRight: '20px' }}
                              >
                                <option value="MORADOR">Morador</option>
                                <option value="FUNCIONARIO">Funcionário</option>
                                <option value="SINDICO">Síndico</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                            </td>
                            {/* Status */}
                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: sc.text, background: sc.bg, padding: '3px 10px', borderRadius: '99px' }}>{user.status}</span>
                            </td>
                            {/* Ações */}
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
                                <button onClick={() => { setUserToEdit(user); setShowEditModal(true); }} title="Editar" style={{ padding: '5px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}><Edit2 size={14} /></button>
                                <button onClick={() => handleResetPassword(user)} title="Resetar senha" style={{ padding: '5px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}><Key size={14} /></button>
                                {user.status === 'ATIVO' && user.id !== currentUser?.id && (
                                  <button onClick={() => handleViewAs(user)} title="Ver como" style={{ padding: '5px 8px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '6px', cursor: 'pointer', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                                    <Eye size={13} /> View As
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{users.length} usuário(s) no total</span>
                    <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>Exportar lista →</a>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* TAB: ESTRUTURA */}
          {activeTab === 'estrutura' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <h3 style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 'bold' }}>Mapeamento de Estruturas Físicas</h3>
               <div style={{ padding: '2rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                   <Building size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                   <h4>Estrutura atual: Condomínio Bela Vista</h4>
                   <p>1 Bloco • 20 Unidades mapeadas</p>
                   <button className="btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => alert('Função de adição de blocos nas próximas versões.')}>+ Adicionar Novo Bloco/Área</button>
               </div>
            </div>
          )}

          {/* TAB: AUDITORIA */}
          {activeTab === 'auditoria' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h3 style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 'bold' }}>Histórico Global de Ações (Logs de Segurança)</h3>
                 <button className="btn-secondary" onClick={() => alert('Registros exportados em PDF com sucesso!')}>Exportar PDF</button>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                <ul className="gu-audit-list">
                  {auditLogs.map(log => (
                    <li key={log.id} className="gu-audit-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '1rem 0' }}>
                        <div className="gu-audit-header" style={{ marginBottom: '0.5rem' }}>
                          <span className="gu-audit-action" style={{ fontWeight: 600, color: '#0f766e', fontSize: '0.95rem' }}>[{log.action}]</span>
                          <span className="gu-audit-date" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{formatTime(log.date)}</span>
                        </div>
                        <div className="gu-audit-details" style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#334155' }}>
                          <p><strong>Alvo da Ação:</strong> {log.targetUser}</p>
                          <p><strong>Operador:</strong> {log.performedBy}</p>
                        </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB: PARAMETROS */}
          {activeTab === 'parametros' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 'bold' }}>Parâmetros Operacionais do Sistema</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                   
                   <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                      <h4 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>Regras de SLA (Tempo de Resposta)</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Manutenção Urgente (Horas máximas)</label>
                            <input type="number" defaultValue={24} className="gu-input" style={{ width: '100px' }} />
                         </div>
                         <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Ocorrências Padrão (Dias máximos)</label>
                            <input type="number" defaultValue={7} className="gu-input" style={{ width: '100px' }} />
                         </div>
                         <button className="btn-primary" style={{ width: 'fit-content' }}>Salvar SLAs</button>
                      </div>
                   </div>

                   <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                      <h4 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>Módulos Ativos do SaaS</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: '#334155' }}>
                         <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" defaultChecked /> Feed de Ocorrências</label>
                         <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" defaultChecked /> Painel de Manutenção (Limpeza/Obra)</label>
                         <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.5rem' }}>* O desligamento afeta globalmente o sistema.</p>
                      </div>
                   </div>

                </div>
             </div>
          )}

        </div>
      </main>

      {/* Modals from Usuários tab */}
      {showCreateModal && (
        <div className="gu-modal-overlay">
          <div className="gu-modal">
            <div className="gu-modal-header">
              <h2>Inserir Novo Credenciado</h2>
              <button onClick={() => setShowCreateModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateUser} className="gu-modal-form">
              <div className="gu-form-group"><label>Nome Completo</label><input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required className="gu-input"/></div>
              <div className="gu-form-group"><label>E-mail</label><input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required className="gu-input"/></div>
              <div className="gu-form-group"><label>CPF</label><input type="text" value={newUser.cpf} onChange={e => setNewUser({...newUser, cpf: e.target.value})} required className="gu-input"/></div>
              <div className="gu-form-group">
                <label>Nível de Acesso (Papel)</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="gu-input">
                    <option value="MORADOR">Morador</option>
                    <option value="FUNCIONARIO">Funcionário</option>
                    <option value="SINDICO">Síndico</option>
                    <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="gu-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar</button>
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
              <div className="gu-form-group"><label>Nome Completo</label><input type="text" value={userToEdit.name} onChange={e => setUserToEdit({...userToEdit, name: e.target.value})} required className="gu-input"/></div>
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
    </div>
  );
};

export default PainelAdmin;
