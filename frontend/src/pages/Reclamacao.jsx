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
  Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Ocorrencia.css';

const Reclamacao = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        {/* Logo Area */}
        <div className="sidebar-header">
          <span className="dashboard-pm-logo">
            PM
          </span>
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
              <a href="#" className="nav-item nav-item-active" onClick={(e) => e.preventDefault()}>
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
          <a href="#" className="nav-item nav-item-inactive" onClick={(e) => { e.preventDefault(); navigate('/perfil'); }} style={{ fontSize: '0.875rem' }}>
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
        <header className="main-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="header-title">Registrar Reclamação</h2>
              <p className="header-subtitle">Reportar uma reclamação ou violação</p>
            </div>
          </div>
          
          <div className="header-right">
            <button className="notification-btn">
              <Bell size={20} />
              <span className="notification-badge"></span>
            </button>
            <div className="user-avatar"></div>
          </div>
        </header>

        {/* Reclamacao Content */}
        <div className="dashboard-content-scroll">
          <div className="dashboard-content-inner">
            <div className="form-container">
              <div className="form-header">
                <h3 className="form-title">Detalhes da Reclamação</h3>
              </div>
              <form className="occurrence-form" onSubmit={(e) => { e.preventDefault(); alert('Reclamação registrada com sucesso!'); navigate('/dashboard'); }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Tipo de Violação</label>
                    <select required defaultValue="">
                      <option value="" disabled>Selecionar Tipo</option>
                      <option value="barulho">Barulho</option>
                      <option value="lixo">Descarte irregular de lixo</option>
                      <option value="estacionamento">Vaga de estacionamento</option>
                      <option value="pets">Problemas com Pets</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Unidade Envolvida</label>
                    <input type="text" placeholder="Ex:Unidade 204" />
                  </div>
                  <div className="form-group">
                    <label>Data</label>
                    <input type="date" required style={{ color: '#64748b' }} />
                  </div>
                  <div className="form-group">
                    <label>Horário</label>
                    <input type="time" required style={{ color: '#64748b' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descrição Detalhada</label>
                  <textarea rows="6" placeholder="Descreva a Reclamção com Detalhes" required></textarea>
                </div>
                
                <div className="form-group">
                  <label>Visibilidade</label>
                  <div className="visibility-options">
                    <label className="visibility-option" style={{ display: 'flex', alignItems: 'flex-start', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', width: 'fit-content', gap: '0.75rem' }}>
                      <input type="radio" name="visibilidade" value="sindico" defaultChecked style={{ marginTop: '0.125rem' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>Enviar apenas ao síndico</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>Somente o síndico terá acesso</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => navigate('/dashboard')}>Cancelar</button>
                  <button type="submit" className="btn-submit">Registrar Solicitação</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reclamacao;
