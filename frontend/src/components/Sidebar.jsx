import React from 'react';
import { 
  X, 
  LayoutDashboard, 
  FileEdit, 
  FileWarning, 
  Activity, 
  ClipboardList, 
  Building,
  Settings,
  LogOut,
  Users
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-pm-logo-box">
           <span className="dashboard-pm-logo">PM</span>
        </div>
        <div className="sidebar-title-group">
          <h1>Portal do</h1>
          <p className="dashboard-pm-subtitle">Morador</p>
        </div>
        <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-nav-container">
        <div className="nav-group">
          <p className="nav-section-title">Menu Principal</p>
          <nav className="nav-list">
            <a href="#" className={`nav-item ${currentPath === '/dashboard' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/dashboard'); setSidebarOpen(false); }}>
              <LayoutDashboard className="nav-icon" />
              <span>Dashboard</span>
            </a>
            <a href="#" className={`nav-item ${currentPath === '/ocorrencia' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/ocorrencia'); setSidebarOpen(false); }}>
              <FileEdit className="nav-icon" />
              <span>Nova Ocorrência</span>
            </a>
            <a href="#" className={`nav-item ${currentPath === '/reclamacao' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/reclamacao'); setSidebarOpen(false); }}>
              <FileWarning className="nav-icon" />
              <span>Nova Reclamação</span>
            </a>
            <a href="#" className={`nav-item ${currentPath === '/feed' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/feed'); setSidebarOpen(false); }}>
              <Activity className="nav-icon" />
              <span>Feed de Atividades</span>
            </a>
            <a href="#" className={`nav-item ${currentPath === '/solicitacoes' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/solicitacoes'); setSidebarOpen(false); }}>
              <ClipboardList className="nav-icon" />
              <span>Minhas Solicitações</span>
            </a>
          </nav>
        </div>

        <div className="nav-group">
          <p className="nav-section-title">Administrativo</p>
          <nav className="nav-list">
            <a href="#" className={`nav-item ${currentPath === '/painel' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel'); setSidebarOpen(false); }}>
              <Building className="nav-icon" />
              <span>Painel do Síndico</span>
            </a>
            <a href="#" className={`nav-item ${currentPath === '/gerenciamento-usuarios' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/gerenciamento-usuarios'); setSidebarOpen(false); }}>
              <Users className="nav-icon" />
              <span>Gerenciar Usuários</span>
            </a>
          </nav>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-info">
           <div className="sidebar-avatar-mini">M</div>
           <div className="sidebar-user-details">
              <span className="sidebar-user-name">João Marcos</span>
              <span className="sidebar-user-role">Morador • Apto 102</span>
           </div>
        </div>
        <div className="sidebar-footer-actions">
           <button className="sidebar-icon-btn" onClick={() => navigate('/perfil')} title="Configurações">
             <Settings size={18} />
           </button>
           <button className="sidebar-icon-btn text-rose" onClick={() => navigate('/login')} title="Sair">
             <LogOut size={18} />
           </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
