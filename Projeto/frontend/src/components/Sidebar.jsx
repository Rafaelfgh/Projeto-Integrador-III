import React from 'react';
import {
  LayoutDashboard, FileEdit, FileWarning, Activity, ClipboardList, Building, BarChart, LogOut, Settings, Users, PenTool, Shield, UserPlus, Package, Clock, ShieldCheck, Map, MessageSquare, Calendar, Star, Vote, CheckSquare, FileText, CheckCircle2, ChevronRight, Home, Hourglass, AlarmClock, Megaphone, ScanSearch, Mail, Layers, Menu, Plus
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useContadoresGestao } from '../hooks/useContadoresGestao';
import { useRecadosNaoLidos } from '../hooks/useRecadosNaoLidos';
import ContextBanner from './ContextBanner';
import AvatarUsuario from './AvatarUsuario';
import MarcaHabitare from './MarcaHabitare';
import AbrirOcorrenciaPorLink from './AbrirOcorrenciaPorLink';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, visualContext } = useAuth();
  const currentPath = location.pathname;
  const ehGestao = visualContext === 'SINDICO' || visualContext === 'MASTER';
  const contadores = useContadoresGestao(ehGestao);
  const recados = useRecadosNaoLidos(ehGestao || visualContext === 'FUNCIONARIO');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const navItem = (path, Icon, label, matchSearch = null, badge = 0) => {
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
        {badge > 0 && <span className="nav-badge" aria-label={`${badge} pendentes`}>{badge > 99 ? '99+' : badge}</span>}
      </a>
    );
  };

  // Barra inferior do celular: os destinos mais usados de cada perfil + "Menu" (abre o menu completo)
  const ITENS_INFERIOR = {
    MORADOR: [['/dashboard', LayoutDashboard, 'Início'], ['/feed', Activity, 'Mural'], ['/ocorrencia', Plus, 'Nova'], ['/solicitacoes', ClipboardList, 'Minhas']],
    SINDICO: [['/painel?tab=overview', LayoutDashboard, 'Painel'], ['/feed', Activity, 'Mural'], ['/ocorrencias-analise', ScanSearch, 'Análise', contadores.analise], ['/ocorrencias-pessoais', Home, 'Pessoais', contadores.pessoais]],
    FUNCIONARIO: [['/painel-funcionario', PenTool, 'Tarefas'], ['/recados', Mail, 'Recados', recados.total], ['/avisos', Megaphone, 'Avisos']],
    MASTER: [['/painel-master?tab=overview', LayoutDashboard, 'Visão'], ['/feed', Activity, 'Mural'], ['/painel-master?tab=usuarios', Users, 'Moradores', contadores.moradores_pendentes], ['/ocorrencias-analise', ScanSearch, 'Análise', contadores.analise]],
    DEV: [['/painel-dev', Building, 'Condomínios']],
  };
  const ativoInferior = (alvo) => {
    const [caminho, busca] = alvo.split('?');
    if (caminho !== currentPath) return false;
    if (!busca) return true;
    return location.search === `?${busca}` || (busca === 'tab=overview' && !location.search);
  };

  return (
    <>
      <AbrirOcorrenciaPorLink />
      <nav className="nav-inferior" aria-label="Navegação principal">
        {(ITENS_INFERIOR[visualContext] || []).map(([alvo, Icone, rotulo, n]) => (
          <button key={alvo} type="button" className={alvo === '/ocorrencia' ? 'nav-inferior-acao' : ativoInferior(alvo) ? 'ativo' : ''} aria-current={ativoInferior(alvo) ? 'page' : undefined} onClick={() => handleNavClick(alvo)}>
            <Icone />
            {rotulo}
            {n > 0 && <span className="nav-inferior-bolinha">{n > 99 ? '99+' : n}</span>}
          </button>
        ))}
        <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu completo">
          <Menu />
          Menu
        </button>
      </nav>
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

        {/* ── Header ── */}
        <div className="sidebar-header">
          <MarcaHabitare />
        </div>

        {/* ── Nav ── */}
        <div className="sidebar-nav-container">

          {/* SECTION: WORKSPACE (Morador, Sindico) */}
          {(visualContext === 'MORADOR' || visualContext === 'SINDICO') && (
            <div className="nav-group">
              <p className="nav-section-title">Workspace</p>
              <nav className="nav-list">
                {navItem('/dashboard', LayoutDashboard, 'Visão Geral', '')}
                {navItem('/feed', Activity, 'Mural de Ocorrências', '')}
                {navItem('/avisos', Megaphone, 'Mural de Avisos')}
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
          {visualContext === 'FUNCIONARIO' && (
            <div className="nav-group">
              <p className="nav-section-title">Operações</p>
              <nav className="nav-list">
                {navItem('/painel-funcionario', PenTool, 'Minhas Tarefas Técnicas')}
                {navItem('/recados', Mail, 'Recados', null, recados.total)}
                {navItem('/avisos', Megaphone, 'Mural de Avisos')}
              </nav>
            </div>
          )}

          {/* SECTION: PAINEL DO SÍNDICO */}
          {visualContext === 'SINDICO' && (
            <div className="nav-group">
              <p className="nav-section-title">Painel do Síndico</p>
              <nav className="nav-list">
                <a href="#" className={`nav-item ${currentPath === '/painel' && (!location.search || location.search === '?tab=overview') ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel?tab=overview'); }}>
                  <LayoutDashboard className="nav-icon" /><span>Dashboard Síndico</span>
                </a>
                {navItem('/ocorrencias-analise', ScanSearch, 'Ocorrências em análise', null, contadores.analise)}
                {navItem('/ocorrencias-pessoais', Home, 'Ocorrências Pessoais', null, contadores.pessoais)}
                {navItem('/abertas-prolongadas', AlarmClock, 'Abertas +2 dias', null, contadores.abertas_paradas)}
                {navItem('/andamento-prolongado', Hourglass, 'Em andamento +2 dias')}
                {navItem('/ocorrencias-concluidas', CheckCircle2, 'Ocorrências Concluídas')}
                {navItem('/funcionarios', ShieldCheck, 'Gestão de Funcionários')}
                {navItem('/recados', Mail, 'Recados', null, recados.total)}
              </nav>
            </div>
          )}

          {/* SECTION: EQUIPE HABITARE (Dev) */}
          {visualContext === 'DEV' && (
            <div className="nav-group">
              <p className="nav-section-title">Equipe Habitare</p>
              <nav className="nav-list">
                {navItem('/painel-dev', Building, 'Condomínios')}
              </nav>
            </div>
          )}

          {/* SECTION: GOVERNANÇA GLOBAL (Master) */}
          {visualContext === 'MASTER' && (
            <div className="nav-group">
              <p className="nav-section-title">Painel de Governança</p>
              <nav className="nav-list">
                <a href="#" className={`nav-item ${currentPath === '/painel-master' && (!location.search || location.search === '?tab=overview') ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel-master?tab=overview'); }}>
                  <LayoutDashboard className="nav-icon" /><span>Visão Geral do Condomínio</span>
                </a>
                {navItem('/feed', Activity, 'Mural de Ocorrências')}
                {navItem('/avisos', Megaphone, 'Mural de Avisos')}
                <a href="#" className={`nav-item ${currentPath === '/painel-master' && location.search === '?tab=usuarios' ? 'nav-item-active' : 'nav-item-inactive'}`} onClick={(e) => { e.preventDefault(); handleNavClick('/painel-master?tab=usuarios'); }}>
                  <Users className="nav-icon" /><span>Gestão de Moradores</span>
                  {contadores.moradores_pendentes > 0 && (
                    <span className="nav-badge" aria-label={`${contadores.moradores_pendentes} moradores pendentes`}>
                      {contadores.moradores_pendentes > 99 ? '99+' : contadores.moradores_pendentes}
                    </span>
                  )}
                </a>
                {navItem('/funcionarios', ShieldCheck, 'Gestão de Funcionários')}
                {navItem('/blocos', Layers, 'Blocos do Condomínio')}
                {navItem('/recados', Mail, 'Recados', null, recados.total)}
                {navItem('/ocorrencias-analise', ScanSearch, 'Ocorrências em análise', null, contadores.analise)}
                {navItem('/ocorrencias-pessoais', Home, 'Ocorrências Pessoais', null, contadores.pessoais)}
                {navItem('/abertas-prolongadas', AlarmClock, 'Abertas +2 dias', null, contadores.abertas_paradas)}
                {navItem('/andamento-prolongado', Hourglass, 'Em andamento +2 dias')}
                {navItem('/ocorrencias-concluidas', CheckCircle2, 'Ocorrências Concluídas')}
              </nav>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <AvatarUsuario className="sidebar-avatar-mini" nome={currentUser?.name} foto={currentUser?.foto} />
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{currentUser?.name || 'Usuário'}</span>
              <span className="sidebar-user-role">
                {currentUser?.role === 'DEV' ? '● Equipe Habitare' :
                 currentUser?.role === 'MASTER' ? '● Master' :
                 currentUser?.role === 'SINDICO' ? '● Síndico' :
                 currentUser?.role === 'FUNCIONARIO' ? '● Funcionário' :
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