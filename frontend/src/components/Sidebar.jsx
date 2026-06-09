import React from 'react';
import {
  LayoutDashboard, FileEdit, FileWarning, Activity, ClipboardList, Building, BarChart, LogOut, Settings, Users, PenTool, Shield, UserPlus, Package, Clock, ShieldCheck, Map, MessageSquare, Calendar, Star, Vote, CheckSquare, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ContextBanner from './ContextBanner';

const CONTEXT_OPTIONS = [
  { key: 'MASTER', label: 'Master', description: 'Governança Global', color: '#7c3aed', bgActive: 'rgba(124,58,237,0.12)', borderActive: 'rgba(124,58,237,0.4)' },
  { key: 'SINDICO', label: 'Síndico', description: 'Painel do Condomínio', color: '#4f46e5', bgActive: 'rgba(79,70,229,0.12)', borderActive: 'rgba(79,70,229,0.4)' },
  { key: 'FUNCIONARIO', label: 'Funcionário', description: 'Operações & Tarefas', color: '#16a34a', bgActive: 'rgba(22,163,74,0.12)', borderActive: 'rgba(22,163,74,0.4)' },
  { key: 'MORADOR', label: 'Morador', description: 'Bloco B, Apt 502', color: '#ea580c', bgActive: 'rgba(234,88,12,0.12)', borderActive: 'rgba(234,88,12,0.4)' },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, visualContext } = useAuth();
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const navItem = (path, Icon, label, matchSearch = null) => {
    const isActive = matchSearch
      ? currentPath === path && location.search === matchSearch
      : matchSearch === null
        ? currentPath === path
        : currentPath === path && (!location.search || location.search === matchSearch);

    return (
      <a
        href="#"
        className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
        onClick={(e) => { e.preventDefault(); handleNavClick(path); }}
      >
        <Icon className="nav-icon" />
        <span>{label}</span>
      </a>
    );
  };

  return (
    <>
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

        {/* ── Header ── */}
        <div className="sidebar-header">
          <div className="sidebar-pm-logo-box">
            <span className="dashboard-pm-logo">PM</span>
          </div>
          <div className="sidebar-title-group">
            <h1>Portal do</h1>
            <p className="dashboard-pm-subtitle">Condomínio</p>
          </div>
        </div>

        {/* ── Nav ── */}
        <div className="sidebar-nav-container">

          {/* SECTION: WORKSPACE (Morador, Sindico) */}
          {(visualContext === 'MORADOR' || visualContext === 'SINDICO') && (
            <div className="nav-group">
              <p className="nav-section-title">Workspace</p>
              <nav className="nav-list">
                {navItem('/dashboard', LayoutDashboard, 'Visão Geral', '')}
                {navItem('/feed', Activity, 'Feed de Atividades')}
                {navItem('/solicitacoes', ClipboardList, 'Minhas Solicitações')}
              </nav>
            </div>
          )}

          {/* SECTION: SERVIÇOS (Morador, Sindico) */}
          {(visualContext === 'MORADOR' || visualContext === 'SINDICO') && (
            <div className="nav-group">
              <p className="nav-section-title">Serviços e Apoio</p>
              <nav className="nav-list">
                {navItem('/ocorrencia', FileEdit, 'Nova Ocorrência')}
                {navItem('/reclamacao', FileWarning, 'Nova Reclamação')}
              </nav>
            </div>
          )}

          {/* SECTION: OPERAÇÕES (Funcionario) */}
          {(visualContext === 'FUNCIONARIO' || visualContext === 'SINDICO') && (
            <div className="nav-group">
              <p className="nav-section-title">Operações</p>
              <nav className="nav-list">
                {navItem('/painel-funcionario', PenTool, 'Minhas Tarefas Técnicas')}
              </nav>
            </div>
          )}

          {/* SECTION: PAINEL DO SÍNDICO */}
          {visualContext === 'SINDICO' && (
            <div className="nav-group">
              <p className="nav-section-title">Painel do Síndico</p>
              <nav className="nav-list">
                <a href="#" className={`nav-item ${currentPath === '/painel' && (!location.search || location.search === '?tab=overview') ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=overview'); }}>
                  <LayoutDashboard className="nav-icon" /><span>Visão Geral</span>
                </a>
              </nav>
            </div>
          )}

          {/* SECTION: GOVERNANÇA GLOBAL (Master / Admin) */}
          {(visualContext === 'MASTER' || visualContext === 'ADMIN') && (
            <div className="nav-group">
              <p className="nav-section-title">Painel de Governança</p>
              <nav className="nav-list">
                <a href="#" className={`nav-item ${currentPath === '/painel-master' && (!location.search || location.search === '?tab=overview') ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel-master?tab=overview'); }}>
                  <LayoutDashboard className="nav-icon" /><span>Visão Geral do Condomínio</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel-master' && location.search === '?tab=usuarios' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel-master?tab=usuarios'); }}>
                  <Users className="nav-icon" /><span>Gestão de Moradores</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel-master' && location.search === '?tab=funcionarios' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel-master?tab=funcionarios'); }}>
                  <ShieldCheck className="nav-icon" /><span>Gestão de Funcionários</span>
                </a>
              </nav>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <div className="sidebar-avatar-mini">{currentUser?.name?.charAt(0) || 'U'}</div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{currentUser?.name || 'Usuário'}</span>
              <span className="sidebar-user-role">
                {currentUser?.role === 'MASTER' ? '● Master' :
                 currentUser?.role === 'SINDICO' ? '● Síndico' :
                 currentUser?.role === 'FUNCIONARIO' ? '● Funcionário' :
                 currentUser?.role === 'ADMIN' ? '● Admin' :
                 currentUser?.role === 'MORADOR' ? '● Morador' :
                 `● ${currentUser?.role || ''}`}
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
    </>
  );
};

export default Sidebar;