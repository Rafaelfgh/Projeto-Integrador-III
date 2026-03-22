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
  AlertCircle,
  Clock,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';
import './PainelSindico.css';

const dataTimeline = [
  { name: '01/03', abertas: 3, analise: 1, resolvidas: 2 },
  { name: '03/03', abertas: 2, analise: 2, resolvidas: 1 },
  { name: '05/03', abertas: 4, analise: 1, resolvidas: 3 },
  { name: '07/03', abertas: 2, analise: 3, resolvidas: 1 },
  { name: '09/03', abertas: 2, analise: 2, resolvidas: 1 },
  { name: '11/03', abertas: 1, analise: 2, resolvidas: 3 },
  { name: '13/03', abertas: 2, analise: 1, resolvidas: 2 },
  { name: '15/03', abertas: 3, analise: 2, resolvidas: 1 },
  { name: '17/03', abertas: 2, analise: 1, resolvidas: 2 },
];

const dataCategory = [
  { name: 'Hidráulica', value: 4, fill: '#7dd3fc' },
  { name: 'Elétrica', value: 3, fill: '#fcd34d' },
  { name: 'Barulho', value: 3, fill: '#fca5a5' },
  { name: 'Limpeza', value: 3, fill: '#6ee7b7' },
  { name: 'Outros', value: 2, fill: '#c4b5fd' },
];

const dataStatus = [
  { name: 'Abertas', value: 5, fill: '#ef4444' },
  { name: 'Em Análise', value: 4, fill: '#f59e0b' },
  { name: 'Resolvidas', value: 6, fill: '#10b981' },
];

const recentOccurrences = [
  { id: 1, title: 'Vazamento no apartamento 301', subtitle: 'Bloco A', category: 'Hidráulica', status: 'Aberta', date: '17/03/2026', responsible: 'Não atribuído' },
  { id: 2, title: 'Curto-circuito na garagem', subtitle: 'Bloco B', category: 'Elétrica', status: 'Em Análise', date: '16/03/2026', responsible: 'João Silva' },
  { id: 3, title: 'Barulho excessivo apt 502', subtitle: 'Bloco C', category: 'Barulho', status: 'Aberta', date: '16/03/2026', responsible: 'Não atribuído' },
  { id: 4, title: 'Limpeza área comum', subtitle: 'Bloco A', category: 'Limpeza', status: 'Resolvida', date: '15/03/2026', responsible: 'Maria Santos' },
  { id: 5, title: 'Infiltração no teto', subtitle: 'Bloco D', category: 'Hidráulica', status: 'Em Análise', date: '15/03/2026', responsible: 'Carlos Lima' },
  { id: 6, title: 'Lâmpada queimada corredor', subtitle: 'Bloco B', category: 'Elétrica', status: 'Resolvida', date: '14/03/2026', responsible: 'Pedro Oliveira' },
  { id: 7, title: 'Festa com som alto', subtitle: 'Bloco A', category: 'Barulho', status: 'Resolvida', date: '14/03/2026', responsible: 'Ana Costa' },
];

