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
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './FeedOcorrencias.css';

const MinhasSolicitacoes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const occurrences = [
    {
      id: 1,
      status: 'Aberta',
      statusClass: 'badge-aberta',
      category: 'Hidráulica',
      title: 'Vazamento no corredor do 3º andar',
      date: '04/03/2026',
      time: '09:15',
      location: 'Bloco A 3º andar',
      reporter: 'Morador 301'
    },
    {
      id: 2,
      status: 'Resolvida',
      statusClass: 'badge-resolvida',
      category: 'Barulho',
      title: 'Barulho excessivo após as 22h',
      date: '03/03/2026',
      time: '22:37',
      location: 'Bloco B 5º andar',
      reporter: 'Morador 501'
    }
  ];

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
              <a href="#" className="nav-item nav-item-active" onClick={(e) => e.preventDefault()}>
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
              <h2 className="header-title">Minhas Solicitações</h2>
              <p className="header-subtitle">Acompanhe suas solicitações enviadas</p>
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

        {/* Feed Content */}
        <div className="dashboard-content-scroll">
          <div className="dashboard-content-inner">
            
            {/* Filters */}
            <div className="feed-filters" style={{ justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Buscar Solicitações" 
                  style={{ width: '100%', paddingLeft: '2.5rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* List */}
            <div className="feed-list">
              {occurrences.map((occ) => (
                <div key={occ.id} className="feed-card">
                  <div className="feed-card-header">
                    <span className={`feed-badge ${occ.statusClass}`}>{occ.status}</span>
                    <span className="feed-badge badge-category">{occ.category}</span>
                  </div>
                  <h3 className="feed-title">{occ.title}</h3>
                  <div className="feed-meta">
                    <span>{occ.date}</span>
                    <span className="meta-dot">•</span>
                    <span>{occ.time}</span>
                    <span className="meta-dot">•</span>
                    <span>{occ.location}</span>
                    <span className="meta-dot">•</span>
                    <span>{occ.reporter}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default MinhasSolicitacoes;
