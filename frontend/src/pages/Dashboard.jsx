import React, { useState } from 'react';
import { 
  FileText,
  Settings,
  Bell,
  LogOut,
  User,
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  FileEdit,
  FileWarning,
  Activity,
  ClipboardList,
  Building,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    { title: 'Ocorrências Abertas', value: '12', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
    { title: 'Em Análise', value: '5', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Resolvidas', value: '28', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  const recentActivities = [
    { 
      id: 1, 
      title: 'Vazamento no Bloco A, 3º andar',
      type: 'Ocorrência',
      time: '2h atrás',
      status: 'Aberto',
      statusColor: 'status-rose'
    },
    { 
      id: 2, 
      title: 'Barulho excessivo - Unidade 204',
      type: 'Reclamação',
      time: '4h atrás',
      status: 'Em Análise',
      statusColor: 'status-amber'
    },
    { 
      id: 3, 
      title: 'Elevador com defeito - Bloco B',
      type: 'Ocorrência',
      time: '1d atrás',
      status: 'Resolvida',
      statusColor: 'status-emerald'
    },
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
              <a href="#" className="nav-item nav-item-active">
                <LayoutDashboard className="nav-icon" />
                <span>Dashboard</span>
              </a>
              <a href="#" className="nav-item nav-item-inactive">
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
              <h2 className="header-title">Dashboard</h2>
              <p className="header-subtitle">Bem-vindo de volta, Morador</p>
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

        {/* Dashboard Content */}
        <div className="dashboard-content-scroll">
          <div className="dashboard-content-inner">
            
            {/* Stats Grid */}
            <div className="stats-grid">
              {stats.map((stat, idx) => (
                <div key={idx} className="stat-card">
                  <div className="stat-card-inner">
                    <div>
                      <div className="stat-value">{stat.value}</div>
                      <div className="stat-title">{stat.title}</div>
                    </div>
                    <div className={`stat-icon-wrapper ${stat.bg}`}>
                      <stat.icon className={`${stat.color}`} size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-grid">
              {/* Ocorrência Card */}
              <a href="#" className="quick-action-card qa-orange-card">
                <div className="quick-action-left">
                  <div className="quick-action-icon-box qa-orange-box">
                    <FileEdit size={24} />
                  </div>
                  <div>
                    <h3 className="quick-action-title">Registrar Ocorrência</h3>
                    <p className="quick-action-subtitle">Abrir uma Nova Ocorrência</p>
                  </div>
                </div>
                <div className="quick-action-arrow">
                  <ArrowRight size={20} />
                </div>
              </a>

              {/* Reclamação Card */}
              <a href="#" className="quick-action-card qa-amber-card">
                <div className="quick-action-left">
                  <div className="quick-action-icon-box qa-amber-box">
                    <FileWarning size={24} />
                  </div>
                  <div>
                    <h3 className="quick-action-title">Registrar Reclamação</h3>
                    <p className="quick-action-subtitle">Reportar uma Reclamação ou Violação</p>
                  </div>
                </div>
                <div className="quick-action-arrow">
                  <ArrowRight size={20} />
                </div>
              </a>
            </div>

            {/* Recent Activities */}
            <div className="recent-activities-section">
              <div className="recent-activities-header">
                <h3 className="recent-activities-title">Atividades Recentes</h3>
                <a href="#" className="recent-activities-link">
                  Ver tudo <ArrowRight size={16} />
                </a>
              </div>
              <div className="recent-activities-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-info">
                      <div className="activity-dot-wrapper">
                        <div className="activity-dot"></div>
                      </div>
                      <div>
                        <p className="activity-name">{activity.title}</p>
                        <div className="activity-meta">
                          <span className="activity-type">{activity.type}</span>
                          <span className="activity-separator"></span>
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`activity-status-badge ${activity.statusColor}`}>
                      {activity.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
