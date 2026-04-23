import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, Bell, FileText, User, LogOut, CheckCircle2, 
  AlertCircle, Clock, BarChart3, ChevronUp, ChevronDown, 
  Filter, X, Search, ChevronRight, Activity, MapPin, Check
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';
import './PainelSindico.css';

// --- MOCK DATA ---
const kpiData = {
  abertas: { value: 8, trend: 'up', trendValue: '12%' },
  analise: { value: 5, trend: 'down', trendValue: '4%' },
  resolvidas: { value: 24, trend: 'up', trendValue: '18%' },
  total: { value: 37, trend: 'neutral', trendValue: '0%' }
};

const dataTimeline = [
  { name: '01/03', abertas: 3, resolvidas: 2 },
  { name: '05/03', abertas: 4, resolvidas: 3 },
  { name: '10/03', abertas: 2, resolvidas: 5 },
  { name: '15/03', abertas: 5, resolvidas: 2 },
  { name: '20/03', abertas: 3, resolvidas: 7 },
  { name: '25/03', abertas: 1, resolvidas: 4 },
];

const dataCategory = [
  { name: 'Hidráulica', value: 35, fill: '#6366f1' },
  { name: 'Elétrica', value: 25, fill: '#818cf8' },
  { name: 'Barulho', value: 20, fill: '#a5b4fc' },
  { name: 'Limpeza', value: 15, fill: '#c7d2fe' },
  { name: 'Outros', value: 5, fill: '#e0e7ff' },
];

const dataStatus = [
  { name: 'Abertas', value: 8, fill: '#ef4444' },
  { name: 'Em Análise', value: 5, fill: '#f59e0b' },
  { name: 'Resolvidas', value: 24, fill: '#10b981' },
];

const recentOccurrences = [
  { id: 1, title: 'Vazamento no banheiro', subtitle: 'Apt 301 - Bloco A', category: 'Hidráulica', status: 'Aberta', timeOpen: 'há 2 horas', responsible: null },
  { id: 2, title: 'Falta de luz no corredor', subtitle: '3º Andar - Bloco B', category: 'Elétrica', status: 'Em Análise', timeOpen: 'há 5 horas', responsible: 'João Silva' },
  { id: 3, title: 'Festa com som alto', subtitle: 'Apt 502 - Bloco C', category: 'Barulho', status: 'Aberta', timeOpen: 'há 1 dia', responsible: null },
  { id: 4, title: 'Sujeira na garagem', subtitle: 'Subsolo 1', category: 'Limpeza', status: 'Resolvida', timeOpen: 'há 2 dias', responsible: 'Maria Santos' },
  { id: 5, title: 'Portão principal travando', subtitle: 'Entrada', category: 'Elétrica', status: 'Aberta', timeOpen: 'há 10 min', responsible: null },
];

const employeesMock = [
  { id: 'e1', name: 'Maria Manutenção', avatar: 'MM', openTasks: 3, skills: ['Hidráulica', 'Elétrica', 'Limpeza'] },
  { id: 'e2', name: 'João Silva', avatar: 'JS', openTasks: 1, skills: ['Infraestrutura', 'Jardinagem'] },
  { id: 'e3', name: 'Carlos Lima', avatar: 'CL', openTasks: 4, skills: ['Manutenção Geral', 'Hidráulica'] },
  { id: 'e4', name: 'Ana Costa', avatar: 'AC', openTasks: 0, skills: ['Portaria', 'Limpeza'] },
];

const slaEmRisco = [
  { id: 101, title: 'Conserto Elevador', timeRemaining: '< 2h', priority: 'danger' },
  { id: 102, title: 'Vazamento Caixa D\'água', timeRemaining: '4h', priority: 'warning' }
];

// Heatmap Mock Data (Dias x Horas simplificado)
const heatmapDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const heatmapTimes = ['08h', '10h', '12h', '14h', '16h', '18h', '20h'];
const generateHeatmapData = () => {
  let grid = [];
  for (let d = 0; d < 7; d++) {
    let row = [];
    for (let t = 0; t < 7; t++) {
      row.push(Math.floor(Math.random() * 5)); // 0 to 4 (opacity levels)
    }
    grid.push(row);
  }
  return grid;
};
const heatmapData = generateHeatmapData();


