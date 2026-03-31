import React, { useState, useEffect, useRef } from 'react';
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
  BarChart3,
  MapPin,
  Home,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Award,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import NotificationMenu from '../components/NotificationMenu';
import Sidebar from '../components/Sidebar';
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#1e293b', padding: '12px', border: '1px solid #334155', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }}>
        <p className="label" style={{ color: '#f8fafc', fontWeight: '600', marginBottom: '8px', fontSize: '0.85rem' }}>{`${label}`}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
             <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color }}></div>
             <span style={{ color: '#cbd5e1', fontSize: '0.75rem', textTransform: 'capitalize' }}>{entry.name}:</span>
             <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PainelSindico = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
            <NotificationMenu />
            <div className="sindico-profile-container" ref={profileRef}>
              <div 
                className="sindico-profile-trigger" 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="sindico-avatar-btn">
                   <img src="https://ui-avatars.com/api/?name=Roberto+Silva&background=f97316&color=fff&size=40" alt="Avatar"/>
                   <div className="sindico-status-dot"></div>
                </div>
                <div className="sindico-info-trigger">
                  <span className="sindico-name-trigger">Roberto Silva</span>
                  <span className="sindico-role-trigger">Síndico</span>
                </div>
              </div>

              {/* Enhanced SaaS Dropdown */}
              {isProfileOpen && (
                <div className="sindico-dropdown-menu">
                  <div className="sd-header">
                    <img src="https://ui-avatars.com/api/?name=Roberto+Silva&background=f97316&color=fff&size=64" alt="Roberto Silva" className="sd-avatar-large"/>
                    <div className="sd-title-group">
                      <h4>Roberto Silva</h4>
                      <p>Síndico Profissional</p>
                      <div className="sd-reputation">
                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                        <span>4.8 Avaliação</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sd-divider"></div>

                  <div className="sd-section">
                    <span className="sd-section-title">Contexto Atual</span>
                    <div className="sd-context-item">
                      <div className="sd-icon-box bg-orange-light">
                        <Building size={16} className="text-orange"/>
                      </div>
                      <div>
                        <h5>Cond. Parque das Flores</h5>
                        <p>120 un • 4 blocos</p>
                      </div>
                    </div>
                  </div>

                  <div className="sd-divider"></div>

                  <div className="sd-section">
                     <span className="sd-section-title">Performance (Mês)</span>
                     <div className="sd-stats-grid">
                        <div className="sd-stat-box">
                          <div className="sd-icon-box bg-green-light">
                            <CheckCircle2 size={16} className="text-emerald" />
                          </div>
                          <div className="sd-stat-texts">
                            <span className="sd-stat-val">245</span>
                            <span className="sd-stat-lbl">Resolvidas</span>
                          </div>
                        </div>
                        <div className="sd-stat-box">
                          <div className="sd-icon-box bg-blue-light">
                            <Clock size={16} className="text-blue" />
                          </div>
                          <div className="sd-stat-texts">
                            <span className="sd-stat-val">1h 15m</span>
                            <span className="sd-stat-lbl">Tempo Médio</span>
                          </div>
                        </div>
                     </div>
                  </div>

                  <div className="sd-divider"></div>

                  <div className="sd-actions">
                    <button className="sd-btn" onClick={() => navigate('/perfil')}>
                      <User size={16} /> Meu Perfil
                    </button>
                    <button className="sd-btn text-red" onClick={() => navigate('/login')}>
                      <LogOut size={16} /> Sair
                    </button>
                  </div>
                </div>
              )}
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
                    <AreaChart data={dataTimeline} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAbertas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAnalise" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorResolvidas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} dx={-10} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                      <Area type="monotone" dataKey="abertas" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorAbertas)" activeDot={{ r: 6, strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="analise" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorAnalise)" activeDot={{ r: 6, strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="resolvidas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolvidas)" activeDot={{ r: 6, strokeWidth: 0 }} />
                    </AreaChart>
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
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} dx={-10} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
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
                        innerRadius={85}
                        outerRadius={115}
                        paddingAngle={4}
                        cornerRadius={6}
                        dataKey="value"
                        stroke="none"
                      >
                        {dataStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
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