const PainelSindico = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

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
              <a href="#" className="nav-item nav-item-inactive" onClick={(e) => { e.preventDefault(); navigate('/solicitacoes'); }}>
                <ClipboardList className="nav-icon" />
                <span>Minhas Solicitações</span>
              </a>
            </nav>
          </div>

          <div>
            <p className="nav-section-title">Administração</p>
            <nav className="nav-list">
              <a href="#" className="nav-item nav-item-active" onClick={(e) => e.preventDefault()}>
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
        <header className="main-header" style={{ paddingBottom: '1.25rem' }}>
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="header-title">Painel do Síndico</h2>
              <p className="header-subtitle">Gestão de Ocorrências Condominiais</p>
            </div>
          </div>
          
          <div className="header-right" style={{ gap: '1.5rem' }}>
            <button className="notification-btn" style={{ position: 'relative' }}>
              <Bell size={24} color="#64748b" />
              <span className="sindico-badge">3</span>
            </button>
            <div className="sindico-profile">
              <div className="sindico-avatar">RS</div>
              <div className="sindico-info">
                <span className="sindico-name">Roberto Silva</span>
                <span className="sindico-role">Síndico</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content-scroll" style={{ backgroundColor: '#fdfdfd' }}>
          <div className="dashboard-content-inner" style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Filter Row */}
            <div className="ps-card">
              <div className="ps-filter-header">
                <span className="ps-filter-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></span>
                <span className="ps-filter-title">Filtros</span>
              </div>
              <div className="ps-filter-grid">
                <select className="ps-select">
                  <option>Últimos 7 dias</option>
                  <option>Últimos 30 dias</option>
                  <option>Este Mês</option>
                </select>
                <select className="ps-select">
                  <option>Todas as categorias</option>
                  <option>Hidráulica</option>
                  <option>Elétrica</option>
                  <option>Barulho</option>
                  <option>Limpeza</option>
                </select>
                <select className="ps-select">
                  <option>Todos os status</option>
                  <option>Aberta</option>
                  <option>Em Análise</option>
                  <option>Resolvida</option>
                </select>
                <select className="ps-select">
                  <option>Todos os blocos</option>
                  <option>Bloco A</option>
                  <option>Bloco B</option>
                  <option>Bloco C</option>
                  <option>Bloco D</option>
                </select>
              </div>
            </div>

            {/* KPIs */}
            <div className="ps-kpis-grid">
              <div className="ps-kpi-card kpi-red">
                <div className="kpi-info">
                  <span className="kpi-title">OCORRÊNCIAS ABERTAS</span>
                  <span className="kpi-value">5</span>
                </div>
                <div className="kpi-icon-box box-red">
                  <AlertCircle size={24} />
                </div>
              </div>
              
              <div className="ps-kpi-card kpi-yellow">
                <div className="kpi-info">
                  <span className="kpi-title">EM ANÁLISE</span>
                  <span className="kpi-value">4</span>
                </div>
                <div className="kpi-icon-box box-yellow">
                  <Clock size={24} />
                </div>
              </div>

              <div className="ps-kpi-card kpi-green">
                <div className="kpi-info">
                  <span className="kpi-title">RESOLVIDAS</span>
                  <span className="kpi-value">6</span>
                </div>
                <div className="kpi-icon-box box-green">
                  <CheckCircle2 size={24} />
                </div>
              </div>

              <div className="ps-kpi-card kpi-orange">
                <div className="kpi-info">
                  <span className="kpi-title">TOTAL DE RECLAMAÇÕES</span>
                  <span className="kpi-value">15</span>
                </div>
                <div className="kpi-icon-box box-orange">
                  <BarChart3 size={24} />
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="ps-charts-grid">
              
              <div className="ps-card" style={{ gridColumn: 'span 7' }}>
                <h3 className="ps-chart-title">Ocorrências ao Longo do Tempo</h3>
                <p className="ps-chart-subtitle">Evolução das ocorrências por status em março/2026</p>
                <div className="ps-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dataTimeline} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Line type="monotone" dataKey="abertas" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="analise" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="resolvidas" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="ps-legend" style={{ justifyContent: 'center' }}>
                  <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>Abertas</span>
                  <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#f59e0b' }}></span>Em Análise</span>
                  <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span>Resolvidas</span>
                </div>
              </div>

              <div className="ps-card" style={{ gridColumn: 'span 5' }}>
                <h3 className="ps-chart-title">Ocorrências por Categoria</h3>
                <p className="ps-chart-subtitle">Distribuição por tipo de ocorrência</p>
                <div className="ps-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {dataCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Bottom Row */}
            <div className="ps-bottom-grid">
              
              <div className="ps-card" style={{ gridColumn: 'span 4' }}>
                <h3 className="ps-chart-title">Status das Ocorrências</h3>
                <p className="ps-chart-subtitle">Proporção por status atual</p>
                <div className="ps-chart-donut-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {dataStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text */}
                  <div className="donut-center-text">
                    <span className="donut-total">15</span>
                    <span className="donut-label">Total</span>
                  </div>
                </div>
                
                <div className="ps-legend" style={{ justifyContent: 'center' }}>
                  <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>Abertas</span>
                  <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#f59e0b' }}></span>Em Análise</span>
                  <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span>Resolvidas</span>
                </div>
              </div>

              <div className="ps-card" style={{ gridColumn: 'span 8', padding: 0 }}>
                <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
                  <h3 className="ps-chart-title">Ocorrências Recentes</h3>
                  <p className="ps-chart-subtitle">Últimas ocorrências registradas no condomínio</p>
                </div>
                <div className="ps-table-container">
                  <table className="ps-table">
                    <thead>
                      <tr>
                        <th>OCORRÊNCIA</th>
                        <th>CATEGORIA</th>
                        <th>STATUS</th>
                        <th>DATA</th>
                        <th>RESPONSÁVEL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOccurrences.map(occ => (
                        <tr key={occ.id}>
                          <td>
                            <div className="ps-td-title">{occ.title}</div>
                            <div className="ps-td-subtitle">{occ.subtitle}</div>
                          </td>
                          <td>
                            <span className="ps-cat">
                              <span className="ps-cat-dot" style={{ 
                                backgroundColor: occ.category === 'Hidráulica' ? '#7dd3fc' : 
                                                 occ.category === 'Elétrica' ? '#fcd34d' : 
                                                 occ.category === 'Barulho' ? '#fca5a5' : 
                                                 occ.category === 'Limpeza' ? '#6ee7b7' : '#c4b5fd' 
                              }}></span>
                              {occ.category}
                            </span>
                          </td>
                          <td>
                            <span className={`ps-status-badge ${
                              occ.status === 'Aberta' ? 'ps-status-red' : 
                              occ.status === 'Em Análise' ? 'ps-status-yellow' : 'ps-status-green'
                            }`}>{occ.status}</span>
                          </td>
                          <td>
                            <span className="ps-date">
                              <Clock size={14} style={{ marginRight: '4px' }} />
                              {occ.date}
                            </span>
                          </td>
                          <td>
                            <span className="ps-resp">
                              <User size={14} style={{ marginRight: '4px' }} />
                              {occ.responsible}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default PainelSindico;
