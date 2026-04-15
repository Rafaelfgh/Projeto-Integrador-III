import React, { useState } from 'react';
import {
  Menu, Search, UserCheck, Shield, User, Building, MoreVertical, Check, X, Users, UserPlus, FileText, Ban, Edit2, Key, LayoutDashboard, Clock, Settings, AlertTriangle, Eye, TrendingUp, TrendingDown, DollarSign, AlertCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import { useAuth } from '../contexts/AuthContext';
import './PainelAdmin.css';

const PainelAdmin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
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
            <button className="btn-primary" style={{marginRight: '1rem', padding: '0.4rem 1rem', fontSize: '0.85rem'}} onClick={() => navigate('/novo-condominio')}>
               + Novo Condomínio
            </button>
            <NotificationMenu />
            <div className="user-profile-dropdown" onClick={() => navigate('/perfil')}>
              <div className="user-avatar"><span>{currentUser?.name?.charAt(0) || 'A'}</span></div>
            </div>
          </div>
        </header>

        <div className="dashboard-content-scroll" style={{ padding: '2rem' }}>
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', color: '#1e293b', fontWeight: 'bold' }}>Visão Geral do Sistema</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div className="gu-financial-card">
                        <div className="gu-fin-label">MRR Consolidado (Mês)</div>
                        <div className="gu-fin-value">R$ 14.500</div>
                        <div className="gu-fin-trend"><TrendingUp size={14}/> +12% anual</div>
                    </div>
                    <div className="gu-financial-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)' }}>
                        <div className="gu-fin-label">Taxa de Inadimplência</div>
                        <div className="gu-fin-value text-rose">8.4%</div>
                        <div className="gu-fin-trend negative"><TrendingDown size={14}/> +1.2% req. atenção</div>
                    </div>
                    <div className="gu-stat-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                        <div className="gu-stat-label">Usuários Cadastrados</div>
                        <div className="gu-stat-value">{totalUsers}</div>
                    </div>
                    <div className="gu-stat-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                        <div className="gu-stat-label">Condomínios Ativos</div>
                        <div className="gu-stat-value text-slate">1</div>
                    </div>
                </div>

                <div className="overview-grid">
                  <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 600, marginBottom: '1rem' }}>Estado da Plataforma</h4>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                          Todos os serviços operando normalmente. Último backup executado há 2 horas. 
                          Novas regulamentações cadastradas pelo Síndico ontem às 15:43.
                      </p>
                  </div>
                  
                  <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={18} color="#ef4444" />
                        Alertas Críticos
                      </h4>
                      <div className="gu-alerts-list">
                        <div className="gu-alert-card critical">
                           <div className="gu-alert-icon critical"><AlertCircle size={16} /></div>
                           <div className="gu-alert-content">
                             <h4>Ocorrências Vencidas</h4>
                             <p>12 chamados sem resposta há mais de 7 dias úteis.</p>
                           </div>
                        </div>
                        <div className="gu-alert-card warning">
                           <div className="gu-alert-icon warning"><AlertTriangle size={16} /></div>
                           <div className="gu-alert-content">
                             <h4>Risco de Churn</h4>
                             <p>Condomínio Bela Vista (BL 1) inadimplência acentuada.</p>
                           </div>
                        </div>
                      </div>
                  </div>
                </div>
            </div>
          )}

          {/* TAB: USUARIOS */}
          {activeTab === 'usuarios' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="gu-header-actions">
                  <h3 className="section-title">Gestão de Perfis & Acesso</h3>
                  <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    <UserPlus size={18} /> Cadastrar Nova Conta
                  </button>
                </div>

                <div className="gu-table-container">
                  <table className="gu-table">
                    <thead>
                      <tr>
                        <th>Identificação</th>
                        <th>CPF</th>
                        <th>Nível de Acesso</th>
                        <th>Situação</th>
                        <th className="text-right">Ações Restritas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className={user.status === 'BLOQUEADO' ? 'gu-row-blocked' : ''}>
                          <td>
                            <div className="gu-user-info">
                              <div className={`gu-avatar-mini ${user.status === 'BLOQUEADO'? 'bg-gray' : ''}`}>{user.name.charAt(0)}</div>
                              <div>
                                <p className="gu-user-name">{user.name}</p>
                                <p className="gu-user-email">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="gu-td-text">{user.cpf}</td>
                          <td>
                            <select 
                              className={`gu-role-select ${getRoleBadgeClass(user.role)}`}
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              disabled={user.id === currentUser?.id}
                            >
                              <option value="MORADOR">Morador</option>
                              <option value="FUNCIONARIO">Funcionário</option>
                              <option value="SINDICO">Síndico</option>
                              <option value="ADMIN">Administrador</option>
                            </select>
                          </td>
                          <td>
                            <span className={`gu-status-badge ${getStatusBadgeClass(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="gu-actions-td">
                            {user.status === 'PENDENTE' && (
                              <button className="gu-action-btn gu-approve-btn" onClick={() => handleApprove(user)} title="Aprovar Usuário">Liberar Cadastro</button>
                            )}
                            
                            {user.status !== 'PENDENTE' && user.id !== currentUser?.id && (
                              <button 
                                className={`gu-action-btn ${user.status === 'BLOQUEADO' ? 'gu-unblock-btn' : 'gu-block-btn'}`} 
                                onClick={() => handleBlock(user)}
                              >
                                {user.status === 'BLOQUEADO' ? 'Desbloquear' : 'Bloquear'}
                              </button>
                            )}
                            <button className="gu-icon-btn" onClick={() => {setUserToEdit(user); setShowEditModal(true);}} title="Editar Cadastro"><Edit2 size={18}/></button>
                            <button className="gu-icon-btn" style={{ marginLeft: '4px' }} onClick={() => handleResetPassword(user)} title="Ação Diretiva: Forçar Nova Senha"><Key size={18}/></button>
                            {user.status === 'ATIVO' && user.id !== currentUser?.id && (
                                <button className="gu-supervision-btn" style={{ marginLeft: '4px' }} onClick={() => handleViewAs(user)} title="Logar como usuário no modo Supervisão">
                                  <Eye size={16}/> View As
                                </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

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
