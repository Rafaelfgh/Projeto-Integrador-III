import React, { useState } from 'react';
import { FaixaStatus } from '../components/Placa';
import { classeStatus } from '../utils/statusOcorrencia';
import FiltroData, { FILTRO_DATA_VAZIO, temFiltroData, passaFiltroData, anosDe } from '../components/FiltroData';
import ErroCarregamento from '../components/ErroCarregamento';
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
  Activity,
  ClipboardList,
  Building,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Megaphone,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import ContextBanner from '../components/ContextBanner';
import NotificationMenu from '../components/NotificationMenu';
import { supabase } from '../backend/supabaseClient';
import './Dashboard.css';

// As 4 etapas, na mesma ordem e escala de toda tela
const PLACAS_STATUS = [
  { status: 'Aberta', rotulo: 'Abertas' },
  { status: 'Em Análise', rotulo: 'Em análise' },
  { status: 'Em Andamento', rotulo: 'Em andamento' },
  { status: 'Resolvida', rotulo: 'Concluídas' },
];

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isGestor = currentUser?.role === 'SINDICO' || currentUser?.role === 'MASTER';

  // SaaS-style stats com mini sparklines


  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const [todas, setTodas] = useState([]);
  // Filtro por data: dia, mês e ano são independentes (dia 25 = dia 25 de qualquer mês/ano)
  const [filtroData, setFiltroData] = useState(FILTRO_DATA_VAZIO);
  const temFiltro = temFiltroData(filtroData);
  const filtradas = todas.filter(x => passaFiltroData(x.criado_em, filtroData));
  const activities = filtradas.slice(0, temFiltro ? 50 : 5);
  const [carga, setCarga] = useState('carregando'); // 'carregando' | 'ok' | 'erro'
  const [tentativa, setTentativa] = useState(0);

  React.useEffect(() => {
    async function fetchData() {
      if (!currentUser?.condominio_id) return;
      setCarga('carregando');

      const [{ data: occ, error: erroOcc }, { data: rec, error: erroRec }] = await Promise.all([
        supabase.from('Ocorrencias').select('*').eq('condominio_id', currentUser.condominio_id).order('created_at', { ascending: false }),
        supabase.from('Reclamacoes').select('*').eq('condominio_id', currentUser.condominio_id).order('created_at', { ascending: false }),
      ]);
      if (erroOcc || erroRec) {
        console.error('Erro ao carregar a visão geral:', erroOcc || erroRec);
        setCarga('erro');
        return;
      }
      
      let all = [];
      if (occ) {
        all = all.concat(occ.map(o => ({
          id: o.id,
          title: o.titulo,
          type: 'Ocorrência',
          time: new Date(o.created_at).toLocaleDateString(),
          status: o.status || 'Aberta',
          statusColor: classeStatus(o.status || 'Aberta'),
          icon: AlertCircle,
          iconColor: 'text-rose-500',
          iconBg: 'bg-rose-50',
          criado_em: new Date(o.created_at).getTime()
        })));
      }
      
      if (rec) {
        all = all.concat(rec.map(r => ({
          id: `r-${r.id}`,
          title: 'Reclamação Particular',
          type: 'Reclamação',
          time: new Date(r.created_at).toLocaleDateString(),
          status: 'Em Análise',
          statusColor: classeStatus(r.status || 'Em Análise'),
          icon: MessageSquare,
          iconColor: 'text-amber-500',
          iconBg: 'bg-amber-50',
          criado_em: new Date(r.created_at).getTime()
        })));
      }
      
      all.sort((a, b) => b.criado_em - a.criado_em);
      
      setTodas(all);
      setCarga('ok');
    }
    fetchData();
  }, [currentUser?.condominio_id, tentativa]);

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
                background:'var(--hab-laranja)', color:'var(--hab-tinta)',
                display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700,
              }}>
                {currentUser?.name?.charAt(0) || 'M'}
              </div>
            </div>
          </div>
        </header>

        {/* Banner de Contexto Visual (Master) */}
        <ContextBanner />

        {/* Corpo do Dashboard */}
        <div className="dashboard-content-scroll">
          {carga === 'erro' ? (
            <ErroCarregamento onTentar={() => setTentativa(t => t + 1)} />
          ) : carga === 'carregando' ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>
          ) : (
          <div className="dashboard-content-inner">
            
            <FiltroData valor={filtroData} onChange={setFiltroData} anos={anosDe(todas.map(x => x.criado_em))} />

            {/* Placas de status: quantas ocorrências e reclamações há em cada etapa */}
            <div className="painel-placas" role="list">
              {PLACAS_STATUS.map(({ status, rotulo }) => {
                const n = filtradas.filter(x => x.status === status).length;
                return (
                  <button
                    key={status}
                    type="button"
                    role="listitem"
                    className="placa placa-clicavel placa-status"
                    onClick={() => navigate('/feed')}
                    aria-label={`${n} ${rotulo}`}
                  >
                    <span className="placa-status-numero">{n}</span>
                    <span className="placa-status-sub">{temFiltro ? 'no período' : 'no condomínio'}</span>
                    <FaixaStatus status={status} />
                  </button>
                );
              })}
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

                {/* Só a gestão publica avisos e manda recados */}
                {isGestor && (
                  <>
                <a href="#" className="quick-action-card qa-blue-card" onClick={(e) => { e.preventDefault(); navigate('/avisos?novo=1'); }}>
                  <div className="qa-card-inner">
                    <div className="quick-action-icon-box qa-blue-box">
                      <Megaphone size={24} />
                    </div>
                    <div className="quick-action-text">
                      <h3 className="quick-action-title">Novo Aviso ou Evento</h3>
                      <p className="quick-action-subtitle">Publique um comunicado no mural do condomínio</p>
                    </div>
                  </div>
                  <div className="quick-action-arrow">
                    <ChevronRight size={20} />
                  </div>
                </a>
                <a href="#" className="quick-action-card qa-green-card" onClick={(e) => { e.preventDefault(); navigate('/recados?novo=1'); }}>
                  <div className="qa-card-inner">
                    <div className="quick-action-icon-box qa-green-box">
                      <Mail size={24} />
                    </div>
                    <div className="quick-action-text">
                      <h3 className="quick-action-title">Novo Recado</h3>
                      <p className="quick-action-subtitle">Envie uma mensagem para a equipe de funcionários</p>
                    </div>
                  </div>
                  <div className="quick-action-arrow">
                    <ChevronRight size={20} />
                  </div>
                </a>
                  </>
                )}
              </div>
            </div>

            {/* Atividades Recentes com Design Minimalista SaaS */}
            <div className="recent-activities-section">
              <div className="recent-activities-header">
                <div>
                   <h3 className="section-title">Atividades Recentes</h3>
                   <p className="section-subtitle">{temFiltro ? `${filtradas.length} registro(s) no período filtrado` : 'Últimas atualizações no condomínio'}</p>
                </div>
              </div>
              <div className="recent-activities-list">
                {activities.length === 0 && (
                  <p style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    {temFiltro ? 'Nenhuma ocorrência ou reclamação nessa data.' : 'Nenhuma atividade ainda.'}
                  </p>
                )}
                {activities.map((activity) => (
                  <div key={activity.id} className="activity-item">

                     <div className="activity-main">
                        <div className="activity-icon-col">
                          <div className={`activity-icon-rounded ${activity.iconBg}`}>
                            <activity.icon className={activity.iconColor} size={18} />
                          </div>
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
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;