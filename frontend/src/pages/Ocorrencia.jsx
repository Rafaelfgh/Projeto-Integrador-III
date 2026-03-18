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

const Ocorrencia = () => {
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
              <a href="#" className="nav-item nav-item-active" onClick={(e) => e.preventDefault()}>
                <FileEdit className="nav-icon" />
                <span>Registrar Ocorrência</span>
              </a>
              <a href="#" className="nav-item nav-item-inactive">
                <FileWarning className="nav-icon" />
                <span>Registrar Reclamação</span>
              </a>
              <a href="#" className="nav-item nav-item-inactive">
                <FileText className="nav-icon" />
                <span>Feed de Ocorrências</span>
              </a>
              <a href="#" className="nav-item nav-item-inactive">
                <ClipboardList className="nav-icon" />
                <span>Minhas Solicitações</span>
              </a>
            </nav>
          </div>

          <div>
            <p className="nav-section-title">Administração</p>
            <nav className="nav-list">
              <a href="#" className="nav-item nav-item-inactive">
                <Building className="nav-icon" />
                <span>Painel do Síndico</span>
              </a>
            </nav>
          </div>
        </div>

        {/* User Footer */}
        <div className="sidebar-footer">
          <a href="#" className="nav-item nav-item-inactive" style={{ fontSize: '0.875rem' }}>
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
              <h2 className="header-title">Registrar Ocorrência</h2>
              <p className="header-subtitle">Nova Ocorrência</p>
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

        {/* Ocorrencia Content */}
        <div className="dashboard-content-scroll">
          <div className="dashboard-content-inner">
            <div className="form-container">
              <div className="form-header">
                <h3 className="form-title">Registrar Ocorrência</h3>
                <p className="form-subtitle">Preencha os detalhes abaixo para registrar uma nova ocorrência no condomínio.</p>
              </div>
              <form className="occurrence-form" onSubmit={(e) => { e.preventDefault(); alert('Ocorrência registrada com sucesso!'); navigate('/dashboard'); }}>
                <div className="form-group">
                  <label>Título da Ocorrência *</label>
                  <input type="text" placeholder="Ex: Lâmpada queimada no corredor" required />
                </div>
                <div className="form-group">
                  <label>Categoria *</label>
                  <select required>
                    <option value="">Selecione uma categoria</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="limpeza">Limpeza</option>
                    <option value="seguranca">Segurança</option>
                    <option value="barulho">Barulho</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Local / Bloco e Apartamento</label>
                  <input type="text" placeholder="Ex: Bloco B, Corredor 3º andar" />
                </div>
                <div className="form-group">
                  <label>Descrição Detalhada *</label>
                  <textarea rows="4" placeholder="Descreva o que aconteceu..." required></textarea>
                </div>
                <div className="form-group">
                  <label>Visibilidade *</label>
                  <div className="visibility-options">
                    <label className="visibility-option">
                      <input type="radio" name="visibilidade" value="sindico" defaultChecked />
                      <span>Enviar apenas ao síndico</span>
                    </label>
                    <label className="visibility-option">
                      <input type="radio" name="visibilidade" value="mural" />
                      <span>Tornar visível no mural</span>
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

export default Ocorrencia;
