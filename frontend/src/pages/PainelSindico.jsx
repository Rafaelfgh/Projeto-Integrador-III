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
  Star,
  Plus,
  MoreVertical,
  Send,
  Check,
  MessageSquare,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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

const ocorrenciasKanban = {
  recebida: [
    { id: '048', title: 'Infiltração teto — Apt 501', category: 'Hidráulica', local: 'Apt 501', priority: 'critical', time: '12h' }
  ],
  analise: [
    { id: '049', title: 'Barulho noturno — Apt 303', category: 'Barulho', local: 'Apt 303', priority: 'low', time: '1d' }
  ],
  aguardando: [
    { id: '050', title: 'Conserto portão garagem', category: 'Manutenção', local: 'Área Comum', priority: 'moderate', time: '4h', assignee: 'João Silva', avatar: 'J' }
  ],
  execucao: [
    { id: '047', title: 'Vazamento no banheiro', category: 'Hidráulica', local: 'Apt 204', priority: 'critical', time: 'Em andamento', assignee: 'Carlos Lima', avatar: 'C', active: true }
  ],
  concluida: [
    { id: '046', title: 'Troca lâmpadas corredor B', category: 'Elétrica', local: 'Bloco B', priority: 'low', time: '2d', validationNeeded: true }
  ],
  finalizada: [
    { id: '045', title: 'Reparo elevador Bloco B', category: 'Manutenção', local: 'Bloco B', priority: 'critical', time: '3d', approved: true }
  ]
};

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
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'overview';

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

            {activeTab === 'overview' && (
              <>
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
              </>
            )}

            {activeTab === 'fluxo-ocorrencias' && (
              <div className="ps-card" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                 <div className="ps-kanban-board">
                    {/* Recebida */}
                    <div className="ps-kanban-column bg-status-gray">
                       <div className="ps-kanban-header">
                          <h3 className="ps-kanban-title">Recebida <span className="ps-kanban-count">1</span></h3>
                          <button style={{background:'none',border:'none',cursor:'pointer'}}><MoreVertical size={16} color="#64748b" /></button>
                       </div>
                       <div className="ps-kanban-body">
                          {ocorrenciasKanban.recebida.map(item => (
                             <div key={item.id} className="ps-kanban-card" onClick={() => navigate('/painel?tab=ocorrencia-detalhe&id=' + item.id)}>
                                <div className="ps-kanban-card-header">
                                   <span className={`badge-priority ${item.priority}`}>{item.priority === 'critical' ? 'Crítico' : 'Baixo'}</span>
                                   <span className="ps-kanban-time"><Clock size={12}/> {item.time}</span>
                                </div>
                                <h4 className="ps-kanban-card-title">{item.title}</h4>
                                <div className="ps-kanban-card-meta">
                                   <MapPin size={12}/> {item.local}
                                </div>
                                <div className="ps-kanban-card-footer">
                                   <span className="ps-cat"><span className="ps-cat-dot" style={{backgroundColor: '#7dd3fc'}}></span>{item.category}</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Em Análise */}
                    <div className="ps-kanban-column bg-status-blue">
                       <div className="ps-kanban-header">
                          <h3 className="ps-kanban-title">Em Análise <span className="ps-kanban-count">1</span></h3>
                          <button style={{background:'none',border:'none',cursor:'pointer'}}><MoreVertical size={16} color="#64748b" /></button>
                       </div>
                       <div className="ps-kanban-body">
                          {ocorrenciasKanban.analise.map(item => (
                             <div key={item.id} className="ps-kanban-card" onClick={() => navigate('/painel?tab=ocorrencia-detalhe&id=' + item.id)}>
                                <div className="ps-kanban-card-header">
                                   <span className={`badge-priority ${item.priority}`}>Baixo</span>
                                   <span className="ps-kanban-time"><Clock size={12}/> {item.time}</span>
                                </div>
                                <h4 className="ps-kanban-card-title">{item.title}</h4>
                                <div className="ps-kanban-card-meta">
                                   <MapPin size={12}/> {item.local}
                                </div>
                                <div className="ps-kanban-card-footer">
                                   <span className="ps-cat"><span className="ps-cat-dot" style={{backgroundColor: '#fca5a5'}}></span>{item.category}</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Aguardando Execução */}
                    <div className="ps-kanban-column bg-status-amber">
                       <div className="ps-kanban-header">
                          <h3 className="ps-kanban-title">Aguardando Exec. <span className="ps-kanban-count">1</span></h3>
                          <button style={{background:'none',border:'none',cursor:'pointer'}}><MoreVertical size={16} color="#64748b" /></button>
                       </div>
                       <div className="ps-kanban-body">
                          {ocorrenciasKanban.aguardando.map(item => (
                             <div key={item.id} className="ps-kanban-card" onClick={() => navigate('/painel?tab=ocorrencia-detalhe&id=' + item.id)}>
                                <div className="ps-kanban-card-header">
                                   <span className={`badge-priority ${item.priority}`}>Moderado</span>
                                   <span className="ps-kanban-time"><Clock size={12}/> {item.time}</span>
                                </div>
                                <h4 className="ps-kanban-card-title">{item.title}</h4>
                                <div className="ps-kanban-card-meta">
                                   <MapPin size={12}/> {item.local}
                                </div>
                                <div className="ps-kanban-card-footer">
                                   <div style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'0.75rem', color:'#475569'}}>
                                     <div style={{width:'20px',height:'20px',borderRadius:'50%',backgroundColor:'#cbd5e1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',fontWeight:'bold',color:'#334155'}}>{item.avatar}</div>
                                     {item.assignee}
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Em Execução */}
                    <div className="ps-kanban-column bg-status-purple">
                       <div className="ps-kanban-header">
                          <h3 className="ps-kanban-title">Em Execução <span className="ps-kanban-count">1</span></h3>
                          <button style={{background:'none',border:'none',cursor:'pointer'}}><MoreVertical size={16} color="#64748b" /></button>
                       </div>
                       <div className="ps-kanban-body">
                          {ocorrenciasKanban.execucao.map(item => (
                             <div key={item.id} className="ps-kanban-card" style={{borderLeft: '3px solid #8b5cf6'}} onClick={() => navigate('/painel?tab=ocorrencia-detalhe&id=' + item.id)}>
                                <div className="ps-kanban-card-header">
                                   <span className={`badge-priority ${item.priority}`}>Crítico</span>
                                   <span className="ps-kanban-time" style={{color:'#8b5cf6', fontWeight:'600'}}><Activity size={12}/> {item.time}</span>
                                </div>
                                <h4 className="ps-kanban-card-title">{item.title}</h4>
                                <div className="ps-kanban-card-meta">
                                   <MapPin size={12}/> {item.local}
                                </div>
                                <div className="ps-kanban-card-footer">
                                   <div style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'0.75rem', color:'#475569'}}>
                                     <div style={{width:'20px',height:'20px',borderRadius:'50%',backgroundColor:'#8b5cf6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',fontWeight:'bold',color:'white'}}>{item.avatar}</div>
                                     {item.assignee}
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Concluída */}
                    <div className="ps-kanban-column bg-status-green">
                       <div className="ps-kanban-header">
                          <h3 className="ps-kanban-title">Concluída <span className="ps-kanban-count">1</span></h3>
                          <button style={{background:'none',border:'none',cursor:'pointer'}}><MoreVertical size={16} color="#64748b" /></button>
                       </div>
                       <div className="ps-kanban-body">
                          {ocorrenciasKanban.concluida.map(item => (
                             <div key={item.id} className="ps-kanban-card" onClick={() => navigate('/painel?tab=ocorrencia-detalhe&id=' + item.id)}>
                                <div className="ps-kanban-card-header">
                                   <span className={`badge-priority ${item.priority}`}>Baixo</span>
                                   <span className="ps-kanban-time"><Clock size={12}/> {item.time}</span>
                                </div>
                                <h4 className="ps-kanban-card-title">{item.title}</h4>
                                <div className="ps-kanban-card-meta">
                                   <MapPin size={12}/> {item.local}
                                </div>
                                <div className="ps-kanban-card-footer">
                                   <span style={{fontSize:'0.7rem', color:'#f59e0b', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px'}}><Clock size={12}/> Aguardando Validação</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Finalizada */}
                    <div className="ps-kanban-column bg-status-dark">
                       <div className="ps-kanban-header">
                          <h3 className="ps-kanban-title">Finalizada <span className="ps-kanban-count">1</span></h3>
                          <button style={{background:'none',border:'none',cursor:'pointer'}}><MoreVertical size={16} color="#64748b" /></button>
                       </div>
                       <div className="ps-kanban-body">
                          {ocorrenciasKanban.finalizada.map(item => (
                             <div key={item.id} className="ps-kanban-card" style={{opacity: 0.7}} onClick={() => navigate('/painel?tab=ocorrencia-detalhe&id=' + item.id)}>
                                <div className="ps-kanban-card-header">
                                   <span className={`badge-priority ${item.priority}`}>Crítico</span>
                                   <span className="ps-kanban-time"><Check size={12}/> {item.time}</span>
                                </div>
                                <h4 className="ps-kanban-card-title">{item.title}</h4>
                                <div className="ps-kanban-card-meta">
                                   <MapPin size={12}/> {item.local}
                                </div>
                                <div className="ps-kanban-card-footer">
                                   <span style={{fontSize:'0.7rem', color:'#10b981', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px'}}><CheckCircle2 size={12}/> Aprovado</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'ocorrencia-detalhe' && (
              <div className="ps-card" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                
                {/* Detalhe Header */}
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem', background:'white', padding:'1rem 1.5rem', borderRadius:'8px', border:'1px solid #e2e8f0' }}>
                   <button onClick={() => navigate('/painel?tab=fluxo-ocorrencias')} style={{display:'flex', alignItems:'center', gap:'0.5rem', background:'none', border:'none', color:'#475569', fontWeight:'600', cursor:'pointer'}}><ArrowLeft size={16}/> Voltar</button>
                   <div style={{width:'1px', height:'24px', backgroundColor:'#e2e8f0'}}></div>
                   <h2 style={{margin:0, fontSize:'1.1rem', color:'#0f172a', fontWeight:'700'}}>Ocorrência #047 — Vazamento no banheiro</h2>
                   <div style={{marginLeft:'auto', display:'flex', gap:'0.5rem'}}>
                     <button style={{padding:'0.5rem 1rem', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0', borderRadius:'6px', fontWeight:'600', fontSize:'0.8rem', cursor:'pointer'}}>Devolver p/ ajuste</button>
                     <button style={{padding:'0.5rem 1rem', background:'#10b981', color:'white', border:'none', borderRadius:'6px', fontWeight:'600', fontSize:'0.8rem', cursor:'pointer'}}>Validar Conclusão</button>
                   </div>
                </div>

                <div className="ocorrencia-detail-layout">
                   {/* Left Col: Timeline and Chat */}
                   <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                      <div className="ps-card">
                         <h3 style={{fontSize:'0.9rem', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'1.5rem'}}>Linha do Tempo</h3>
                         <div className="ps-timeline">
                            <div className="ps-timeline-item">
                               <div className="ps-timeline-marker done"><Check color="white" size={12} style={{margin:'2px'}}/></div>
                               <div className="ps-timeline-content">
                                  <h4>Recebida</h4>
                                  <p>Morador reportou vazamento no teto do banheiro.</p>
                                  <div className="ps-timeline-time">17/03/2026 às 08:30</div>
                               </div>
                            </div>
                            <div className="ps-timeline-item">
                               <div className="ps-timeline-marker done"><Check color="white" size={12} style={{margin:'2px'}}/></div>
                               <div className="ps-timeline-content">
                                  <h4>Em Análise</h4>
                                  <p>Síndico avaliou e categorizou como crítico (necessita corte de água).</p>
                                  <div className="ps-timeline-time">17/03/2026 às 09:15</div>
                               </div>
                            </div>
                            <div className="ps-timeline-item">
                               <div className="ps-timeline-marker active"></div>
                               <div className="ps-timeline-content">
                                  <h4>Aguardando Execução</h4>
                                  <p>Tarefa atribuída para Carlos Lima (Manutenção).</p>
                                  <div className="ps-timeline-time">17/03/2026 às 09:30</div>
                               </div>
                            </div>
                            <div className="ps-timeline-item">
                               <div className="ps-timeline-marker"></div>
                               <div className="ps-timeline-content">
                                  <h4 style={{color:'#94a3b8'}}>Em Execução</h4>
                                  <p style={{color:'#cbd5e1'}}>Pendente</p>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="ps-card">
                         <h3 style={{fontSize:'0.9rem', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'1.5rem'}}>Mensagens</h3>
                         <div className="ps-chat-section">
                            <div className="ps-chat-bubble">
                               <div style={{width:'32px',height:'32px',borderRadius:'50%',backgroundColor:'#cbd5e1',display:'flex',justifyContent:'center',alignItems:'center'}}>A</div>
                               <div className="ps-chat-message">
                                  <div className="ps-chat-header"><span>Ana Souza</span> <span className="badge-priority low">Morador</span> <span className="chat-time">Hoje, 08:30</span></div>
                                  <div className="ps-chat-text">Bom dia, o teto do meu banheiro está vazando muita água, acho que vem do apartamento de cima!</div>
                               </div>
                            </div>
                            <div className="ps-chat-bubble out">
                               <div style={{width:'32px',height:'32px',borderRadius:'50%',backgroundColor:'#f97316',display:'flex',justifyContent:'center',alignItems:'center',color:'white'}}>RS</div>
                               <div className="ps-chat-message">
                                  <div className="ps-chat-header"><span>Roberto Silva</span> <span className="badge-priority moderate">Síndico</span> <span className="chat-time">Hoje, 09:18</span></div>
                                  <div className="ps-chat-text">Ana, já notifiquei a manutenção. Estamos mandando o Carlos aí agora. Por favor, afaste eletrônicos do local.</div>
                               </div>
                            </div>
                         </div>
                         <div className="ps-chat-input-area">
                            <input type="text" placeholder="Escreva um comentário..." />
                            <button style={{width:'40px',height:'40px',borderRadius:'50%',backgroundColor:'#4f46e5',border:'none',color:'white',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><Send size={16}/></button>
                         </div>
                      </div>
                   </div>

                   {/* Right Col: Info Card */}
                   <div className="ps-card" style={{height:'fit-content'}}>
                      <h3 style={{fontSize:'0.9rem', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'1.5rem'}}>Informações</h3>
                      
                      <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
                         <div>
                            <span style={{display:'block', fontSize:'0.75rem', color:'#94a3b8', marginBottom:'0.25rem'}}>STATUS ATUAL</span>
                            <span className="ps-status-badge ps-status-yellow">Aguardando Execução</span>
                         </div>
                         <div>
                            <span style={{display:'block', fontSize:'0.75rem', color:'#94a3b8', marginBottom:'0.25rem'}}>CATEGORIA</span>
                            <span className="ps-cat"><span className="ps-cat-dot" style={{backgroundColor: '#7dd3fc'}}></span>Hidráulica</span>
                         </div>
                         <div>
                            <span style={{display:'block', fontSize:'0.75rem', color:'#94a3b8', marginBottom:'0.25rem'}}>LOCAL</span>
                            <span style={{fontWeight:'600', color:'#334155', fontSize:'0.9rem'}}>Apt 204</span>
                         </div>
                         <div>
                            <span style={{display:'block', fontSize:'0.75rem', color:'#94a3b8', marginBottom:'0.25rem'}}>PRIORIDADE</span>
                            <span className="badge-priority critical">Crítica</span>
                         </div>
                         <div>
                            <span style={{display:'block', fontSize:'0.75rem', color:'#94a3b8', marginBottom:'0.25rem'}}>ATRIBUÍDO A</span>
                            <div style={{display:'flex', alignItems:'center', gap:'0.5rem', background:'#f8fafc', padding:'0.5rem', borderRadius:'6px', border:'1px solid #e2e8f0'}}>
                               <div style={{width:'24px',height:'24px',borderRadius:'50%',backgroundColor:'#8b5cf6',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:'bold'}}>C</div>
                               <span style={{fontSize:'0.85rem', fontWeight:'600', color:'#1e293b'}}>Carlos Lima</span>
                            </div>
                         </div>
                         <div>
                            <span style={{display:'block', fontSize:'0.75rem', color:'#94a3b8', marginBottom:'0.25rem'}}>SLA (TEMPO LIMITE)</span>
                            <span style={{display:'flex', alignItems:'center', gap:'0.25rem', color:'#ef4444', fontWeight:'600', fontSize:'0.85rem'}}><Clock size={14}/> 4h restantes</span>
                         </div>
                      </div>
                   </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PainelSindico;
