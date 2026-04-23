import React from 'react';
import { 
  X, LayoutDashboard, FileEdit, FileWarning, Activity, ClipboardList, Building, BarChart, LogOut, Settings, Users, PenTool, Shield, UserPlus, Package, Clock, ShieldCheck, Map, MessageSquare, Calendar, Star, Vote, CheckSquare, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ContextBanner from './ContextBanner';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, visualContext, changeVisualContext } = useAuth();
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <ContextBanner />
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-pm-logo-box">
             <span className="dashboard-pm-logo">PM</span>
          </div>
          <div className="sidebar-title-group">
            <h1>Portal do</h1>
            <p className="dashboard-pm-subtitle">Condomínio</p>
          </div>
          <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        {/* MASTER CONTEXT SELECTOR */}
        {currentUser?.role === 'MASTER' && (
          <div style={{ padding: '0 1rem 1rem 1rem', borderBottom: '1px solid #334155', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              Visualizando como:
            </p>
            <select 
              value={visualContext} 
              onChange={(e) => changeVisualContext(e.target.value)}
              style={{
                width: '100%', background: '#0f172a', color: 'white', border: '1px solid #475569',
                padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', outline: 'none'
              }}
            >
              <option value="MASTER">Master Admin (Real)</option>
              <option value="SINDICO">Síndico</option>
              <option value="FUNCIONARIO">Funcionário</option>
              <option value="MORADOR">Morador</option>
            </select>
          </div>
        )}

        <div className="sidebar-nav-container">
          
          {/* SECTION: WORKSPACE (Morador, Sindico) */}
          {(visualContext === 'MORADOR' || visualContext === 'SINDICO') && (
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
          {(visualContext === 'MORADOR' || visualContext === 'SINDICO') && (
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



          {/* SECTION: OPERAÇÕES (Funcionario) */}
          {(visualContext === 'FUNCIONARIO' || visualContext === 'SINDICO') && (
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
          {(visualContext === 'SINDICO') && (
          <div className="nav-group">
            <p className="nav-section-title">Painel do Síndico</p>
            <nav className="nav-list" style={{ maxHeight: 'none', overflowY: 'visible' }}>
                <a href="#" className={`nav-item ${currentPath === '/painel' && (!location.search || location.search === '?tab=overview') ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel?tab=overview'); setSidebarOpen(false); }}>
                  <LayoutDashboard className="nav-icon" />
                  <span>Visão Geral</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=fluxo-ocorrencias' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel?tab=fluxo-ocorrencias'); setSidebarOpen(false); }}>
                  <Activity className="nav-icon" />
                  <span>Fluxo de Ocorrências</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=funcionarios' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel?tab=funcionarios'); setSidebarOpen(false); }}>
                  <ShieldCheck className="nav-icon" />
                  <span>Funcionários</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=moradores' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel?tab=moradores'); setSidebarOpen(false); }}>
                  <Users className="nav-icon" />
                  <span>Moradores</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=votacoes' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel?tab=votacoes'); setSidebarOpen(false); }}>
                  <Vote className="nav-icon" />
                  <span>Votações e Enquetes</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=agenda' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel?tab=agenda'); setSidebarOpen(false); }}>
                  <Calendar className="nav-icon" />
                  <span>Agenda</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=relatorio' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel?tab=relatorio'); setSidebarOpen(false); }}>
                  <BarChart className="nav-icon" />
                  <span>Relatório Mensal</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=prestadores' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel?tab=prestadores'); setSidebarOpen(false); }}>
                  <Star className="nav-icon" />
                  <span>Prestadores de Serviço</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=reservas' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel?tab=reservas'); setSidebarOpen(false); }}>
                  <CheckSquare className="nav-icon" />
                  <span>Reservas</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=mapa' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel?tab=mapa'); setSidebarOpen(false); }}>
                  <Map className="nav-icon" />
                  <span>Mapa de Ocorrências</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=mensagens' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); navigate('/painel?tab=mensagens'); setSidebarOpen(false); }}>
                  <MessageSquare className="nav-icon" />
                  <span>Mensagens</span>
                </a>
            </nav>
          </div>
        )}

        {/* SECTION: GOVERNANÇA GLOBAL (Apenas Master) */}
        {(visualContext === 'MASTER' || visualContext === 'ADMIN') && (
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
                {currentUser?.role === 'MORADOR' ? `Morador ${currentUser?.unidade ? '• ' + currentUser.unidade : ''}` : currentUser?.role}
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
