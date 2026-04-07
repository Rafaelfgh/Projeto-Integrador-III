import React from 'react';
import { 
  X, 
  LayoutDashboard, 
  FileEdit, 
  FileWarning, 
  Activity, 
  ClipboardList, 
  Building,
  BarChart,
  LogOut,
  Settings,
  Users,
  PenTool,
  Shield,
  UserPlus,
  Package,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        
        {/* SECTION: WORKSPACE (Morador, Sindico) */}
        {(currentUser?.role === 'MORADOR' || currentUser?.role === 'SINDICO') && (
          <div className="nav-group">
            <p className="nav-section-title">Workspace</p>
            <nav className="nav-list">
              <a href="#" className={`nav-item ${currentPath === '/dashboard' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/dashboard'); setSidebarOpen(false); }}>
                <LayoutDashboard className="nav-icon" />
                <span>Visão Geral</span>
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
        )}

        {/* SECTION: SERVIÇOS (Morador, Sindico) */}
        {(currentUser?.role === 'MORADOR' || currentUser?.role === 'SINDICO') && (
          <div className="nav-group">
            <p className="nav-section-title">Serviços e Apoio</p>
            <nav className="nav-list">
              <a href="#" className={`nav-item ${currentPath === '/ocorrencia' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/ocorrencia'); setSidebarOpen(false); }}>
                <FileEdit className="nav-icon" />
                <span>Nova Ocorrência</span>
              </a>
              <a href="#" className={`nav-item ${currentPath === '/reclamacao' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/reclamacao'); setSidebarOpen(false); }}>
                <FileWarning className="nav-icon" />
                <span>Nova Reclamação</span>
              </a>
            </nav>
          </div>
        )}

        {/* SECTION: PORTARIA COMPLETA (Apenas Porteiro) */}
        {(currentUser?.role === 'PORTEIRO') && (
           <div className="nav-group">
            <p className="nav-section-title">Painel da Portaria</p>
            <nav className="nav-list">
              <a href="#" className={`nav-item ${currentPath === '/painel-portaria' && !location.search ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel-portaria'); setSidebarOpen(false); }}>
                  <LayoutDashboard className="nav-icon" />
                  <span>Visão Geral</span>
              </a>
              <a href="#" className={`nav-item ${location.search === '?tab=visitantes' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel-portaria?tab=visitantes'); setSidebarOpen(false); }}>
                  <Users className="nav-icon" />
                  <span>Visitantes</span>
              </a>
              <a href="#" className={`nav-item ${location.search === '?tab=encomendas' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel-portaria?tab=encomendas'); setSidebarOpen(false); }}>
                  <Package className="nav-icon" />
                  <span>Encomendas</span>
              </a>
              <a href="#" className={`nav-item ${location.search === '?tab=autorizados' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel-portaria?tab=autorizados'); setSidebarOpen(false); }}>
                  <ShieldCheck className="nav-icon" />
                  <span>Autorizados</span>
              </a>
              <a href="#" className={`nav-item ${location.search === '?tab=historico' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel-portaria?tab=historico'); setSidebarOpen(false); }}>
                  <Clock className="nav-icon" />
                  <span>Histórico Geral</span>
              </a>
            </nav>
          </div>
        )}

        {/* SECTION: OPERAÇÕES (Funcionario) */}
        {(currentUser?.role === 'FUNCIONARIO') && (
           <div className="nav-group">
            <p className="nav-section-title">Operações</p>
            <nav className="nav-list">
                <a href="#" className={`nav-item ${currentPath === '/painel-funcionario' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel-funcionario'); setSidebarOpen(false); }}>
                  <PenTool className="nav-icon" />
                  <span>Minhas Tarefas Técnicas</span>
                </a>
            </nav>
          </div>
        )}

        {/* SECTION: ADMINISTRAÇÃO (Sindico) */}
        {(currentUser?.role === 'SINDICO') && (
          <div className="nav-group">
            <p className="nav-section-title">Administração</p>
            <nav className="nav-list">
                <a href="#" className={`nav-item ${currentPath === '/painel' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel'); setSidebarOpen(false); }}>
                  <Building className="nav-icon" />
                  <span>Visão Geral do Condomínio</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel-funcionario' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel-funcionario'); setSidebarOpen(false); }}>
                  <PenTool className="nav-icon" />
                  <span>Gestão de Manutenção</span>
                </a>
            </nav>
          </div>
        )}

        {/* SECTION: GOVERNANÇA GLOBAL (Apenas Admin) */}
        {(currentUser?.role === 'ADMIN') && (
          <div className="nav-group">
            <p className="nav-section-title">Painel de Governança</p>
            <nav className="nav-list">
              <a href="#" className={`nav-item ${currentPath === '/painel-admin' && (!location.search || location.search === '?tab=overview') ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel-admin?tab=overview'); setSidebarOpen(false); }}>
                  <LayoutDashboard className="nav-icon" />
                  <span>Visão Geral do Sistema</span>
              </a>
              <a href="#" className={`nav-item ${currentPath === '/painel-admin' && location.search === '?tab=usuarios' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel-admin?tab=usuarios'); setSidebarOpen(false); }}>
                  <Users className="nav-icon" />
                  <span>Gestão de Perfis & Acesso</span>
              </a>
              <a href="#" className={`nav-item ${currentPath === '/painel-admin' && location.search === '?tab=estrutura' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel-admin?tab=estrutura'); setSidebarOpen(false); }}>
                  <Building className="nav-icon" />
                  <span>Estrutura de Condomínios</span>
              </a>
              <a href="#" className={`nav-item ${currentPath === '/painel-admin' && location.search === '?tab=auditoria' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel-admin?tab=auditoria'); setSidebarOpen(false); }}>
                  <Clock className="nav-icon" />
                  <span>Auditoria & Relatórios</span>
              </a>
              <a href="#" className={`nav-item ${currentPath === '/painel-admin' && location.search === '?tab=parametros' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel-admin?tab=parametros'); setSidebarOpen(false); }}>
                  <Settings className="nav-icon" />
                  <span>Parâmetros Globais</span>
              </a>
            </nav>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-info">
           <div className="sidebar-avatar-mini">{currentUser?.name?.charAt(0) || 'U'}</div>
           <div className="sidebar-user-details">
              <span className="sidebar-user-name">{currentUser?.name || 'Usuário'}</span>
              <span className="sidebar-user-role">
                {currentUser?.role === 'MORADOR' ? `Morador ${currentUser?.apto ? '• Apto ' + currentUser.apto : ''}` : currentUser?.role}
              </span>
           </div>
        </div>
        <div className="sidebar-footer-actions">
           <button className="sidebar-icon-btn" onClick={() => navigate('/perfil')} title="Configurações">
             <Settings size={18} />
           </button>
           <button className="sidebar-icon-btn text-rose" onClick={handleLogout} title="Sair">
             <LogOut size={18} />
           </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
