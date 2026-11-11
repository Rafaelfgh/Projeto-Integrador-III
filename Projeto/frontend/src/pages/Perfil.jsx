import React, { useState, useEffect } from 'react';
import AvatarUsuario from '../components/AvatarUsuario';
import ExcluirConta from '../components/ExcluirConta';
import { 
  User, Shield, Bell, Activity, Menu, MapPin, 
  Camera, Lock, Mail, Smartphone, Monitor, Globe,
  CheckCircle2, XCircle, AlertCircle, Info, X, Building
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationMenu from '../components/NotificationMenu';
import Sidebar from '../components/Sidebar';
import { supabase } from '../backend/supabaseClient';
import './Dashboard.css';
import './Perfil.css';

const Perfil = () => {
  const { currentUser } = useAuth();
  
  // States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  
  
  // Aba Segurança - Password State
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirmPass: '' });
  const [passStrength, setPassStrength] = useState(0);
  const [passFeedback, setPassFeedback] = useState(null); // { type: 'error'|'success', msg: '' }


  // --- LOGIC: Identificar Tabela e Condomínio ---
  const [condominioName, setCondominioName] = useState('Carregando condomínio...');
  const [tableName, setTableName] = useState('');

  useEffect(() => {
    const fetchCondominio = async () => {
      try {
        let condId = null;
        let table = '';

        if (currentUser.role === 'MASTER') {
          table = 'Masters';
          const { data } = await supabase.from('Masters').select('condominio_id').eq('id', currentUser.id).single();
          if (data) condId = data.condominio_id;
        } else if (currentUser.role === 'FUNCIONARIO') {
          table = 'Funcionarios';
          const { data } = await supabase.from('Funcionarios').select('condominio_id').eq('id', currentUser.id).single();
          if (data) condId = data.condominio_id;
        } else {
          // MORADOR ou SINDICO
          table = 'Moradores';
          const { data } = await supabase.from('Moradores').select('condominio_id').eq('id', currentUser.id).single();
          if (data) condId = data.condominio_id;
        }

        setTableName(table);

        if (condId) {
          const { data: condData } = await supabase.from('Condominios').select('nome').eq('id', condId).single();
          if (condData) {
            setCondominioName(condData.nome);
          } else {
            setCondominioName('Condomínio não encontrado');
          }
        } else {
          setCondominioName('Sem condomínio vinculado');
        }
      } catch (err) {
        console.error('Erro ao buscar condomínio:', err);
        setCondominioName('Erro ao carregar');
      }
    };

    if (currentUser?.id) {
      fetchCondominio();
    }
  }, [currentUser]);

  // --- LOGIC: Banner & Role Variables ---
  const getRoleVars = () => {
    switch (currentUser.role) {
      case 'MASTER': return { bannerClass: 'banner-master', avatarClass: 'avatar-master', roleBadge: 'role-master', roleName: 'Master Admin', mainColor: '#121417' };
      case 'SINDICO': return { bannerClass: 'banner-sindico', avatarClass: 'avatar-sindico', roleBadge: 'role-sindico', roleName: 'Síndico', mainColor: '#121417' };
      case 'FUNCIONARIO': return { bannerClass: 'banner-funcionario', avatarClass: 'avatar-funcionario', roleBadge: 'role-funcionario', roleName: 'Funcionário', mainColor: '#16a34a' };
      default: return { bannerClass: 'banner-morador', avatarClass: 'avatar-morador', roleBadge: 'role-morador', roleName: 'Morador', mainColor: '#ea580c' };
    }
  };
  const roleVars = getRoleVars();

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

  // Conta que entrou só pelo Google ainda não tem senha: cria sem pedir a "senha atual"
  const [temSenha, setTemSenha] = useState(true);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const provedores = data?.user?.app_metadata?.providers || [];
      setTemSenha(provedores.includes('email'));
    });
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassFeedback(null);
    if (passStrength < 4) {
      setPassFeedback({ type: 'error', msg: 'A nova senha não atende a todos os requisitos de força.' });
      return;
    }
    if (passForm.newPass !== passForm.confirmPass) {
      setPassFeedback({ type: 'error', msg: 'As senhas não coincidem.' });
      return;
    }
    setSalvandoSenha(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (temSenha) {
      const { error: errAtual } = await supabase.auth.signInWithPassword({ email: user.email, password: passForm.current });
      if (errAtual) {
        setSalvandoSenha(false);
        setPassFeedback({ type: 'error', msg: 'Senha atual incorreta.' });
        return;
      }
    }
    const { error } = await supabase.auth.updateUser({ password: passForm.newPass });
    setSalvandoSenha(false);
    if (error) {
      setPassFeedback({ type: 'error', msg: error.message?.includes('different') ? 'A nova senha precisa ser diferente da atual.' : 'Não foi possível salvar a senha. Tente de novo.' });
      return;
    }
    setPassForm({ current: '', newPass: '', confirmPass: '' });
    setPassStrength(0);
    setTemSenha(true);
    setPassFeedback({ type: 'success', msg: temSenha ? 'Senha alterada com sucesso!' : 'Senha criada! Agora você também pode entrar com e-mail e senha.' });
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
            <div className="header-breadcrumbs">
              <h2 className="header-title">Meu Perfil</h2>
              <p className="header-date">Gerencie sua conta e configurações pessoais</p>
            </div>
          </div>
          <div className="header-right">
            <NotificationMenu />
            <div 
              className="user-profile-dropdown" 
              style={{ 
                display:'flex', 
                alignItems:'center', 
                gap:'0.75rem', 
                borderLeft:'1px solid #e2e8f0', 
                paddingLeft:'1rem'
              }}
            >
              <AvatarUsuario nome={currentUser?.name} foto={currentUser?.foto} tamanho={36} />
            </div>
          </div>
        </header>

        {/* Perfil Content */}
        <div className="dashboard-content-scroll">
          <div className="perfil-page-container">
            
            {/* Banner & User Meta */}
            <div className="perfil-hero-card">
              <div className={`perfil-banner ${roleVars.bannerClass}`}>
                <div className="perfil-avatar-wrapper">
                  <div className="perfil-avatar-circle">
                    <div className={`perfil-avatar-inner ${roleVars.avatarClass}`}>
                      {/* Funcionário: foto cadastrada pela gestão (ele não pode trocar) */}
                      {currentUser.foto
                        ? <AvatarUsuario nome={currentUser.name} foto={currentUser.foto} style={{ width: '100%', height: '100%' }} />
                        : currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
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
                  <div className="perfil-user-role" style={{marginTop:'4px', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap'}}>
                    <span className={`badge-role ${roleVars.roleBadge}`} title={`Tabela de origem: ${tableName}`}>
                      {roleVars.roleName}
                    </span>
                    <span style={{color:'#cbd5e1'}}>•</span>
                    <span style={{display:'flex', alignItems:'center', gap:'4px'}}>
                      <Building size={14} color={roleVars.mainColor} />
                      <strong>{condominioName}</strong>
                    </span>
                    {(currentUser.role === 'MORADOR' || currentUser.role === 'SINDICO') && currentUser.unidade !== condominioName && (
                      <>
                        <span style={{color:'#cbd5e1'}}>•</span>
                        <span style={{display:'flex', alignItems:'center', gap:'4px'}}>
                          <MapPin size={14} /> {currentUser.unidade}
                        </span>
                      </>
                    )}
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
              </div>

              {/* Body Content */}
              <div className="settings-body">
                
                {/* --- ABA GERAL --- */}
                {activeTab === 'geral' && (
                  <div>
                    <h4 className="settings-section-title">Informações Pessoais</h4>
                    <p className="settings-section-desc">Seus dados no condomínio. Para corrigir algum deles, fale com a administração (síndico ou Master).</p>
                    
                    <div className="saas-grid">
                      <div className="saas-form-group">
                        <label className="saas-label">Nome Completo</label>
                        <input className="saas-input readonly" type="text" value={currentUser.name || ''} disabled />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">Telefone / Celular</label>
                        <input className="saas-input readonly" type="text" value={currentUser.phone || '—'} disabled />
                      </div>
                    </div>

                    <div className="saas-form-group" style={{maxWidth: '500px'}}>
                      <label className="saas-label">
                        E-mail de Acesso
                      </label>
                      <div style={{display: 'flex', gap: '1rem'}}>
                        {/* o cadeado fica dentro do campo (antes caía em cima do botão) */}
                        <div style={{position: 'relative', flex: 1}}>
                        <input 
                          className="saas-input readonly has-icon" 
                          type="text" 
                          value={currentUser.email || ''} 
                          disabled 
                        />
                        <Lock size={16} className="input-icon-right" style={{top: '50%', transform: 'translateY(-50%)'}} />
                        </div>
                      </div>
                      <p style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem'}}>
                        É o e-mail que você usa para entrar no Habitare.
                      </p>
                    </div>

                    <div className="saas-divider"></div>

                    <h4 className="settings-section-title">Dados Restritos</h4>
                    <p className="settings-section-desc">Estas informações não podem ser alteradas diretamente.</p>
                    
                    <div className="saas-grid">
                      <div className="saas-form-group">
                        <label className="saas-label">CPF / Documento</label>
                        <input className="saas-input readonly" type="text" value={currentUser.cpf ? `***.${String(currentUser.cpf).replace(/\D/g, '').substring(3,6)}.***-${String(currentUser.cpf).replace(/\D/g, '').slice(-2)}` : '—'} disabled />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">{currentUser.role === 'MORADOR' ? 'Unidade' : 'Cargo / Categoria'}</label>
                        <input className="saas-input readonly" type="text" value={currentUser.unidade} disabled />
                      </div>
                    </div>

                  </div>
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

                    {!temSenha && (
                      <p className="settings-section-desc">Sua conta entra pelo Google e ainda não tem senha. Crie uma para também entrar com e-mail e senha.</p>
                    )}
                    <form onSubmit={handlePasswordSubmit}>
                      {temSenha && (
                      <div className="saas-form-group" style={{ maxWidth: '400px' }}>
                        <label className="saas-label">Senha Atual</label>
                        <input 
                          className="saas-input" type="password" placeholder="••••••••" required 
                          value={passForm.current} onChange={e=>setPassForm({...passForm, current: e.target.value})}
                        />
                      </div>
                      )}

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
                        <button type="submit" className="btn-saas-primary" disabled={salvandoSenha} style={{backgroundColor: roleVars.mainColor}}>
                          <Shield size={16} /> {salvandoSenha ? 'Salvando...' : temSenha ? 'Atualizar Senha' : 'Criar Senha'}
                        </button>
                      </div>
                    </form>

                    <ExcluirConta userId={currentUser?.id} />
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
