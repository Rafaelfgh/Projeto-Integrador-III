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
import './FeedOcorrencias.css';

const FeedOcorrencias = () => {
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
    },
    {
      id: 3,
      status: 'Em Análise',
      statusClass: 'badge-analise',
      category: 'Elevador',
      title: 'Elevador com porta travada',
      date: '22/02/2026',
      time: '20:15',
      location: 'Bloco A -Térreo',
      reporter: 'Morador 102'
    },
    {
      id: 4,
      status: 'Em Análise',
      statusClass: 'badge-analise',
      category: 'Portaria',
      title: 'Reconhecimento facial estragado',
      date: '12/02/2026',
      time: '07:50',
      location: 'Bloco C 9 andar',
      reporter: 'Morador 906'
    },
    {
      id: 5,
      status: 'Aberta',
      statusClass: 'badge-aberta',
      category: 'Estacionamento',
      title: 'Estacionamento irregular - Vaga 32B',
      date: '07/02/2026',
      time: '23:15',
      location: 'Bloco B -Estacionamento',
      reporter: 'Morador 102'
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
              <a href="#" className="nav-item nav-item-active" onClick={(e) => e.preventDefault()}>
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
              <h2 className="header-title">Feed de Ocorrências</h2>
              <p className="header-subtitle">Acompanhe as ocorrências do condomínio</p>
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
            <div className="feed-filters">
              <input 
                type="text" 
                className="search-input" 
                placeholder="Buscar Ocorrências..." 
              />
              <select className="filter-select" defaultValue="">
                <option value="" disabled>Status</option>
                <option value="todas">Todas</option>
                <option value="aberta">Aberta</option>
                <option value="resolvida">Resolvida</option>
                <option value="analise">Em Análise</option>
              </select>
              <select className="filter-select" defaultValue="">
                <option value="" disabled>Categoria</option>
                <option value="todas">Todas</option>
                <option value="hidraulica">Hidráulica</option>
                <option value="barulho">Barulho</option>
                <option value="elevador">Elevador</option>
              </select>
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

export default FeedOcorrencias;
