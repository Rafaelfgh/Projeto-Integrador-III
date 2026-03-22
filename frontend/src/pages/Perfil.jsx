import React, { useState } from 'react';
import { 
  FileText,
  Settings,
  Bell,
  LogOut,
  User,
  Menu,
  X,
  LayoutDashboard,
  FileEdit,
  FileWarning,
  ClipboardList,
  Building,
  Camera,
  Shield,
  Mail,
  MapPin,
  Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Perfil.css';

const Perfil = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const navigate = useNavigate();

  return (
    <div className="dashboard-layout">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
      >
        <div className="sidebar-header">
          <span className="dashboard-pm-logo">PM</span>
          <div className="sidebar-title-group">
            <h1>Portal do</h1>
            <p className="dashboard-pm-subtitle">Morador</p>
          </div>
          <button 
            className="mobile-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav-container">
          <div>
            <p className="nav-section-title">Navegação</p>
            <nav className="nav-list">
              <a href="#" className="nav-item nav-item-inactive" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
                <LayoutDashboard className="nav-icon" />
                <span>Dashboard</span>
              </a>
              <a href="#" className="nav-item nav-item-inactive" onClick={(e) => { e.preventDefault(); navigate('/ocorrencia'); }}>
                <FileEdit className="nav-icon" />
                <span>Registrar Ocorrência</span>
              </a>
              <a href="#" className="nav-item nav-item-inactive" onClick={(e) => { e.preventDefault(); navigate('/reclamacao'); }}>
                <FileWarning className="nav-icon" />
                <span>Registrar Reclamação</span>
              </a>
              <a href="#" className="nav-item nav-item-inactive" onClick={(e) => { e.preventDefault(); navigate('/feed'); }}>
                <FileText className="nav-icon" />
                <span>Feed de Ocorrências</span>
              </a>
              <a href="#" className="nav-item nav-item-inactive" onClick={(e) => { e.preventDefault(); navigate('/solicitacoes'); }}>
                <ClipboardList className="nav-icon" />
                <span>Minhas Solicitações</span>
              </a>
            </nav>
          </div>

          <div>
            <p className="nav-section-title">Administração</p>
            <nav className="nav-list">
              <a href="#" className="nav-item nav-item-inactive" onClick={(e) => { e.preventDefault(); navigate('/painel'); }}>
                <Building className="nav-icon" />
                <span>Painel do Síndico</span>
              </a>
            </nav>
          </div>
        </div>

        {/* User Footer */}
        <div className="sidebar-footer">
          <a href="#" className="nav-item nav-item-active" onClick={(e) => e.preventDefault()} style={{ fontSize: '0.875rem' }}>
            <User className="nav-icon" />
            <span>Perfil</span>
          </a>
          <a href="/login" className="nav-item nav-item-logout" style={{ fontSize: '0.875rem' }}>
            <LogOut className="nav-icon" />
            <span>Sair</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="header-title">Configurações</h2>
              <p className="header-subtitle">Gerencie suas escolhas e dados pessoais</p>
            </div>
          </div>
          
          <div className="header-right">
            <button className="notification-btn">
              <Bell size={20} />
              <span className="notification-badge"></span>
            </button>
          </div>
        </header>

        {/* Perfil Content */}
        <div className="dashboard-content-scroll" style={{ backgroundColor: '#f8fafc' }}>
          <div className="perfil-page-container">
            
            {/* SaaS Banner Profile Card */}
            <div className="perfil-hero-card">
              <div className="perfil-banner">
                <div className="perfil-avatar-wrapper">
                  <div className="perfil-avatar-circle">
                    <div className="perfil-avatar-inner">JM</div>
                    <div className="perfil-avatar-badge">
                      <Camera size={14} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="perfil-hero-info">
                <div className="perfil-user-meta">
                  <h3 className="perfil-user-name">João Morador</h3>
                  <span className="perfil-user-role">
                    <MapPin size={14} /> Bloco B, Apartamento 502 <span className="perfil-user-status">Ativo</span>
                  </span>
                </div>
              </div>
            </div>

            {/* SaaS Settings Content Grid */}
            <div className="saas-settings-layout">
              {/* Sidebar Tabs */}
              <div className="settings-sidebar">
                <button 
                  className={`settings-tab ${activeTab === 'geral' ? 'active' : ''}`}
                  onClick={() => setActiveTab('geral')}
                >
                  <User size={18} /> Geral
                </button>
                <button 
                  className={`settings-tab ${activeTab === 'seguranca' ? 'active' : ''}`}
                  onClick={() => setActiveTab('seguranca')}
                >
                  <Shield size={18} /> Segurança
                </button>
                <button 
                  className={`settings-tab ${activeTab === 'notificacoes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notificacoes')}
                >
                  <Bell size={18} /> Notificações
                </button>
              </div>

              {/* Body Content */}
              <div className="settings-body">
                {activeTab === 'geral' && (
                  <form onSubmit={(e) => { e.preventDefault(); alert('Perfil atualizado!'); }}>
                    <h4 className="settings-section-title">Informações Pessoais</h4>
                    <p className="settings-section-desc">Atualize seus dados pessoais para contato e identificação no mural.</p>
                    
                    <div className="saas-grid">
                      <div className="saas-form-group">
                        <label className="saas-label">Nome Completo</label>
                        <input className="saas-input" type="text" defaultValue="João Morador" required />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">Endereço de E-mail</label>
                        <input className="saas-input" type="email" defaultValue="joao.morador@exemplo.com" required />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">CPF</label>
                        <input className="saas-input" type="text" defaultValue="123.456.789-00" disabled />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">Número de Telefone</label>
                        <input className="saas-input" type="text" defaultValue="(11) 98765-4321" required />
                      </div>
                    </div>

                    <div className="saas-divider"></div>

                    <h4 className="settings-section-title">Dados da Unidade</h4>
                    <p className="settings-section-desc">Seus dados de residência. Contate a administração para mudanças.</p>
                    
                    <div className="saas-grid">
                      <div className="saas-form-group">
                        <label className="saas-label">Bloco</label>
                        <input className="saas-input" type="text" defaultValue="Bloco B" disabled />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">Apartamento</label>
                        <input className="saas-input" type="text" defaultValue="502" disabled />
                      </div>
                    </div>

                    <div className="saas-form-actions">
                      <button type="submit" className="btn-saas-primary">
                        <Save size={16} /> Salvar Alterações
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'seguranca' && (
                  <form onSubmit={(e) => { e.preventDefault(); alert('Senha alterada com sucesso!'); }}>
                    <h4 className="settings-section-title">Senha de Acesso</h4>
                    <p className="settings-section-desc">Garanta que sua conta está usando uma senha longa e segura.</p>
                    
                    <div className="saas-form-group" style={{ maxWidth: '400px' }}>
                      <label className="saas-label">Senha Atual</label>
                      <input className="saas-input" type="password" placeholder="••••••••" required />
                    </div>

                    <div className="saas-divider"></div>

                    <div className="saas-grid">
                      <div className="saas-form-group">
                        <label className="saas-label">Nova Senha</label>
                        <input className="saas-input" type="password" placeholder="Mínimo de 8 caracteres" required />
                      </div>
                      <div className="saas-form-group">
                        <label className="saas-label">Confirmar Nova Senha</label>
                        <input className="saas-input" type="password" placeholder="Repita a nova senha" required />
                      </div>
                    </div>

                    <div className="saas-form-actions">
                      <button type="submit" className="btn-saas-primary">
                        <Shield size={16} /> Atualizar Senha
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'notificacoes' && (
                  <div>
                    <h4 className="settings-section-title">Preferências de Contato</h4>
                    <p className="settings-section-desc">Escolha como você quer ser avisado pelo sistema do condomínio.</p>
                    
                    <div className="saas-toggle-list">
                      <div className="saas-toggle-row">
                        <div className="saas-toggle-info">
                          <strong>Notificações por Email</strong>
                          <span>Receba um email a cada nova ocorrência ou aviso importante.</span>
                        </div>
                        <label className="saas-switch">
                          <input type="checkbox" defaultChecked />
                          <span className="saas-slider"></span>
                        </label>
                      </div>

                      <div className="saas-toggle-row">
                        <div className="saas-toggle-info">
                          <strong>Notificações Push</strong>
                          <span>Seja avisado no navegador quando estiver usando a plataforma.</span>
                        </div>
                        <label className="saas-switch">
                          <input type="checkbox" />
                          <span className="saas-slider"></span>
                        </label>
                      </div>

                      <div className="saas-toggle-row">
                        <div className="saas-toggle-info">
                          <strong>Atualizações Mensais</strong>
                          <span>Receba o boletim da administração do fechamento do mês.</span>
                        </div>
                        <label className="saas-switch">
                          <input type="checkbox" defaultChecked />
                          <span className="saas-slider"></span>
                        </label>
                      </div>
                    </div>

                    <div className="saas-form-actions">
                      <button className="btn-saas-primary">
                        <Mail size={16} /> Salvar Preferências
                      </button>
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
