import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, CheckCircle2, AlertCircle, Clock, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import ContextBanner from '../components/ContextBanner';
import NotificationMenu from '../components/NotificationMenu';
import './Dashboard.css';
import './PainelSindico.css';

// ---------------------------------------------------------------------------
// Mapeamento categoria → setor (single source of truth)
// No backend isso vira uma tabela: setores_categorias
// ---------------------------------------------------------------------------
export const CATEGORIA_SETOR = {
  'Hidráulica':        'manutencao',
  'Elétrica':          'infraestrutura',
  'Infraestrutura':    'infraestrutura',
  'Limpeza':           'limpeza',
  'Barulho':           'seguranca',
  'Portaria':          'seguranca',
  'Jardinagem':        'limpeza',
  'Manutenção Geral':  'manutencao',
  'Outros':            'manutencao',
};

export const SETOR_LABEL = {
  manutencao:    'Manutenção',
  infraestrutura:'Infraestrutura',
  limpeza:       'Limpeza',
  seguranca:     'Segurança',
};

export const SETOR_COLOR = {
  manutencao:    { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  infraestrutura:{ bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  limpeza:       { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  seguranca:     { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
};

// ---------------------------------------------------------------------------
// Mock data (substitua por chamadas reais à API)
// ---------------------------------------------------------------------------
const kpiData = {
  abertas:   { value: 8,  trend: 'up',      trendValue: '12%' },
  analise:   { value: 5,  trend: 'down',    trendValue: '4%'  },
  resolvidas:{ value: 24, trend: 'up',      trendValue: '18%' },
  total:     { value: 37, trend: 'neutral', trendValue: '0%'  },
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
  { name: 'Elétrica',   value: 25, fill: '#818cf8' },
  { name: 'Barulho',    value: 20, fill: '#a5b4fc' },
  { name: 'Limpeza',    value: 15, fill: '#c7d2fe' },
  { name: 'Outros',     value: 5,  fill: '#e0e7ff' },
];

const dataStatus = [
  { name: 'Abertas',    value: 8,  fill: '#ef4444' },
  { name: 'Em Análise', value: 5,  fill: '#f59e0b' },
  { name: 'Resolvidas', value: 24, fill: '#10b981' },
];

// Ocorrências agora têm setor_destino derivado da categoria
const recentOccurrences = [
  { id: 1, title: 'Vazamento no banheiro',    subtitle: 'Apt 301 - Bloco A', category: 'Hidráulica',  status: 'Aberta',     timeOpen: 'há 2 horas', responsible: null,           assumidoEm: null },
  { id: 2, title: 'Falta de luz no corredor', subtitle: '3º Andar - Bloco B', category: 'Elétrica',   status: 'Em Andamento',timeOpen: 'há 5 horas', responsible: 'João Silva',   assumidoEm: 'há 4h' },
  { id: 3, title: 'Festa com som alto',       subtitle: 'Apt 502 - Bloco C',  category: 'Barulho',    status: 'Aberta',     timeOpen: 'há 1 dia',   responsible: null,           assumidoEm: null },
  { id: 4, title: 'Sujeira na garagem',       subtitle: 'Subsolo 1',          category: 'Limpeza',    status: 'Resolvida',  timeOpen: 'há 2 dias',  responsible: 'Maria Santos', assumidoEm: 'há 1d' },
  { id: 5, title: 'Portão principal travando',subtitle: 'Entrada',            category: 'Portaria',   status: 'Aberta',     timeOpen: 'há 10 min',  responsible: null,           assumidoEm: null },
].map(occ => ({
  ...occ,
  setor: CATEGORIA_SETOR[occ.category] ?? 'manutencao',
}));

// Equipe técnica agora usa campo `setor` (não skills array)
const employeesMock = [
  { id: 'e1', name: 'Maria Manutenção', avatar: 'MM', setor: 'manutencao',     openTasks: 3 },
  { id: 'e2', name: 'João Silva',       avatar: 'JS', setor: 'infraestrutura', openTasks: 1 },
  { id: 'e3', name: 'Carlos Lima',      avatar: 'CL', setor: 'manutencao',     openTasks: 4 },
  { id: 'e4', name: 'Ana Costa',        avatar: 'AC', setor: 'limpeza',        openTasks: 0 },
  { id: 'e5', name: 'Pedro Alves',      avatar: 'PA', setor: 'seguranca',      openTasks: 2 },
];

const slaEmRisco = [
  { id: 101, title: 'Conserto Elevador',       category: 'Infraestrutura', timeRemaining: '< 2h', priority: 'danger'  },
  { id: 102, title: "Vazamento Caixa D'água",  category: 'Hidráulica',     timeRemaining: '4h',   priority: 'warning' },
];

const heatmapDays  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const heatmapTimes = ['08h','10h','12h','14h','16h','18h','20h'];
const generateHeatmapData = () =>
  Array.from({ length: 7 }, () =>
    Array.from({ length: 7 }, () => Math.floor(Math.random() * 5))
  );
const heatmapData = generateHeatmapData();

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor:'#1e293b', padding:'12px', border:'1px solid #334155', borderRadius:'8px' }}>
      <p style={{ color:'#f8fafc', fontWeight:600, marginBottom:8, fontSize:'0.85rem' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', backgroundColor: entry.color || entry.fill }} />
          <span style={{ color:'#cbd5e1', fontSize:'0.75rem', textTransform:'capitalize' }}>{entry.name}:</span>
          <span style={{ color:'white', fontWeight:'bold', fontSize:'0.8rem' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

/** Badge de setor — read-only, informa apenas onde a ocorrência foi roteada */
const SetorBadge = ({ setor }) => {
  const cfg = SETOR_COLOR[setor] ?? SETOR_COLOR.manutencao;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      {SETOR_LABEL[setor]}
    </span>
  );
};

/** Chip de responsável após auto-assunção */
const ResponsavelChip = ({ name }) => (
  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.8rem', color:'#334155', fontWeight:500 }}>
    <div style={{
      width:24, height:24, borderRadius:'50%', background:'#e2e8f0',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:'0.6rem', fontWeight:700,
    }}>
      {name.charAt(0)}
    </div>
    {name}
  </div>
);

/** Aguardando chip — ninguém assumiu ainda */
const AguardandoChip = ({ setor }) => {
  const cfg = SETOR_COLOR[setor] ?? SETOR_COLOR.manutencao;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:600,
      background: cfg.bg, color: cfg.text, border: `1px dashed ${cfg.border}`,
      whiteSpace:'nowrap', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis',
    }}>
      <Clock size={10} style={{ flexShrink:0 }} />
      Aguardando {SETOR_LABEL[setor]}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const PainelSindico = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Painel do Síndico</h2>
              <p className="header-date">Condomínio Bela Vista</p>
            </div>
          </div>
          <div className="header-right">
            <NotificationMenu />
            <div 
              className="user-profile-dropdown" 
              onClick={() => navigate('/perfil')} 
              style={{ 
                display:'flex', 
                alignItems:'center', 
                gap:'0.75rem', 
                borderLeft:'1px solid #e2e8f0', 
                paddingLeft:'1rem',
                cursor: 'pointer' 
              }}
            >
              <div style={{
                width:36, height:36, borderRadius:'50%',
                background:'var(--role-primary-color)', color:'white',
                display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700,
              }}>
                {currentUser?.name?.charAt(0) || 'S'}
              </div>
            </div>
          </div>
        </header>

        <ContextBanner />

        <div className="dashboard-content-scroll">
          <div className="dashboard-content-inner" style={{ maxWidth:1400, margin:'0 auto' }}>

            {/* Page title */}
            <div style={{ marginBottom:'1.25rem' }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:'0 0 2px' }}>
                Ocorrências do Condomínio
              </h3>
              <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>
                Distribuição automática por setor · Monitoramento em tempo real
              </p>
            </div>

            {/* KPIs */}
            <div className="ps-kpis-grid" style={{ marginBottom:'1.25rem' }}>
              {[
                { label:'ABERTAS',    value:kpiData.abertas.value,    trend:kpiData.abertas.trendValue,    trendType:kpiData.abertas.trend,    borderColor:'#ef4444', iconBg:'#fef2f2', iconColor:'#ef4444', Icon:AlertCircle  },
                { label:'EM ANDAMENTO',value:kpiData.analise.value,   trend:kpiData.analise.trendValue,    trendType:kpiData.analise.trend,    borderColor:'#f59e0b', iconBg:'#fffbeb', iconColor:'#f59e0b', Icon:Clock        },
                { label:'RESOLVIDAS', value:kpiData.resolvidas.value, trend:kpiData.resolvidas.trendValue, trendType:kpiData.resolvidas.trend, borderColor:'#10b981', iconBg:'#f0fdf4', iconColor:'#10b981', Icon:CheckCircle2 },
                { label:'TOTAL (MÊS)',value:kpiData.total.value,      trend:'—',                           trendType:'neutral',                borderColor:'#ea580c', iconBg:'#fff7ed', iconColor:'#ea580c', Icon:BarChart3    },
              ].map((k, i) => {
                const trendColor = k.trendType === 'up'
                  ? (k.label === 'ABERTAS' ? '#dc2626' : '#16a34a')
                  : k.trendType === 'down' ? '#16a34a' : '#94a3b8';
                return (
                  <div key={i} style={{
                    background:'#fff', borderRadius:10, padding:'18px 20px',
                    border:'1px solid #e2e8f0', borderLeft:`4px solid ${k.borderColor}`,
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.07em', margin:0 }}>
                        {k.label}
                      </p>
                      <div style={{ width:28, height:28, borderRadius:7, background:k.iconBg, color:k.iconColor, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <k.Icon size={14} />
                      </div>
                    </div>
                    <p style={{ fontSize:32, fontWeight:700, color:'#0f172a', margin:'0 0 6px', lineHeight:1 }}>{k.value}</p>
                    <p style={{ fontSize:12, color:trendColor, margin:0, fontWeight:500 }}>
                      {k.trendType === 'up' ? '↑ ' : k.trendType === 'down' ? '↓ ' : ''}{k.trend}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Main grid */}
            <div className="ps-main-grid">

              {/* ── LEFT COLUMN ── */}
              <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

                {/* Charts row */}
                <div className="ps-charts-row">
                  <div className="ps-card">
                    <h3 className="ps-section-title">Evolução de Ocorrências</h3>
                    <p className="ps-section-subtitle">Comparativo de aberturas e resoluções</p>
                    <div className="ps-chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dataTimeline} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} dy={10} />
                          <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} dx={-10} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="abertas"    stroke="#ef4444" strokeWidth={2} fillOpacity={0.05} fill="#ef4444" activeDot={{ r:4, strokeWidth:0 }} />
                          <Area type="monotone" dataKey="resolvidas" stroke="#10b981" strokeWidth={2} fillOpacity={0.05} fill="#10b981" activeDot={{ r:4, strokeWidth:0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="ps-card">
                    <h3 className="ps-section-title">Por Categoria</h3>
                    <p className="ps-section-subtitle">Volume absoluto por tipo</p>
                    <div className="ps-chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataCategory} layout="vertical" margin={{ top:10, right:10, left:10, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'#475569' }} tickLine={false} axisLine={false} width={80} />
                          <RechartsTooltip cursor={{ fill:'#f8fafc' }} content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[0,4,4,0]} barSize={16}>
                            {dataCategory.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Heatmap */}
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
                          <div key={tIdx} className={`heatmap-cell hm-lvl-${val}`} title={`${val} ocorrências`} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Tabela de ocorrências — nova versão ── */}
                <div className="ps-card" style={{ padding:'1.5rem 0 0 0', overflow:'hidden' }}>
                  <div style={{ padding:'0 1.5rem 1rem 1.5rem' }}>
                    <h3 className="ps-section-title">Ocorrências Recentes</h3>
                    <p className="ps-section-subtitle">
                      Roteamento automático por setor · Síndico apenas monitora
                    </p>
                  </div>

                  {/*
                    LEGENDA DOS STATUS (novo fluxo):
                    Aberta       → na fila do setor, aguardando funcionário assumir
                    Em Andamento → funcionário assumiu e está executando
                    Resolvida    → funcionário finalizou com foto + descrição
                  */}
                  <div className="ps-table-wrapper">
                    <table className="ps-table-modern" style={{ tableLayout:'fixed', width:'100%' }}>
                      <colgroup>
                        <col style={{ width:'28%' }} />  {/* Ocorrência */}
                        <col style={{ width:'16%' }} />  {/* Setor destino */}
                        <col style={{ width:'14%' }} />  {/* Status */}
                        <col style={{ width:'14%' }} />  {/* Tempo aberto */}
                        <col style={{ width:'28%' }} />  {/* Responsável */}
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Ocorrência</th>
                          <th>Setor destino</th>
                          <th>Status</th>
                          <th>Tempo aberto</th>
                          <th>Responsável</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOccurrences.map(occ => (
                          <tr key={occ.id}>
                            {/* Título + local */}
                            <td>
                              <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.85rem' }}>{occ.title}</div>
                              <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:4 }}>
                                {occ.subtitle} · {occ.category}
                              </div>
                            </td>

                            {/* Setor destino — roteado automaticamente */}
                            <td>
                              <SetorBadge setor={occ.setor} />
                            </td>

                            {/* Status */}
                            <td>
                              <span className={`badge-pill ${
                                occ.status === 'Aberta'
                                  ? 'badge-red'
                                  : occ.status === 'Em Andamento'
                                  ? 'badge-yellow'
                                  : 'badge-green'
                              }`}>
                                {occ.status}
                              </span>
                            </td>

                            {/* Tempo */}
                            <td>
                              <div className="time-open"><Clock size={12} /> {occ.timeOpen}</div>
                            </td>

                            {/* Responsável — auto-assumido pelo funcionário, não atribuído pelo síndico */}
                            <td>
                              {occ.responsible
                                ? <ResponsavelChip name={occ.responsible} />
                                : <AguardandoChip setor={occ.setor} />
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
                    <button style={{ padding:'0.25rem 0.75rem', background:'white', border:'1px solid #cbd5e1', borderRadius:6, cursor:'pointer', fontSize:'0.8rem' }}>Anterior</button>
                    <button style={{ padding:'0.25rem 0.75rem', background:'white', border:'1px solid #cbd5e1', borderRadius:6, cursor:'pointer', fontSize:'0.8rem' }}>Próxima</button>
                  </div>
                </div>

              </div>{/* /left column */}

              {/* ── RIGHT COLUMN ── */}
              <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

                {/* Donut status */}
                <div className="ps-card">
                  <h3 className="ps-section-title">Distribuição de Status</h3>
                  <div className="ps-chart-donut-container" style={{ height:200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dataStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} cornerRadius={4} dataKey="value" stroke="none">
                          {dataStatus.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center-text" />
                  </div>
                  <div className="ps-legend-vertical">
                    {dataStatus.map(s => (
                      <div key={s.name} className="legend-item-v">
                        <div className="legend-item-v-left">
                          <div className="legend-dot" style={{ backgroundColor:s.fill }} />
                          {s.name}
                        </div>
                        <div className="legend-item-v-val">{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SLA em risco */}
                <div className="ps-card">
                  <h3 className="ps-section-title">SLA em Risco</h3>
                  <p className="ps-section-subtitle" style={{ marginBottom:'1rem' }}>Prazos de atendimento curtos</p>
                  <div className="widget-list">
                    {slaEmRisco.map(sla => (
                      <div key={sla.id} className="widget-item">
                        <div className="widget-item-left">
                          <div className="w-icon-box">
                            <AlertCircle size={16} color={sla.priority === 'danger' ? '#ef4444' : '#f59e0b'} />
                          </div>
                          <div className="w-texts">
                            <span className="w-title">{sla.title}</span>
                            {/* Mostra o setor responsável para o síndico saber quem cobrar */}
                            <span className="w-subtitle">
                              {SETOR_LABEL[CATEGORIA_SETOR[sla.category] ?? 'manutencao']} · Prazo estourando
                            </span>
                          </div>
                        </div>
                        <div className={`w-badge-${sla.priority}`}>{sla.timeRemaining}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipe técnica por setor */}
                <div className="ps-card">
                  <h3 className="ps-section-title">Equipe por Setor</h3>
                  <p className="ps-section-subtitle" style={{ marginBottom:'1rem' }}>
                    Tarefas abertas · carga por funcionário
                  </p>
                  <div className="widget-list">
                    {[...employeesMock]
                      .sort((a, b) => b.openTasks - a.openTasks)
                      .map(emp => {
                        const cfg = SETOR_COLOR[emp.setor] ?? SETOR_COLOR.manutencao;
                        return (
                          <div key={emp.id} className="widget-item">
                            <div className="widget-item-left">
                              <div className="w-icon-box" style={{ background:'#f1f5f9', color:'#475569', fontSize:'0.7rem', fontWeight:700 }}>
                                {emp.avatar}
                              </div>
                              <div className="w-texts">
                                <span className="w-title">{emp.name}</span>
                                {/* Setor do funcionário em vez de lista de skills */}
                                <span className="w-subtitle" style={{ display:'flex', alignItems:'center', gap:4 }}>
                                  <span style={{
                                    display:'inline-block', width:6, height:6,
                                    borderRadius:'50%', background: cfg.text,
                                  }} />
                                  {SETOR_LABEL[emp.setor]}
                                </span>
                              </div>
                            </div>
                            <div className="w-right-val">{emp.openTasks}</div>
                          </div>
                        );
                      })}
                  </div>
                </div>

              </div>{/* /right column */}
            </div>{/* /ps-main-grid */}

          </div>
        </div>
      </main>
    </div>
  );
};

export default PainelSindico;