// --- COMPONENTS ---

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#1e293b', padding: '12px', border: '1px solid #334155', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <p style={{ color: '#f8fafc', fontWeight: '600', marginBottom: '8px', fontSize: '0.85rem' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
             <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color || entry.fill }}></div>
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
  const [activeTab, setActiveTab] = useState('geral'); // geral, equipe
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [assignModal, setAssignModal] = useState({ isOpen: false, occ: null });
  
  // Employee Management Modal
  const [empModal, setEmpModal] = useState({ isOpen: false, emp: null });
  const [editingSkills, setEditingSkills] = useState([]);
  const [empList, setEmpList] = useState(employeesMock);
  const [auditLog, setAuditLog] = useState([]);

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Assignment Logic
  const handleOpenAssign = (occ) => {
    setAssignModal({ isOpen: true, occ });
  };

  const handleCloseAssign = () => {
    setAssignModal({ isOpen: false, occ: null });
  };

  const handleAssign = (empId) => {
    // Mock assignment
    alert(`Tarefa atribuída ao funcionário ID: ${empId}`);
    handleCloseAssign();
  };

  // Split employees for modal
  let recommendedEmps = [];
  let otherEmps = [];
  if (assignModal.occ) {
    empList.forEach(emp => {
      if (emp.skills.includes(assignModal.occ.category)) {
        recommendedEmps.push(emp);
      } else {
        otherEmps.push(emp);
      }
    });
  }

  // Employee Edit Logic
  const handleOpenEmpModal = (emp) => {
    setEmpModal({ isOpen: true, emp });
    setEditingSkills([...emp.skills]);
  };

  const handleCloseEmpModal = () => {
    setEmpModal({ isOpen: false, emp: null });
  };

  const addSkillToEmp = (skill) => {
    if (!editingSkills.includes(skill)) {
      setEditingSkills([...editingSkills, skill]);
    }
  };

  const removeSkillFromEmp = (skill) => {
    setEditingSkills(editingSkills.filter(s => s !== skill));
  };

  const saveEmpSkills = () => {
    const timestamp = new Date().toLocaleString('pt-BR');
    
    // Determine o que foi adicionado ou removido para o log
    const added = editingSkills.filter(s => !empModal.emp.skills.includes(s));
    const removed = empModal.emp.skills.filter(s => !editingSkills.includes(s));
    
    let logMsg = '';
    if (added.length > 0 && removed.length > 0) {
       logMsg = `Síndico alterou especialidades de ${empModal.emp.name}: Adicionou [${added.join(', ')}], Removeu [${removed.join(', ')}] — ${timestamp}`;
    } else if (added.length > 0) {
       logMsg = `Síndico adicionou '${added.join(', ')}' para ${empModal.emp.name} — ${timestamp}`;
    } else if (removed.length > 0) {
       logMsg = `Síndico removeu '${removed.join(', ')}' de ${empModal.emp.name} — ${timestamp}`;
    } else {
       logMsg = `Nenhuma alteração para ${empModal.emp.name} — ${timestamp}`;
    }

    setEmpList(empList.map(e => e.id === empModal.emp.id ? { ...e, skills: editingSkills } : e));
    setAuditLog([logMsg, ...auditLog]);
    
    alert('Especialidades do funcionário atualizadas com sucesso.');
    handleCloseEmpModal();
  };

  const availableCategories = ['Hidráulica', 'Elétrica', 'Limpeza', 'Pintura', 'Manutenção Geral', 'Portaria', 'Jardinagem', 'Infraestrutura', 'Outros'];


  return (
    <div className="dashboard-layout">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Filter Drawer */}
      <div className={`filter-drawer-overlay ${isFilterOpen ? 'open' : ''}`} onClick={() => setIsFilterOpen(false)}></div>
      <div className={`filter-drawer ${isFilterOpen ? 'open' : ''}`}>
         <div className="fd-header">
            <h3 className="fd-title">Filtros</h3>
            <button className="fd-close" onClick={() => setIsFilterOpen(false)}><X size={20}/></button>
         </div>
         <div className="fd-body">
            <div className="fd-group">
               <label className="fd-label">Visualização Rápida</label>
               <div className="preset-pills">
                  <button className="preset-pill active">Esta Semana</button>
                  <button className="preset-pill">Urgentes</button>
                  <button className="preset-pill">Sem responsável</button>
               </div>
            </div>
            <div className="fd-group">
               <label className="fd-label">Categoria</label>
               <select className="fd-select">
                  <option>Todas as categorias</option>
                  <option>Hidráulica</option>
                  <option>Elétrica</option>
                  <option>Barulho</option>
               </select>
            </div>
            <div className="fd-group">
               <label className="fd-label">Status</label>
               <select className="fd-select">
                  <option>Todos os status</option>
                  <option>Aberta</option>
                  <option>Em Análise</option>
                  <option>Resolvida</option>
               </select>
            </div>
         </div>
         <div className="fd-footer">
            <button className="btn-fd-clear">Limpar</button>
            <button className="btn-fd-apply" onClick={() => setIsFilterOpen(false)}>Aplicar</button>
         </div>
      </div>

      {/* Assignment Modal */}
      {assignModal.isOpen && (
        <div className="assign-modal-overlay">
           <div className="assign-modal">
              <div className="am-header">
                 <div>
                    <h3 className="am-title">Atribuir Responsável</h3>
                    <p className="am-subtitle">{assignModal.occ.title} ({assignModal.occ.category})</p>
                 </div>
                 <button style={{background:'none',border:'none',cursor:'pointer',color:'#64748b'}} onClick={handleCloseAssign}><X size={20}/></button>
              </div>
              <div className="am-body">
                 
                 <h4 className="am-section-title">Recomendados</h4>
                 {recommendedEmps.length > 0 ? recommendedEmps.map(emp => (
                   <div key={emp.id} className="employee-card recommended" onClick={() => handleAssign(emp.id)}>
                      <div className="emp-info-group">
                         <div className="emp-avatar" style={{background:'#eef2ff', color:'#4f46e5'}}>{emp.avatar}</div>
                         <div className="emp-details">
                            <span className="emp-name">{emp.name}</span>
                            <span className="emp-tasks">{emp.openTasks} tarefas em andamento</span>
                            <div className="emp-skills">
                              {emp.skills.map(skill => (
                                <span key={skill} className={`skill-badge ${skill === assignModal.occ.category ? 'match' : ''}`}>{skill}</span>
                              ))}
                            </div>
                         </div>
                      </div>
                      <ChevronRight size={16} color="#a5b4fc" />
                   </div>
                 )) : <p style={{fontSize:'0.8rem', color:'#94a3b8', marginBottom:'1.5rem'}}>Nenhum funcionário com esta especialidade.</p>}

                 <h4 className="am-section-title" style={{marginTop:'1.5rem'}}>Outros Funcionários</h4>
                 {otherEmps.map(emp => (
                   <div key={emp.id} className="employee-card" onClick={() => handleAssign(emp.id)}>
                      <div className="emp-info-group">
                         <div className="emp-avatar">{emp.avatar}</div>
                         <div className="emp-details">
                            <span className="emp-name">{emp.name}</span>
                            <span className="emp-tasks">{emp.openTasks} tarefas em andamento</span>
                            <div className="emp-skills">
                              {emp.skills.map(skill => <span key={skill} className="skill-badge">{skill}</span>)}
                            </div>
                         </div>
                      </div>
                      <ChevronRight size={16} color="#cbd5e1" />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="header-breadcrumbs" style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
              <div onClick={() => setActiveTab('geral')} style={{cursor: 'pointer', opacity: activeTab === 'geral' ? 1 : 0.5}}>
                 <h2 className="header-title" style={{margin: 0}}>Visão Geral</h2>
                 <p className="header-subtitle" style={{margin: 0}}>Métricas e ocorrências</p>
              </div>
              <span style={{color: '#cbd5e1', fontSize: '1.5rem'}}>|</span>
              <div onClick={() => setActiveTab('equipe')} style={{cursor: 'pointer', opacity: activeTab === 'equipe' ? 1 : 0.5}}>
                 <h2 className="header-title" style={{margin: 0}}>Equipe Técnica</h2>
                 <p className="header-subtitle" style={{margin: 0}}>Gestão de funcionários</p>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-export"><FileText size={16} /> Exportar</button>
            <div style={{position:'relative', cursor:'pointer', padding:'0.5rem', color:'#64748b'}}>
               <Bell size={20} />
               <span style={{position:'absolute', top:'4px', right:'4px', width:'8px', height:'8px', background:'#ef4444', borderRadius:'50%'}}></span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'0.75rem', borderLeft:'1px solid #e2e8f0', paddingLeft:'1rem'}}>
               <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'#4f46e5', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700'}}>
                  {currentUser?.name?.charAt(0) || 'S'}
               </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content-scroll">
          <div className="dashboard-content-inner" style={{maxWidth: '1400px', margin: '0 auto'}}>
            
            {activeTab === 'geral' && (
              <>
            {/* Top Bar with Filter Toggle */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
               <h3 className="ps-section-title" style={{margin:0}}>Métricas Atuais</h3>
               <button className="btn-assign" style={{background:'white', color:'#0f172a', borderColor:'#e2e8f0'}} onClick={() => setIsFilterOpen(true)}>
                 <Filter size={14} /> Filtros Rápidos
               </button>
            </div>

            {/* KPIs Minimal */}
            <div className="ps-kpis-grid">
               <div className="ps-card ps-kpi-minimal">
                  <div className="kpi-header-min">
                     <span className="kpi-title-min">Abertas</span>
                     <div className="kpi-icon-min kpi-icon-red"><AlertCircle size={16}/></div>
                  </div>
                  <div className="kpi-body-min">
                     <span className="kpi-value-min">{kpiData.abertas.value}</span>
                     <span className={`kpi-trend ${kpiData.abertas.trend}`}>
                        {kpiData.abertas.trend === 'up' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                        {kpiData.abertas.trendValue}
                     </span>
                  </div>
               </div>
               <div className="ps-card ps-kpi-minimal">
                  <div className="kpi-header-min">
                     <span className="kpi-title-min">Em Análise</span>
                     <div className="kpi-icon-min kpi-icon-yellow"><Clock size={16}/></div>
                  </div>
                  <div className="kpi-body-min">
                     <span className="kpi-value-min">{kpiData.analise.value}</span>
                     <span className={`kpi-trend ${kpiData.analise.trend}`}>
                        {kpiData.analise.trend === 'up' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                        {kpiData.analise.trendValue}
                     </span>
                  </div>
               </div>
               <div className="ps-card ps-kpi-minimal">
                  <div className="kpi-header-min">
                     <span className="kpi-title-min">Resolvidas</span>
                     <div className="kpi-icon-min kpi-icon-green"><CheckCircle2 size={16}/></div>
                  </div>
                  <div className="kpi-body-min">
                     <span className="kpi-value-min">{kpiData.resolvidas.value}</span>
                     <span className={`kpi-trend ${kpiData.resolvidas.trend}`}>
                        {kpiData.resolvidas.trend === 'up' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                        {kpiData.resolvidas.trendValue}
                     </span>
                  </div>
               </div>
               <div className="ps-card ps-kpi-minimal">
                  <div className="kpi-header-min">
                     <span className="kpi-title-min">Total (Mês)</span>
                     <div className="kpi-icon-min kpi-icon-indigo"><BarChart3 size={16}/></div>
                  </div>
                  <div className="kpi-body-min">
                     <span className="kpi-value-min">{kpiData.total.value}</span>
                     <span className="kpi-trend neutral">--</span>
                  </div>
               </div>
            </div>

            {/* Main Layout: 8 columns (charts) / 4 columns (widgets) */}
            <div className="ps-main-grid">
               
               {/* Left Column (Charts & Tables) */}
               <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                  
                  {/* Charts Row */}
                  <div className="ps-charts-row">
                     {/* Line Chart */}
                     <div className="ps-card">
                        <h3 className="ps-section-title">Evolução de Ocorrências</h3>
                        <p className="ps-section-subtitle">Comparativo de aberturas e resoluções</p>
                        <div className="ps-chart-container">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={dataTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} dy={10} />
                                 <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} dx={-10} />
                                 <RechartsTooltip content={<CustomTooltip />} />
                                 <Area type="monotone" dataKey="abertas" stroke="#ef4444" strokeWidth={2} fillOpacity={0.05} fill="#ef4444" activeDot={{ r: 4, strokeWidth: 0 }} />
                                 <Area type="monotone" dataKey="resolvidas" stroke="#10b981" strokeWidth={2} fillOpacity={0.05} fill="#10b981" activeDot={{ r: 4, strokeWidth: 0 }} />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Horizontal Bar Chart (Categories) */}
                     <div className="ps-card">
                        <h3 className="ps-section-title">Por Categoria</h3>
                        <p className="ps-section-subtitle">Volume absoluto por tipo</p>
                        <div className="ps-chart-container">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={dataCategory} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                 <XAxis type="number" hide />
                                 <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} width={80} />
                                 <RechartsTooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                                 <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                                    {dataCategory.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                 </Bar>
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  </div>

                  {/* Heatmap Row */}
                  <div className="ps-card">
                     <h3 className="ps-section-title">Mapa de Calor Semanal</h3>
                     <p className="ps-section-subtitle">Horários de pico na abertura de ocorrências</p>
                     
                     <div className="heatmap-container">
                        <div className="heatmap-header">
                           {heatmapTimes.map(t => <div key={t} className="heatmap-time-label">{t}</div>)}
                        </div>
                        {heatmapDays.map((day, dIdx) => (
                          <div key={day} className="heatmap-row">
                             <div className="heatmap-day-label">{day}</div>
                             {heatmapData[dIdx].map((val, tIdx) => (
                               <div key={tIdx} className={`heatmap-cell hm-lvl-${val}`} title={`${val} ocorrências`}></div>
                             ))}
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Table */}
                  <div className="ps-card" style={{padding: '1.5rem 0 0 0', overflow: 'hidden'}}>
                     <div style={{padding: '0 1.5rem 1.5rem 1.5rem'}}>
                        <h3 className="ps-section-title">Ocorrências Recentes</h3>
                        <p className="ps-section-subtitle">Últimas movimentações no condomínio</p>
                     </div>
                     <div className="ps-table-wrapper">
                        <table className="ps-table-modern">
                           <thead>
                              <tr>
                                 <th>Ocorrência</th>
                                 <th>Status</th>
                                 <th>Tempo Aberto</th>
                                 <th>Responsável</th>
                              </tr>
                           </thead>
                           <tbody>
                              {recentOccurrences.map(occ => (
                                <tr key={occ.id}>
                                   <td>
                                      <div style={{fontWeight:600, color:'#1e293b', fontSize:'0.85rem'}}>{occ.title}</div>
                                      <div style={{fontSize:'0.75rem', color:'#64748b', marginTop:'4px'}}>{occ.subtitle} • {occ.category}</div>
                                   </td>
                                   <td>
                                      <span className={`badge-pill ${
                                        occ.status === 'Aberta' ? 'badge-red' : 
                                        occ.status === 'Em Análise' ? 'badge-yellow' : 'badge-green'
                                      }`}>{occ.status}</span>
                                   </td>
                                   <td>
                                      <div className="time-open"><Clock size={12}/> {occ.timeOpen}</div>
                                   </td>
                                   <td>
                                      {occ.responsible ? (
                                        <div style={{display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.8rem', color:'#334155', fontWeight:500}}>
                                           <div style={{width:'24px',height:'24px',borderRadius:'50%',background:'#e2e8f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',fontWeight:700}}>{occ.responsible.charAt(0)}</div>
                                           {occ.responsible}
                                        </div>
                                      ) : (
                                        <button className="btn-assign" onClick={() => handleOpenAssign(occ)}>Atribuir</button>
                                      )}
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                     {/* Mock Pagination */}
                     <div style={{padding:'1rem 1.5rem', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end', gap:'0.5rem'}}>
                        <button style={{padding:'0.25rem 0.75rem', background:'white', border:'1px solid #cbd5e1', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem'}}>Anterior</button>
                        <button style={{padding:'0.25rem 0.75rem', background:'white', border:'1px solid #cbd5e1', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem'}}>Próxima</button>
                     </div>
                  </div>

               </div>

               {/* Right Column (Widgets) */}
               <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                  
                  {/* Status Donut */}
                  <div className="ps-card">
                     <h3 className="ps-section-title">Distribuição de Status</h3>
                     <div className="ps-chart-donut-container" style={{height:'200px'}}>
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                data={dataStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                                paddingAngle={2} cornerRadius={4} dataKey="value" stroke="none"
                              >
                                 {dataStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                              </Pie>
                              <RechartsTooltip content={<CustomTooltip />} />
                           </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center-text">
                           <span className="donut-total">37</span>
                           <span className="donut-label">Total</span>
                        </div>
                     </div>
                     <div className="ps-legend-vertical">
                        {dataStatus.map(status => (
                           <div key={status.name} className="legend-item-v">
                              <div className="legend-item-v-left">
                                 <div className="legend-dot" style={{backgroundColor: status.fill}}></div>
                                 {status.name}
                              </div>
                              <div className="legend-item-v-val">{status.value}</div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* SLA em Risco Widget */}
                  <div className="ps-card">
                     <h3 className="ps-section-title">SLA em Risco</h3>
                     <p className="ps-section-subtitle" style={{marginBottom:'1rem'}}>Prazos de atendimento curtos</p>
                     <div className="widget-list">
                        {slaEmRisco.map(sla => (
                           <div key={sla.id} className="widget-item">
                              <div className="widget-item-left">
                                 <div className="w-icon-box">
                                    <AlertCircle size={16} className={sla.priority === 'danger' ? 'text-red-500' : 'text-yellow-500'} color={sla.priority === 'danger' ? '#ef4444' : '#f59e0b'}/>
                                 </div>
                                 <div className="w-texts">
                                    <span className="w-title">{sla.title}</span>
                                    <span className="w-subtitle">Prazo estourando</span>
                                 </div>
                              </div>
                              <div className={`w-badge-${sla.priority}`}>{sla.timeRemaining}</div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Resumo Funcionários Widget */}
                  <div className="ps-card">
                     <h3 className="ps-section-title">Equipe Técnica</h3>
                     <p className="ps-section-subtitle" style={{marginBottom:'1rem'}}>Tarefas abertas por funcionário</p>
                     <div className="widget-list">
                        {empList.sort((a,b) => b.openTasks - a.openTasks).slice(0,4).map(emp => (
                           <div key={emp.id} className="widget-item" style={{cursor: 'pointer'}} onClick={() => { setActiveTab('equipe'); handleOpenEmpModal(emp); }}>
                              <div className="widget-item-left">
                                 <div className="w-icon-box" style={{background:'#f1f5f9', color:'#475569', fontSize:'0.7rem', fontWeight:700}}>
                                    {emp.avatar}
                                 </div>
                                 <div className="w-texts">
                                    <span className="w-title">{emp.name}</span>
                                    <span className="w-subtitle">{emp.skills[0]} {emp.skills.length > 1 ? `+${emp.skills.length-1}` : ''}</span>
                                 </div>
                              </div>
                              <div className="w-right-val">{emp.openTasks}</div>
                           </div>
                        ))}
                     </div>
                  </div>

               </div>
            </div>
              </>
            )}

            {activeTab === 'equipe' && (
              <div className="ps-team-management" style={{ animation: 'fadeIn 0.3s ease' }}>
                 <div className="ps-action-bar" style={{marginBottom: '2rem'}}>
                    <div className="ps-greeting">
                       <h1 className="ps-title" style={{fontSize: '1.5rem'}}>Gestão de Especialidades da Equipe</h1>
                       <p className="ps-subtitle">Gerencie as categorias de serviço atribuídas a cada funcionário.</p>
                    </div>
                 </div>

                 <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem'}}>
                    {empList.map(emp => (
                       <div key={emp.id} className="ps-card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                             <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'#eef2ff',color:'#4f46e5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',fontWeight:700}}>
                                {emp.avatar}
                             </div>
                             <div>
                                <h3 style={{margin:0, fontSize:'1.1rem', color:'#0f172a'}}>{emp.name}</h3>
                                <p style={{margin:0, fontSize:'0.85rem', color:'#64748b'}}>{emp.openTasks} tarefas em andamento</p>
                             </div>
                          </div>
                          
                          <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                             <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end'}}>
                                {emp.skills.length > 0 ? emp.skills.map(skill => (
                                   <span key={skill} style={{background:'#f1f5f9', color:'#475569', padding:'0.25rem 0.75rem', borderRadius:'20px', fontSize:'0.75rem', fontWeight:600}}>{skill}</span>
                                )) : <span style={{color: '#94a3b8', fontSize: '0.8rem'}}>Nenhuma</span>}
                             </div>
                             <button className="btn-outline-primary" onClick={() => handleOpenEmpModal(emp)}>Editar Especialidades</button>
                          </div>
                       </div>
                    ))}
                 </div>

                 {auditLog.length > 0 && (
                    <div className="ps-card" style={{background: '#f8fafc', border: '1px solid #e2e8f0'}}>
                       <h3 className="ps-section-title">Log de Auditoria - Especialidades</h3>
                       <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem'}}>
                          {auditLog.map((log, i) => (
                             <div key={i} style={{fontSize: '0.85rem', color: '#334155', display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                                <CheckCircle2 size={14} color="#10b981" />
                                {log}
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
            )}

          </div>
        </div>

        {/* Modal Editar Especialidades */}
        {empModal.isOpen && (
           <div className="assign-modal-overlay">
              <div className="assign-modal" style={{maxWidth: '600px'}}>
                 <div className="am-header">
                    <div>
                       <h3 className="am-title">Editar Funcionário</h3>
                       <p className="am-subtitle">{empModal.emp.name}</p>
                    </div>
                    <button style={{background:'none',border:'none',cursor:'pointer',color:'#64748b'}} onClick={handleCloseEmpModal}><X size={20}/></button>
                 </div>
                 
                 <div className="am-body">
                    <h4 className="am-section-title" style={{marginBottom: '1rem'}}>Especialidades Atuais</h4>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                       {editingSkills.map(skill => (
                          <span key={skill} style={{display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#e0f2fe', color: '#0284c7', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600}}>
                             {skill}
                             <button type="button" style={{background:'none',border:'none',cursor:'pointer',color:'#0284c7',display:'flex'}} onClick={() => removeSkillFromEmp(skill)}><X size={14}/></button>
                          </span>
                       ))}
                       {editingSkills.length === 0 && <span style={{fontSize: '0.85rem', color: '#94a3b8'}}>Nenhuma especialidade atribuída.</span>}
                    </div>

                    <h4 className="am-section-title" style={{marginBottom: '1rem'}}>Adicionar Especialidade</h4>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                       {availableCategories.filter(cat => !editingSkills.includes(cat)).map(cat => (
                          <button 
                             key={cat} 
                             type="button" 
                             style={{background: 'white', border: '1px solid #cbd5e1', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', transition: 'all 0.2s'}}
                             onClick={() => addSkillToEmp(cat)}
                             onMouseOver={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }}
                             onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569'; }}
                          >
                             + {cat}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div style={{padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px'}}>
                    <button className="btn-outline-primary" onClick={handleCloseEmpModal}>Cancelar</button>
                    <button className="btn-saas-primary" onClick={saveEmpSkills}>Salvar Alterações</button>
                 </div>
              </div>
           </div>
        )}

      </main>
    </div>
  );
};

export default PainelSindico;
