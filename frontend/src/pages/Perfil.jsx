import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Shield, Bell, Activity, Menu, MapPin, 
  Camera, Lock, Mail, Smartphone, Monitor, Globe,
  CheckCircle2, XCircle, AlertCircle, Info, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationMenu from '../components/NotificationMenu';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';
import './Perfil.css';

const MOCK_SESSIONS = [
  { id: 1, device: 'MacBook Pro', browser: 'Chrome', location: 'São Paulo, SP', time: 'Agora mesmo', isCurrent: true, icon: Monitor },
  { id: 2, device: 'iPhone 13', browser: 'Safari Mobile', location: 'São Paulo, SP', time: 'Ontem, 14:30', isCurrent: false, icon: Smartphone }
];

const MOCK_ACTIVITY = [
  { id: 1, action: 'Login realizado com sucesso', time: 'Há 2 horas', type: 'login' },
  { id: 2, action: 'Alteração de preferência de notificação', time: 'Há 2 dias', type: 'settings' },
  { id: 3, action: 'Senha alterada com sucesso', time: 'Há 1 semana', type: 'security' }
];

const Perfil = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  
  // Aba Geral - Email State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState('idle'); // idle, pending, rejected
  
  // Aba Segurança - Password State
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirmPass: '' });
  const [passStrength, setPassStrength] = useState(0);
  const [passFeedback, setPassFeedback] = useState(null); // { type: 'error'|'success', msg: '' }
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [show2faQr, setShow2faQr] = useState(false);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  // Aba Geral - Funcionário Especialidades
  const [mySkills, setMySkills] = useState(['Hidráulica', 'Elétrica', 'Limpeza']);

  // --- LOGIC: Banner & Role Variables ---
  const getRoleVars = () => {
    switch (currentUser.role) {
      case 'SINDICO': return { bannerClass: 'banner-sindico', avatarClass: 'avatar-sindico', roleBadge: 'role-sindico', roleName: 'Síndico', mainColor: '#4f46e5' };
      case 'FUNCIONARIO': return { bannerClass: 'banner-funcionario', avatarClass: 'avatar-funcionario', roleBadge: 'role-funcionario', roleName: 'Funcionário', mainColor: '#16a34a' };
      default: return { bannerClass: 'banner-morador', avatarClass: 'avatar-morador', roleBadge: 'role-morador', roleName: 'Morador', mainColor: '#ea580c' };
    }
  };
  const roleVars = getRoleVars();

  // --- LOGIC: Email Request ---
  const handleEmailRequest = (e) => {
    e.preventDefault();
    if (newEmail.trim() === '') return;
    setEmailStatus('pending');
    setIsEmailModalOpen(false);
  };

  // --- LOGIC: Password validation ---
  useEffect(() => {
    const pwd = passForm.newPass;
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    setPassStrength(score);
  }, [passForm.newPass]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPassFeedback(null);

    // Mock validation
    if (passForm.current !== 'senha123') {
      setPassFeedback({ type: 'error', msg: 'Credenciais inválidas.' });
      return;
    }
    if (passStrength < 4) {
      setPassFeedback({ type: 'error', msg: 'A nova senha não atende a todos os requisitos de força.' });
      return;
    }
    if (passForm.newPass !== passForm.confirmPass) {
      setPassFeedback({ type: 'error', msg: 'As senhas não coincidem.' });
      return;
    }

    setPassFeedback({ type: 'success', msg: 'Senha alterada com sucesso! Você será desconectado em 3 segundos...' });
    
    // Auto logout
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  };

  // --- LOGIC: End Session ---
  const handleEndSession = (id) => {
    setSessions(sessions.filter(s => s.id !== id));
  };


  return (
    <div className="dashboard-layout">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h2 className="header-title">Meu Perfil</h2>
              <p className="header-subtitle">Gerencie sua conta e configurações pessoais</p>
            </div>
          </div>
          <div className="header-right">
            <NotificationMenu />
            <div className="user-profile-dropdown">
              <div className="user-avatar" style={{backgroundColor: roleVars.mainColor}}>
                 <span>{currentUser.name.charAt(0)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Perfil Content */}
        <div className="dashboard-content-scroll" style={{ backgroundColor: '#f8fafc' }}>
          <div className="perfil-page-container">
            
            {/* Banner & User Meta */}
            <div className="perfil-hero-card">
              <div className={`perfil-banner ${roleVars.bannerClass}`}>
                <div className="perfil-avatar-wrapper">
                  <div className="perfil-avatar-circle">
                    <div className={`perfil-avatar-inner ${roleVars.avatarClass}`}>
                      {currentUser.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                    </div>
                    <div className="perfil-avatar-badge">
                      <Camera size={14} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="perfil-hero-info">
                <div className="perfil-user-meta">
                  <h3 className="perfil-user-name">
                    {currentUser.name} 
                    <span className="perfil-user-status">ATIVO</span>
                  </h3>
                  <div className="perfil-user-role" style={{marginTop:'4px'}}>
                    <span className={`badge-role ${roleVars.roleBadge}`}>{roleVars.roleName}</span>
                    <span style={{color:'#cbd5e1'}}>•</span>
                    <MapPin size={14} /> {currentUser.unidade}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs Layout */}
            <div className="saas-settings-layout">
              {/* Sidebar Tabs */}
              <div className="settings-sidebar">
                <button className={`settings-tab ${activeTab === 'geral' ? 'active' : ''}`} onClick={() => setActiveTab('geral')}>
                  <User size={18} /> Dados Gerais
                </button>
                <button className={`settings-tab ${activeTab === 'seguranca' ? 'active' : ''}`} onClick={() => setActiveTab('seguranca')}>
                  <Shield size={18} /> Segurança e Acesso
                </button>
                <button className={`settings-tab ${activeTab === 'notificacoes' ? 'active' : ''}`} onClick={() => setActiveTab('notificacoes')}>
                  <Bell size={18} /> Notificações
                </button>
                <button className={`settings-tab ${activeTab === 'atividade' ? 'active' : ''}`} onClick={() => setActiveTab('atividade')}>
                  <Activity size={18} /> Histórico de Atividades
                </button>
              </div>

              {/* Body Content */}
              <div className="settings-body">
                
                {/* --- ABA GERAL --- */}
                {activeTab === 'geral' && (
                  <form onSubmit={(e) => { e.preventDefault(); alert('Dados pessoais atualizados com sucesso.'); }}>
                    <h4 className="settings-section-title">Informações Pessoais</h4>
                    <p className="settings-section-desc">Atualize seus dados básicos de contato.</p>
                    
                    <div className="saas-grid">
                      <div className="saas-form-group">
                        <label className="saas-label">Nome Completo</label>
                        <input className="saas-input" type="text" defaultValue={currentUser.name} required />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">Telefone / Celular</label>
                        <input className="saas-input" type="text" defaultValue={currentUser.phone} required />
                      </div>
                    </div>

                    <div className="saas-form-group" style={{maxWidth: '500px'}}>
                      <label className="saas-label">
                        E-mail de Acesso
                        {emailStatus === 'pending' && <span className="badge-pending">Pendente de aprovação</span>}
                        {emailStatus === 'rejected' && <span className="badge-rejected">Solicitação recusada</span>}
                      </label>
                      <div style={{position: 'relative', display: 'flex', gap: '1rem'}}>
                        <input 
                          className="saas-input readonly has-icon" 
                          type="text" 
                          value={emailStatus === 'pending' ? newEmail : currentUser.email} 
                          disabled 
                        />
                        <Lock size={16} className="input-icon-right" style={{top: '12px'}} />
                        <button 
                          type="button" 
                          className="btn-outline-primary" 
                          style={{flexShrink: 0}}
                          onClick={() => setIsEmailModalOpen(true)}
                          disabled={emailStatus === 'pending'}
                        >
                          Solicitar alteração
                        </button>
                      </div>
                      <p style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem'}}>
                        A alteração de e-mail requer aprovação do administrador por motivos de segurança.
                      </p>
                    </div>

                    <div className="saas-divider"></div>

                    <h4 className="settings-section-title">Dados Restritos</h4>
                    <p className="settings-section-desc">Estas informações não podem ser alteradas diretamente.</p>
                    
                    <div className="saas-grid">
                      <div className="saas-form-group">
                        <label className="saas-label">CPF / Documento</label>
                        <input className="saas-input readonly" type="text" value={`***.${currentUser.cpf.substring(4,7)}.***-00`} disabled />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">{currentUser.role === 'MORADOR' ? 'Unidade' : 'Cargo / Categoria'}</label>
                        <input className="saas-input readonly" type="text" value={currentUser.unidade} disabled />
                      </div>
                    </div>

                    {currentUser.role === 'FUNCIONARIO' && (
                      <>
                        <div className="saas-divider"></div>
                        <h4 className="settings-section-title">Minhas Especialidades</h4>
                        <p className="settings-section-desc">Adicione categorias de serviços que você domina. O Síndico será notificado para aprovação se houverem regras estritas.</p>
                        
                        <div className="saas-form-group" style={{maxWidth: '500px'}}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            {mySkills.map(skill => (
                              <span key={skill} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#e0f2fe', color: '#0284c7', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                                {skill}
                              </span>
                            ))}
                            {mySkills.length === 0 && <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>Nenhuma especialidade cadastrada.</span>}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="saas-form-actions">
                      <button type="submit" className="btn-saas-primary">
                        Salvar Alterações
                      </button>
                    </div>

                    {/* Email Modal */}
                    {isEmailModalOpen && (
                      <div className="custom-modal-overlay">
                        <div className="custom-modal">
                          <div className="custom-modal-header">
                            <h3>Solicitar Alteração de E-mail</h3>
                            <button style={{background:'none', border:'none', cursor:'pointer'}} onClick={() => setIsEmailModalOpen(false)}>
                              <X size={20} color="#64748b"/>
                            </button>
                          </div>
                          <div className="custom-modal-body">
                            <div className="alert-error" style={{background:'#fffbeb', color:'#d97706', borderColor:'#fde68a'}}>
                              <Info size={16} style={{display:'inline', verticalAlign:'sub', marginRight:'4px'}}/>
                              Sua solicitação será analisada pelo administrador. Você será notificado quando aprovada ou recusada.
                            </div>
                            <div className="saas-form-group">
                              <label className="saas-label">Novo e-mail desejado</label>
                              <input className="saas-input" type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="exemplo@email.com" />
                            </div>
                            <div className="saas-form-group">
                              <label className="saas-label">Confirmar novo e-mail</label>
                              <input className="saas-input" type="email" placeholder="exemplo@email.com" />
                            </div>
                            <div className="saas-form-group">
                              <label className="saas-label">Motivo (opcional)</label>
                              <input className="saas-input" type="text" placeholder="Perdi acesso ao antigo" />
                            </div>
                          </div>
                          <div className="custom-modal-footer">
                            <button className="btn-outline-primary" style={{border:'none', color:'#64748b'}} onClick={() => setIsEmailModalOpen(false)}>Cancelar</button>
                            <button className="btn-saas-primary" onClick={handleEmailRequest} disabled={!newEmail}>Enviar Solicitação</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                )}

                {/* --- ABA SEGURANÇA --- */}
                {activeTab === 'seguranca' && (
                  <div>
                    <h4 className="settings-section-title">Alterar Senha</h4>
                    <p className="settings-section-desc">Garanta que sua conta utiliza uma senha forte e exclusiva.</p>
                    
                    {passFeedback && (
                      <div className={passFeedback.type === 'error' ? 'alert-error' : 'alert-success'}>
                        {passFeedback.msg}
                      </div>
                    )}

                    <form onSubmit={handlePasswordSubmit}>
                      <div className="saas-form-group" style={{ maxWidth: '400px' }}>
                        <label className="saas-label">Senha Atual</label>
                        <input 
                          className="saas-input" type="password" placeholder="••••••••" required 
                          value={passForm.current} onChange={e=>setPassForm({...passForm, current: e.target.value})}
                        />
                      </div>

                      <div className="saas-grid">
                        <div className="saas-form-group">
                          <label className="saas-label">Nova Senha</label>
                          <input 
                            className="saas-input" type="password" required 
                            value={passForm.newPass} onChange={e=>setPassForm({...passForm, newPass: e.target.value})}
                          />
                          <div className="password-strength-container">
                            <div className={`password-strength-bar ${passStrength <= 1 ? 'ps-weak' : passStrength <= 3 ? 'ps-medium' : 'ps-strong'}`}>
                              <div className="ps-bar"></div>
                              <div className="ps-bar"></div>
                              <div className="ps-bar"></div>
                              <div className="ps-bar"></div>
                            </div>
                            <ul className="password-rules">
                              <li className={`pr-rule ${passForm.newPass.length >= 8 ? 'valid' : ''}`}>
                                {passForm.newPass.length >= 8 ? <CheckCircle2 size={12}/> : <XCircle size={12}/>} Mín. 8 caracteres
                              </li>
                              <li className={`pr-rule ${/[A-Z]/.test(passForm.newPass) ? 'valid' : ''}`}>
                                {/[A-Z]/.test(passForm.newPass) ? <CheckCircle2 size={12}/> : <XCircle size={12}/>} 1 Letra maiúscula
                              </li>
                              <li className={`pr-rule ${/[0-9]/.test(passForm.newPass) ? 'valid' : ''}`}>
                                {/[0-9]/.test(passForm.newPass) ? <CheckCircle2 size={12}/> : <XCircle size={12}/>} 1 Número
                              </li>
                              <li className={`pr-rule ${/[^A-Za-z0-9]/.test(passForm.newPass) ? 'valid' : ''}`}>
                                {/[^A-Za-z0-9]/.test(passForm.newPass) ? <CheckCircle2 size={12}/> : <XCircle size={12}/>} 1 Caractere especial
                              </li>
                            </ul>
                          </div>
                        </div>
                        <div className="saas-form-group">
                          <label className="saas-label">Confirmar Nova Senha</label>
                          <input 
                            className="saas-input" type="password" required 
                            value={passForm.confirmPass} onChange={e=>setPassForm({...passForm, confirmPass: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="saas-form-actions" style={{marginTop:'1rem'}}>
                        <button type="submit" className="btn-saas-primary" style={{backgroundColor: roleVars.mainColor}}>
                          <Shield size={16} /> Atualizar Senha
                        </button>
                      </div>
                    </form>

                    <div className="saas-divider"></div>

                    <h4 className="settings-section-title">Sessões Ativas</h4>
                    <p className="settings-section-desc">Dispositivos onde você está logado atualmente.</p>
                    
                    <div className="session-list">
                      {sessions.map(sess => {
                        const Icon = sess.icon;
                        return (
                          <div key={sess.id} className="session-item">
                            <div className="session-info">
                              <div className="session-icon"><Icon size={20}/></div>
                              <div className="session-meta">
                                <h5>{sess.device} {sess.isCurrent && <span className="badge-current">Esta sessão</span>}</h5>
                                <p>{sess.browser} • {sess.location}</p>
                                <p style={{fontSize:'0.7rem', marginTop:'2px'}}>{sess.time}</p>
                              </div>
                            </div>
                            {!sess.isCurrent && (
                              <button className="btn-end-session" onClick={() => handleEndSession(sess.id)}>Encerrar</button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="saas-divider"></div>

                    <h4 className="settings-section-title">Autenticação de Dois Fatores (2FA)</h4>
                    <p className="settings-section-desc">Adicione uma camada extra de segurança utilizando um aplicativo autenticador.</p>

                    <div className="saas-toggle-row">
                      <div className="saas-toggle-info">
                        <strong>Ativar 2FA via App</strong>
                        <span>Utilize Google Authenticator ou Authy.</span>
                      </div>
                      <label className="saas-switch">
                        <input type="checkbox" checked={is2faEnabled} onChange={() => { setIs2faEnabled(!is2faEnabled); setShow2faQr(!is2faEnabled); }} />
                        <span className="saas-slider" style={{backgroundColor: is2faEnabled ? roleVars.mainColor : ''}}></span>
                      </label>
                    </div>

                    {show2faQr && (
                      <div className="tfa-box">
                        <div className="tfa-qr">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Mock2FA" alt="QR Code Mock" />
                        </div>
                        <div style={{flex:1}}>
                          <h5 style={{margin:'0 0 0.5rem 0', color:'#0f172a'}}>Configure o seu App</h5>
                          <p style={{fontSize:'0.85rem', color:'#64748b', marginBottom:'1rem'}}>1. Escaneie o QR Code com o seu app autenticador.<br/>2. Digite o código de 6 dígitos gerado para confirmar.</p>
                          <div style={{display:'flex', gap:'0.5rem'}}>
                            <input type="text" className="saas-input" placeholder="000000" style={{maxWidth:'120px', textAlign:'center', letterSpacing:'4px'}} maxLength={6} />
                            <button className="btn-saas-primary" style={{backgroundColor: roleVars.mainColor}} onClick={()=>setShow2faQr(false)}>Confirmar</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- ABA NOTIFICAÇÕES --- */}
                {activeTab === 'notificacoes' && (
                  <div>
                    <h4 className="settings-section-title">Preferências de Comunicação</h4>
                    <p className="settings-section-desc">Selecione quais alertas você deseja receber.</p>
                    
                    <div style={{display:'flex', gap:'1.5rem', marginBottom:'1.5rem'}}>
                       <div style={{padding:'0.5rem 1rem', background:'#f8fafc', borderRadius:'6px', display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.85rem', fontWeight:600, color:'#0f172a', border:'1px solid #e2e8f0'}}>
                          <Mail size={16} color="#64748b"/> E-mail
                       </div>
                       <div style={{padding:'0.5rem 1rem', background:'#f8fafc', borderRadius:'6px', display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.85rem', fontWeight:600, color:'#0f172a', border:'1px solid #e2e8f0'}}>
                          <Globe size={16} color="#64748b"/> Push (Navegador)
                       </div>
                    </div>

                    <div className="saas-divider" style={{margin:'1rem 0'}}></div>

                    <div className="saas-toggle-row">
                      <div className="saas-toggle-info">
                        <strong>Avisos e Comunicados do Condomínio</strong>
                        <span>Alertas gerais enviados pela administração.</span>
                      </div>
                      <label className="saas-switch"><input type="checkbox" defaultChecked /><span className="saas-slider" style={{backgroundColor: roleVars.mainColor}}></span></label>
                    </div>

                    {(currentUser.role === 'SINDICO' || currentUser.role === 'FUNCIONARIO') && (
                      <>
                        <div className="saas-toggle-row">
                          <div className="saas-toggle-info">
                            <strong>Novas Ocorrências Abertas</strong>
                            <span>Seja notificado imediatamente quando um morador abrir um chamado.</span>
                          </div>
                          <label className="saas-switch"><input type="checkbox" defaultChecked /><span className="saas-slider" style={{backgroundColor: roleVars.mainColor}}></span></label>
                        </div>
                        <div className="saas-toggle-row">
                          <div className="saas-toggle-info">
                            <strong>Alertas de SLA Vencendo</strong>
                            <span>Avisos de tarefas prestes a estourar o tempo estipulado.</span>
                          </div>
                          <label className="saas-switch"><input type="checkbox" defaultChecked /><span className="saas-slider" style={{backgroundColor: roleVars.mainColor}}></span></label>
                        </div>
                      </>
                    )}

                    {currentUser.role === 'MORADOR' && (
                      <div className="saas-toggle-row">
                        <div className="saas-toggle-info">
                          <strong>Atualizações das Minhas Ocorrências</strong>
                          <span>Receba avisos quando o status do seu chamado mudar ou houver comentários.</span>
                        </div>
                        <label className="saas-switch"><input type="checkbox" defaultChecked /><span className="saas-slider" style={{backgroundColor: roleVars.mainColor}}></span></label>
                      </div>
                    )}

                    {currentUser.role === 'SINDICO' && (
                      <div className="saas-toggle-row">
                        <div className="saas-toggle-info">
                          <strong>Solicitações Sensíveis de Usuários</strong>
                          <span>Ex: Aprovações de troca de e-mail ou exclusão de conta.</span>
                        </div>
                        <label className="saas-switch"><input type="checkbox" defaultChecked /><span className="saas-slider" style={{backgroundColor: roleVars.mainColor}}></span></label>
                      </div>
                    )}

                    <div className="saas-form-actions">
                      <button className="btn-saas-primary" style={{backgroundColor: roleVars.mainColor}}>Salvar Preferências</button>
                    </div>
                  </div>
                )}

                {/* --- ABA ATIVIDADE --- */}
                {activeTab === 'atividade' && (
                  <div>
                    <h4 className="settings-section-title">Registro de Atividades</h4>
                    <p className="settings-section-desc">Seu histórico de interações com o sistema por motivos de auditoria de segurança.</p>
                    
                    <div className="activity-timeline">
                       {MOCK_ACTIVITY.map(act => (
                         <div key={act.id} className="activity-item">
                            <div className="act-icon">
                               {act.type === 'login' ? <Monitor size={16}/> : act.type === 'security' ? <Shield size={16}/> : <Activity size={16}/>}
                            </div>
                            <div className="act-content">
                               <span className="act-title">{act.action}</span>
                               <span className="act-time">{act.time} via Navegador</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Perfil;
