import React, { useState } from 'react';
import {
  Menu, Search, UserCheck, Shield, User, Building, MoreVertical, Check, X, Users, UserPlus, FileText, Ban, Edit2, Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import { useAuth } from '../contexts/AuthContext';
import './GerenciamentoUsuarios.css';

const GerenciamentoUsuarios = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Mock data for users
  const [users, setUsers] = useState([
    { id: 1, name: 'João Marcos', email: 'joao@email.com', cpf: '111.222.333-44', role: 'MORADOR', status: 'ATIVO' },
    { id: 2, name: 'Maria Silva', email: 'maria@email.com', cpf: '555.666.777-88', role: 'MORADOR', status: 'PENDENTE' },
    { id: 3, name: 'Carlos Admin', email: 'carlos@email.com', cpf: '999.888.777-66', role: 'ADMIN', status: 'ATIVO' },
    { id: 4, name: 'Ana Oliveira', email: 'ana@email.com', cpf: '222.333.444-55', role: 'FUNCIONARIO', status: 'ATIVO' },
  ]);

  // Auditoria Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 101, action: 'Sistema Iniciado', targetUser: 'System', performedBy: 'System', date: new Date().toISOString() }
  ]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Forms states
  const [newUser, setNewUser] = useState({ name: '', email: '', cpf: '', role: 'MORADOR', condominium: '', bloco: '', apartment: '' });
  const [userToEdit, setUserToEdit] = useState(null);

  // User Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'ATIVO').length;
  const pendingUsers = users.filter(u => u.status === 'PENDENTE').length;
  const blockedUsers = users.filter(u => u.status === 'BLOQUEADO').length;

  const addAuditLog = (action, targetName) => {
    const newLog = {
      id: Date.now(),
      action,
      targetUser: targetName,
      performedBy: currentUser.name,
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
    
    // RBAC: Um user não deve poder alterar o próprio role
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
      status: 'ATIVO' // Criado pelo admin, entra ativo
    };
    setUsers([...users, createdUser]);
    addAuditLog(`Criação de Usuário (${newUser.role})`, newUser.name);
    setShowCreateModal(false);
    
    // Simula o disparo de e-mail com as credenciais
    setTimeout(() => {
        alert(`O usuário ${newUser.name} foi criado.\nUm e-mail contendo a senha provisória e o link de acesso foi disparado para ${newUser.email}!`);
        addAuditLog('Envio de Link de Acesso Inicial', newUser.name);
    }, 300);

    setNewUser({ name: '', email: '', cpf: '', role: 'MORADOR', condominium: '', bloco: '', apartment: '' });
  };

  const handleResetPassword = (user) => {
    if (window.confirm(`Tem certeza que deseja redefinir a senha de ${user.name}? \nIsso enviará um novo link de acesso seguro para ${user.email}.`)) {
       alert(`Link de acesso seguro e nova senha provisória gerados e enviados para o e-mail: ${user.email}`);
       addAuditLog('Envio de Reset de Senha', user.name);
    }
  };

  const openEditModal = (user) => {
    setUserToEdit({ ...user });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setUsers(users.map(u => u.id === userToEdit.id ? { ...u, name: userToEdit.name, email: userToEdit.email, cpf: userToEdit.cpf } : u));
    addAuditLog('Edição de Perfil', userToEdit.name);
    setShowEditModal(false);
    setUserToEdit(null);
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
              <h2 className="header-title">Gerenciamento de Usuários</h2>
              <p className="header-date">Painel Administrativo ({currentUser.name})</p>
            </div>
          </div>
          <div className="header-right">
            <div className="header-search">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Buscar usuários..." className="search-input" />
            </div>
            <NotificationMenu />
            <div className="user-profile-dropdown" onClick={() => navigate('/perfil')}>
              <div className="user-avatar"><span>{currentUser.name.charAt(0)}</span></div>
            </div>
          </div>
        </header>

        <div className="dashboard-content-scroll">
          <div className="dashboard-content-inner">
            
            {/* User Stats Grid */}
            <div className="gu-stats-grid">
              <div className="gu-stat-card">
                 <div className="gu-stat-label">Total de usuários</div>
                 <div className="gu-stat-value">{totalUsers}</div>
              </div>
              <div className="gu-stat-card">
                 <div className="gu-stat-label">Ativos</div>
                 <div className="gu-stat-value text-emerald">{activeUsers}</div>
              </div>
              <div className="gu-stat-card">
                 <div className="gu-stat-label">Pendentes</div>
                 <div className="gu-stat-value text-rose">{pendingUsers}</div>
              </div>
              <div className="gu-stat-card">
                 <div className="gu-stat-label">Bloqueados</div>
                 <div className="gu-stat-value text-slate">{blockedUsers}</div>
              </div>
            </div>

            <div className="gu-header-actions">
               <h3 className="section-title">Usuários Cadastrados</h3>
               <div className="gu-actions-group">
                  <button className="btn-secondary gu-btn-audit" onClick={() => setShowAuditModal(true)}>
                    <FileText size={18} /> Histórico de Auditoria
                  </button>
                  <button className="btn-primary gu-btn-create" onClick={() => setShowCreateModal(true)}>
                    <UserPlus size={18} /> Criar Usuário Extra
                  </button>
               </div>
            </div>

            <div className="gu-table-container">
              <table className="gu-table">
                <thead>
                  <tr>
                    <th>Nome / E-mail</th>
                    <th>CPF</th>
                    <th>Papel (Role)</th>
                    <th>Status</th>
                    <th className="text-right">Ações</th>
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
                          disabled={user.id === currentUser.id}
                        >
                          <option value="MORADOR">Morador</option>
                          <option value="FUNCIONARIO">Funcionário</option>
                          <option value="SINDICO">Síndico</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`gu-status-badge ${getStatusBadgeClass(user.status)}`}>
                           {user.status === 'ATIVO' && <Check size={14}/>}
                           {user.status === 'PENDENTE' && <Shield size={14}/>}
                           {user.status === 'BLOQUEADO' && <Ban size={14}/>}
                           {user.status}
                        </span>
                      </td>
                      <td className="gu-actions-td">
                         {user.status === 'PENDENTE' && (
                           <button className="gu-action-btn gu-approve-btn" onClick={() => handleApprove(user)} title="Aprovar Usuário">
                             Aprovar
                           </button>
                         )}
                         
                         {user.status !== 'PENDENTE' && user.id !== currentUser.id && (
                           <button 
                             className={`gu-action-btn ${user.status === 'BLOQUEADO' ? 'gu-unblock-btn' : 'gu-block-btn'}`} 
                             onClick={() => handleBlock(user)}
                             title={user.status === 'BLOQUEADO' ? "Desbloquear" : "Bloquear Usuário"}
                           >
                             {user.status === 'BLOQUEADO' ? 'Desbloquear' : 'Bloquear'}
                           </button>
                         )}
                         
                         <button className="gu-icon-btn" onClick={() => openEditModal(user)} title="Editar Perfil"><Edit2 size={18}/></button>

                         <button className="gu-icon-btn" style={{ marginLeft: '4px' }} onClick={() => handleResetPassword(user)} title="Gerar nova senha / Enviar Acesso"><Key size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal de Criação de Usuário */}
            {showCreateModal && (
              <div className="gu-modal-overlay">
                <div className="gu-modal">
                  <div className="gu-modal-header">
                    <h2>Criar Novo Usuário (Aprovado)</h2>
                    <button onClick={() => setShowCreateModal(false)}><X size={20}/></button>
                  </div>
                  <form onSubmit={handleCreateUser} className="gu-modal-form">
                    <div className="gu-form-group">
                      <label>Nome Completo</label>
                      <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required className="gu-input"/>
                    </div>
                    <div className="gu-form-group">
                      <label>E-mail</label>
                      <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required className="gu-input"/>
                    </div>
                    <div className="gu-form-group">
                      <label>CPF</label>
                      <input type="text" value={newUser.cpf} onChange={e => setNewUser({...newUser, cpf: e.target.value})} required className="gu-input"/>
                    </div>
                    <div className="gu-form-group">
                      <label>Papel</label>
                      <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="gu-input">
                         <option value="MORADOR">Morador</option>
                         <option value="FUNCIONARIO">Funcionário</option>
                         <option value="SINDICO">Síndico</option>
                         <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    
                    <div className="gu-form-group">
                      <label>Condomínio</label>
                      <select value={newUser.condominium} onChange={e => setNewUser({...newUser, condominium: e.target.value})} className="gu-input" required>
                         <option value="" disabled>Selecione um Condomínio...</option>
                         <option value="Condomínio Bela Vista">Condomínio Bela Vista</option>
                         <option value="Residencial Florescer">Residencial Florescer</option>
                         <option value="Edifício Central Park">Edifício Central Park</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className="gu-form-group" style={{ flex: 1 }}>
                        <label>Bloco</label>
                        <input type="text" value={newUser.bloco} onChange={e => setNewUser({...newUser, bloco: e.target.value})} placeholder="Ex: A" className="gu-input" />
                      </div>
                      <div className="gu-form-group" style={{ flex: 1 }}>
                        <label>Apto / Unidade</label>
                        <input type="text" value={newUser.apartment} onChange={e => setNewUser({...newUser, apartment: e.target.value})} placeholder="Ex: 101" className="gu-input" required />
                      </div>
                    </div>

                    <div className="gu-form-group">
                      <label>Credenciais de Acesso</label>
                      <div style={{ padding: '0.75rem', backgroundColor: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '6px', fontSize: '0.85rem', color: '#0f766e' }}>
                         O sistema gerará automaticamente uma senha provisória segura e enviará o link de Primeiro Acesso para <strong>{newUser.email || 'o e-mail informado'}</strong>.
                      </div>
                    </div>
                    <div className="gu-modal-footer">
                      <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                      <button type="submit" className="btn-primary">Adicionar Usuário</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal de Edição de Usuário */}
            {showEditModal && userToEdit && (
              <div className="gu-modal-overlay">
                <div className="gu-modal">
                  <div className="gu-modal-header">
                    <h2>Editar Usuário</h2>
                    <button onClick={() => setShowEditModal(false)}><X size={20}/></button>
                  </div>
                  <form onSubmit={handleEditSubmit} className="gu-modal-form">
                    <div className="gu-form-group">
                      <label>Nome Completo</label>
                      <input type="text" value={userToEdit.name} onChange={e => setUserToEdit({...userToEdit, name: e.target.value})} required className="gu-input"/>
                    </div>
                    <div className="gu-form-group">
                      <label>E-mail</label>
                      <input type="email" value={userToEdit.email} onChange={e => setUserToEdit({...userToEdit, email: e.target.value})} required className="gu-input"/>
                    </div>
                    <div className="gu-form-group">
                      <label>CPF</label>
                      <input type="text" value={userToEdit.cpf} onChange={e => setUserToEdit({...userToEdit, cpf: e.target.value})} required className="gu-input"/>
                    </div>
                    {/* Role is changed inline in the table */}
                    <div className="gu-modal-footer">
                      <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                      <button type="submit" className="btn-primary">Salvar Alterações</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal de Auditoria */}
            {showAuditModal && (
              <div className="gu-modal-overlay">
                <div className="gu-modal" style={{ maxWidth: '40rem' }}>
                  <div className="gu-modal-header">
                    <h2>Histórico de Auditoria</h2>
                    <button onClick={() => setShowAuditModal(false)}><X size={20}/></button>
                  </div>
                  <div className="gu-modal-body" style={{ maxHeight: '400px', overflowY: 'auto', padding: '1.5rem' }}>
                     {auditLogs.length === 0 ? (
                        <p className="gu-td-text" style={{ textAlign: 'center' }}>Nenhum log registrado ainda.</p>
                     ) : (
                        <ul className="gu-audit-list">
                           {auditLogs.map(log => (
                              <li key={log.id} className="gu-audit-item">
                                 <div className="gu-audit-header">
                                    <span className="gu-audit-action">{log.action}</span>
                                    <span className="gu-audit-date">{new Date(log.date).toLocaleString()}</span>
                                 </div>
                                 <div className="gu-audit-details">
                                    <p><strong>Usuário Alvo:</strong> {log.targetUser}</p>
                                    <p><strong>Executado por:</strong> {log.performedBy}</p>
                                 </div>
                              </li>
                           ))}
                        </ul>
                     )}
                  </div>
                  <div className="gu-modal-footer" style={{ padding: '1.5rem', borderTop: '1px solid var(--color-slate-100)' }}>
                      <button type="button" className="btn-secondary" onClick={() => setShowAuditModal(false)}>Fechar Histórico</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default GerenciamentoUsuarios;
