import React from 'react';
import {
  X, LayoutDashboard, FileEdit, FileWarning, Activity, ClipboardList, Building, BarChart, LogOut, Settings, Users, PenTool, Shield, UserPlus, Package, Clock, ShieldCheck, Map, MessageSquare, Calendar, Star, Vote, CheckSquare, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ContextBanner from './ContextBanner';

/* ─── Configuração dos contextos disponíveis para o Master ─── */
const CONTEXT_OPTIONS = [
  {
    key: 'MASTER',
    label: 'Master Admin',
    description: 'Governança Global',
    color: '#7c3aed',
    bgActive: 'rgba(124,58,237,0.12)',
    borderActive: 'rgba(124,58,237,0.4)',
  },
  {
    key: 'SINDICO',
    label: 'Síndico',
    description: 'Painel do Condomínio',
    color: '#4f46e5',
    bgActive: 'rgba(79,70,229,0.12)',
    borderActive: 'rgba(79,70,229,0.4)',
  },
  {
    key: 'FUNCIONARIO',
    label: 'Funcionário',
    description: 'Operações & Tarefas',
    color: '#16a34a',
    bgActive: 'rgba(22,163,74,0.12)',
    borderActive: 'rgba(22,163,74,0.4)',
  },
  {
    key: 'MORADOR',
    label: 'Morador',
    description: 'Bloco B, Apt 502',
    color: '#ea580c',
    bgActive: 'rgba(234,88,12,0.12)',
    borderActive: 'rgba(234,88,12,0.4)',
  },
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
          <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
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
              <nav className="nav-list" style={{ maxHeight: 'none', overflowY: 'visible' }}>
                <a href="#" className={`nav-item ${currentPath === '/painel' && (!location.search || location.search === '?tab=overview') ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=overview'); }}>
                  <LayoutDashboard className="nav-icon" /><span>Visão Geral</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=fluxo-ocorrencias' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=fluxo-ocorrencias'); }}>
                  <Activity className="nav-icon" /><span>Fluxo de Ocorrências</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=funcionarios' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=funcionarios'); }}>
                  <ShieldCheck className="nav-icon" /><span>Funcionários</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=moradores' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=moradores'); }}>
                  <Users className="nav-icon" /><span>Moradores</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=votacoes' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=votacoes'); }}>
                  <Vote className="nav-icon" /><span>Votações e Enquetes</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=agenda' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=agenda'); }}>
                  <Calendar className="nav-icon" /><span>Agenda</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=relatorio' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=relatorio'); }}>
                  <BarChart className="nav-icon" /><span>Relatório Mensal</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=prestadores' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=prestadores'); }}>
                  <Star className="nav-icon" /><span>Prestadores de Serviço</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=reservas' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=reservas'); }}>
                  <CheckSquare className="nav-icon" /><span>Reservas</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=mapa' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=mapa'); }}>
                  <Map className="nav-icon" /><span>Mapa de Ocorrências</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel' && location.search === '?tab=mensagens' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=mensagens'); }}>
                  <MessageSquare className="nav-icon" /><span>Mensagens</span>
                </a>
              </nav>
            </div>
          )}

          {/* SECTION: GOVERNANÇA GLOBAL (Master / Admin) */}
          {(visualContext === 'MASTER' || visualContext === 'ADMIN') && (
            <div className="nav-group">
              <p className="nav-section-title">Painel de Governança</p>
              <nav className="nav-list">
                <a href="#" className={`nav-item ${currentPath === '/painel-admin' && (!location.search || location.search === '?tab=overview') ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel-admin?tab=overview'); }}>
                  <LayoutDashboard className="nav-icon" /><span>Visão Geral do Sistema</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel-admin' && location.search === '?tab=usuarios' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel-admin?tab=usuarios'); }}>
                  <Users className="nav-icon" /><span>Gestão de Perfis & Acesso</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel-admin' && location.search === '?tab=estrutura' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel-admin?tab=estrutura'); }}>
                  <Building className="nav-icon" /><span>Estrutura de Condomínios</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel-admin' && location.search === '?tab=auditoria' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel-admin?tab=auditoria'); }}>
                  <Clock className="nav-icon" /><span>Auditoria & Relatórios</span>
                </a>
                <a href="#" className={`nav-item ${currentPath === '/painel-admin' && location.search === '?tab=parametros' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel-admin?tab=parametros'); }}>
                  <Settings className="nav-icon" /><span>Parâmetros Globais</span>
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
                {currentUser?.role === 'MASTER'
                  ? '● Master Admin'
                  : currentUser?.role === 'MORADOR'
                    ? `Morador ${currentUser?.unidade ? '• ' + currentUser.unidade : ''}`
                    : currentUser?.role}
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
