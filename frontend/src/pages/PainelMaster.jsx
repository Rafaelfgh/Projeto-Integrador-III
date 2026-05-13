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
import './PainelMaster.css';

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
        const { data: gestao } = await supabase.from('Gestao_Sindicos').select('sindico_id').eq('condominio_id', condId).eq('ativo', true);
        
        const sindicosIds = gestao ? gestao.map(g => g.sindico_id) : [];
        
        let allUsers = [];
        if (moradores) allUsers.push(...moradores.map(m => ({ ...m, role: sindicosIds.includes(m.id) ? 'SINDICO' : 'MORADOR', status: m.status || 'ATIVO', email: m.email || '—' })));
        if (funcionarios) allUsers.push(...funcionarios.map(f => ({ ...f, role: 'FUNCIONARIO', status: f.status || 'ATIVO', email: f.email || '—' })));
        
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

      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (e) {
      alert('Erro ao atualizar status: ' + e.message);
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
      try {
        await supabase.from('Gestao_Sindicos').insert({
           sindico_id: userId,
           condominio_id: userToChange.condominio_id,
           ativo: true
        });
        setUsers(users.map(u => u.id === userId ? { ...u, role: 'SINDICO' } : u));
      } catch (err) {
        alert('Erro ao promover a síndico');
      }
    } else if (newRole === 'MORADOR' && userToChange.role === 'SINDICO') {
      try {
        await supabase.from('Gestao_Sindicos').update({ ativo: false }).eq('sindico_id', userId);
        setUsers(users.map(u => u.id === userId ? { ...u, role: 'MORADOR' } : u));
      } catch(err) {
        alert('Erro ao remover síndico');
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoadingData(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newFunc.email,
        password: newFunc.senha,
      });
      if (authError) throw authError;

      const { data: masterData } = await supabase.from('Masters').select('condominio_id').eq('id', currentUser.id).single();
      
      const { error: insertError } = await supabase.from('Funcionarios').insert({
        id: authData.user.id,
        nome: newFunc.nome,
        cpf: newFunc.cpf,
        cargo: newFunc.cargo || 'Funcionário',
        condominio_id: masterData.condominio_id
      });
      if (insertError) throw insertError;

      alert('Funcionário criado com sucesso! Ele já pode fazer login com a senha: ' + newFunc.senha);
      setShowCreateModal(false);
      setNewFunc({ nome: '', email: '', cpf: '', cargo: '', senha: 'Mudar@123' });
      setUsers([{ id: authData.user.id, nome: newFunc.nome, email: newFunc.email, cpf: newFunc.cpf, role: 'FUNCIONARIO', status: 'ATIVO', condominio_id: masterData.condominio_id }, ...users]);
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
           <Loader2 className="input-icon" style={{ animation: 'spin 1s linear infinite', position: 'static', color: '#7c3aed' }} size={32} />
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
            <NotificationMenu />
            <div className="user-profile-dropdown" onClick={() => navigate('/perfil')}>
              <div className="user-avatar"><span>{currentUser?.name?.charAt(0) || 'A'}</span></div>
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
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  {[
                    { label: 'TOTAL DE USUÁRIOS',  value: users.length, color: '#475569' },
                    { label: 'ATIVOS',              value: activeUsers, color: '#16a34a' },
                    { label: 'PENDENTES',           value: pendingUsers, color: '#d97706' },
                    { label: 'BLOQUEADOS',          value: blockedUsers, color: '#dc2626' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px 20px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.07em', margin: '0 0 6px' }}>{s.label}</p>
                      <p style={{ fontSize: '28px', fontWeight: 600, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Usuário', 'CPF/Detalhes', 'Papel', 'Status', 'Ações'].map(h => (
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
                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: isBlocked ? '#e2e8f0' : `${rc}18`, color: isBlocked ? '#94a3b8' : rc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
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
                               {user.bloco && <span style={{fontSize:'10px', background:'#f1f5f9', padding:'2px 4px', borderRadius:'4px'}}>Bl. {user.bloco} Apt. {user.apartamento}</span>}
                            </td>
                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                               {['MORADOR', 'SINDICO'].includes(user.role) ? (
                                  <select 
                                     value={user.role} 
                                     onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                     style={{ fontSize: '11px', fontWeight: 700, color: rc, background: `${rc}15`, border: `1px solid ${rc}40`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                                  >
                                     <option value="MORADOR">Morador</option>
                                     <option value="SINDICO">Síndico</option>
                                  </select>
                               ) : (
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: rc, background: `${rc}15`, border: `1px solid ${rc}40`, borderRadius: '6px', padding: '4px 8px' }}>{rl}</span>
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
                                <button onClick={() => { setUserToEdit(user); setShowEditModal(true); }} title="Editar" style={{ padding: '5px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}><Edit2 size={14} /></button>
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
                      {users.length === 0 && (
                          <tr><td colSpan="5" style={{padding:'20px', textAlign:'center', color:'#94a3b8', fontSize:'13px'}}>Nenhum usuário cadastrado neste condomínio.</td></tr>
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
              <div className="gu-form-group"><label>E-mail (Login)</label><input type="email" value={newFunc.email} onChange={e => setNewFunc({...newFunc, email: e.target.value})} required className="gu-input"/></div>
              <div className="gu-form-group"><label>CPF</label><input type="text" value={newFunc.cpf} onChange={e => setNewFunc({...newFunc, cpf: e.target.value})} required className="gu-input"/></div>
              <div className="gu-form-group"><label>Cargo</label><input type="text" value={newFunc.cargo} onChange={e => setNewFunc({...newFunc, cargo: e.target.value})} placeholder="Ex: Porteiro" required className="gu-input"/></div>
              <div className="gu-form-group"><label>Senha Inicial</label><input type="text" value={newFunc.senha} onChange={e => setNewFunc({...newFunc, senha: e.target.value})} required className="gu-input"/></div>
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
    </div>
  );
};

export default PainelMaster;
