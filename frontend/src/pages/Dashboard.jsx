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
  CheckCircle2,
  Search,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationMenu from '../components/NotificationMenu';
import Sidebar from '../components/Sidebar';
import ContextBanner from '../components/ContextBanner';
import './Dashboard.css';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // SaaS-style stats com mini sparklines
  const stats = [
    { 
      title: 'Ocorrências Abertas', 
      value: '12', 
      icon: AlertCircle, 
      color: 'text-rose-500', 
      bg: 'bg-rose-50',
      trend: '+2 este mês',
      trendIcon: TrendingUp,
      trendColor: 'text-rose-500',
      sparkline: 'M0,25 C10,24 20,20 30,22 C40,15 50,25 60,18 C70,12 80,18 90,5 L100,5'
    },
    { 
      title: 'Em Análise', 
      value: '5', 
      icon: Clock, 
      color: 'text-amber-500', 
      bg: 'bg-amber-50',
      trend: '-1 esta semana',
      trendIcon: TrendingDown,
      trendColor: 'text-amber-500',
      sparkline: 'M0,10 C15,12 25,8 40,15 C50,22 65,18 80,25 L100,28'
    },
    { 
      title: 'Resolvidas', 
      value: '28', 
      icon: CheckCircle2, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50',
      trend: '+15% comparado ao mês passado',
      trendIcon: TrendingUp,
      trendColor: 'text-emerald-500',
      sparkline: 'M0,28 C15,25 25,18 40,20 C50,15 65,8 80,10 L100,2'
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'Vazamento no Bloco A, 3º andar',
      type: 'Ocorrência',
      time: '2h atrás',
      status: 'Aberto',
      statusColor: 'status-rose',
      icon: AlertCircle,
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-50'
    },
    {
      id: 2,
      title: 'Barulho excessivo - Unidade 204',
      type: 'Reclamação',
      time: '4h atrás',
      status: 'Em Análise',
      statusColor: 'status-amber',
      icon: MessageSquare,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50'
    },
    {
      id: 3,
      title: 'Elevador com defeito - Bloco B',
      type: 'Ocorrência',
      time: '1d atrás',
      status: 'Resolvida',
      statusColor: 'status-emerald',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50'
    },
  ];

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="dashboard-layout">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - SaaS Refined */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Areas */}
      <main className="main-content">
        {/* Superior Header Moderno */}
        <header className="main-header">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Visão Geral</h2>
              <p className="header-date">{currentDate.charAt(0).toUpperCase() + currentDate.slice(1)}</p>
            </div>
          </div>

          <div className="header-right">
            <div className="header-search">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Buscar ocorrências..." className="search-input" />
            </div>

            <NotificationMenu />

            <div className="user-profile-dropdown" onClick={() => navigate('/perfil')} style={{cursor: 'pointer'}}>
              <div className="user-avatar" style={{ backgroundColor: '#ea580c', color: 'white' }}>
                 <span>{currentUser?.name?.charAt(0) || 'M'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Banner de Contexto Visual (Master) */}
        <ContextBanner />

        {/* Corpo do Dashboard */}
        <div className="dashboard-content-scroll">
          <div className="dashboard-content-inner">
            
            {/* Seção das Métricas (Stats Cards com Sparklines) */}
            <div className="stats-grid">
              {stats.map((stat, idx) => (
                <div key={idx} className="stat-card">
                  {/* Row superior: Título + Ícone */}
                  <div className="stat-card-header">
                    <span className="stat-title">{stat.title}</span>
                    <div className={`stat-icon-wrapper ${stat.bg}`}>
                      <stat.icon className={`${stat.color}`} size={18} />
                    </div>
                  </div>
                  
                  {/* Corpo: Valor + Sparkline Graph */}
                  <div className="stat-card-body">
                    <div className="stat-value">{stat.value}</div>
                    
                    <div className="stat-sparkline-container">
                       <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="sparkline-svg">
                          <defs>
                            <linearGradient id={`grad-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" className={stat.color} />
                              <stop offset="100%" stopColor="currentColor" stopOpacity="0" className={stat.color} />
                            </linearGradient>
                          </defs>
                          {/* Área preenchida (gradiente suave) */}
                          <path 
                             d={`${stat.sparkline} L100,30 L0,30 Z`} 
                             fill={`url(#grad-${idx})`} 
                             className={stat.color}
                          />
                          {/* Linha da Sparkline */}
                          <path 
                             d={stat.sparkline} 
                             fill="none" 
                             stroke="currentColor" 
                             strokeWidth="2.5" 
                             strokeLinecap="round" 
                             strokeLinejoin="round" 
                             className={stat.color}
                          />
                       </svg>
                    </div>
                  </div>

                  {/* Footer: Trend analysis */}
                  <div className="stat-card-footer">
                     <div className={`stat-trend ${stat.trendColor}`}>
                        <stat.trendIcon size={14} strokeWidth={2.5}/>
                        <span>{stat.trend}</span>
                     </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid dos Atalhos Rápidos com Cards Interativos */}
            <div className="quick-actions-grid">
              <div className="quick-actions-header-wrapper">
                 <h3 className="section-title">Ações Rápidas</h3>
              </div>
              <div className="qa-cards-wrapper">
                {/* Ocorrência Card */}
                <a href="#" className="quick-action-card qa-orange-card" onClick={(e) => { e.preventDefault(); navigate('/ocorrencia'); }}>
                  <div className="qa-card-inner">
                    <div className="quick-action-icon-box qa-orange-box">
                      <FileEdit size={24} />
                    </div>
                    <div className="quick-action-text">
                      <h3 className="quick-action-title">Nova Ocorrência</h3>
                      <p className="quick-action-subtitle">Notifique problemas estruturais em áreas comuns</p>
                    </div>
                  </div>
                  <div className="quick-action-arrow">
                    <ChevronRight size={20} />
                  </div>
                </a>

                {/* Reclamação Card */}
                <a href="#" className="quick-action-card qa-amber-card" onClick={(e) => { e.preventDefault(); navigate('/reclamacao'); }}>
                  <div className="qa-card-inner">
                    <div className="quick-action-icon-box qa-amber-box">
                      <FileWarning size={24} />
                    </div>
                    <div className="quick-action-text">
                      <h3 className="quick-action-title">Nova Reclamação</h3>
                      <p className="quick-action-subtitle">Reporte barulho e violações de regras</p>
                    </div>
                  </div>
                  <div className="quick-action-arrow">
                    <ChevronRight size={20} />
                  </div>
                </a>
              </div>
            </div>

            {/* Atividades Recentes com Design Minimalista SaaS */}
            <div className="recent-activities-section">
              <div className="recent-activities-header">
                <div>
                   <h3 className="section-title">Atividades Recentes</h3>
                   <p className="section-subtitle">Últimas atualizações no condomínio</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/feed')}>
                  Ver Relatório <ArrowRight size={16} />
                </button>
              </div>
              <div className="recent-activities-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                     
                     <div className="activity-main">
                        <div className={`activity-icon-rounded ${activity.iconBg}`}>
                          <activity.icon className={activity.iconColor} size={18} />
                        </div>
                        <div className="activity-details">
                          <p className="activity-name">{activity.title}</p>
                          <div className="activity-meta">
                            <span className="activity-type-label">{activity.type}</span>
                            <span className="activity-dot-separator">•</span>
                            <span className="activity-time">{activity.time}</span>
                          </div>
                        </div>
                     </div>

                     <div className="activity-actions">
                       <div className={`activity-status-badge ${activity.statusColor}`}>
                         {activity.status}
                       </div>
                       <button className="activity-action-btn" title="Ver detalhes">
                         <ChevronRight size={18} />
                       </button>
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