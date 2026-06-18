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
  Search,
  Plus,
  Droplet,
  Zap,
  Volume2,
  Trash2,
  CalendarDays,
  ArrowRight,
  FolderOpen,
  Paperclip,
  UserCog
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NotificationMenu from '../components/NotificationMenu';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import './Dashboard.css';
import './MinhasSolicitacoes.css';

// Mesma lógica de timeline usada no Painel de Acompanhamento, mantida consistente entre as duas telas.
const TIMELINE_STEPS = [
  { key: 'aberta',    label: 'Aberta',       statuses: ['Aberta'] },
  { key: 'andamento', label: 'Em Andamento', statuses: ['Em Análise', 'Em Andamento'] },
  { key: 'resolvida', label: 'Resolvida',    statuses: ['Resolvida'] },
];

const getTimelineStepIndex = (status) => {
  const idx = TIMELINE_STEPS.findIndex(step => step.statuses.includes(status));
  return idx === -1 ? 0 : idx;
};

const MinhasSolicitacoes = () => {
  const [requestsList, setRequestsList] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setShowNewDropdown(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getCategoryTheme = (cat) => {
    switch(cat?.toLowerCase()) {
      case 'hidraulica': return { icon: <Droplet size={20} strokeWidth={2.5}/>, class: 'ms-icon-blue' };
      case 'eletrica': return { icon: <Zap size={20} strokeWidth={2.5}/>, class: 'ms-icon-yellow' };
      case 'barulho': return { icon: <Volume2 size={20} strokeWidth={2.5}/>, class: 'ms-icon-red' };
      case 'limpeza': return { icon: <Trash2 size={20} strokeWidth={2.5}/>, class: 'ms-icon-green' };
      case 'reclamacao': return { icon: <FileWarning size={20} strokeWidth={2.5}/>, class: 'ms-icon-red' };
      default: return { icon: <FileText size={20} strokeWidth={2.5}/>, class: 'ms-icon-purple' };
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Aberta': return 'ms-status-red';
      case 'Em Análise': return 'ms-status-yellow';
      case 'Resolvida': return 'ms-status-green';
      default: return '';
    }
  };

  React.useEffect(() => {
    async function fetchMyRequests() {
      if (!currentUser?.id) return;
      
      const { data: occ } = await supabase.from('Ocorrencias')
        .select('*')
        .eq('morador_id', currentUser.id)
        .order('created_at', { ascending: false });
        
      const { data: rec } = await supabase.from('Reclamacoes')
        .select('*')
        .eq('morador_id', currentUser.id)
        .order('created_at', { ascending: false });

      // Nomes dos funcionários atribuídos (mesma estratégia do Painel: 1 query batch, sem N+1)
      const idsAtribuidos = [...new Set((occ || []).map(o => o.atribuido_a).filter(Boolean))];
      let nomesFuncionarios = {};
      if (idsAtribuidos.length > 0) {
        const { data: funcionarios } = await supabase
          .from('Funcionarios')
          .select('id, nome')
          .in('id', idsAtribuidos);
        nomesFuncionarios = Object.fromEntries((funcionarios || []).map(f => [f.id, f.nome]));
      }
        
      let all = [];
      if (occ) {
        all = all.concat(occ.map(o => ({
          id: `o-${o.id}`,
          rawId: o.id,
          tipo: 'ocorrencia',
          protocol: `OCO-${new Date(o.created_at).getFullYear()}-${o.id.toString().padStart(4, '0')}`,
          title: o.titulo,
          description: o.descricao,
          category: o.categoria || 'Outros',
          status: o.status || 'Aberta',
          date: new Date(o.created_at).toLocaleDateString(),
          time: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: currentUser.name,
          timestamp: new Date(o.created_at).getTime(),
          createdAt: o.created_at,
          updatedAt: o.updated_at,
          anexos: Array.isArray(o.anexos) ? o.anexos : [],
          temAnexo: Array.isArray(o.anexos) && o.anexos.length > 0,
          funcionarioNome: o.atribuido_a ? (nomesFuncionarios[o.atribuido_a] || null) : null,
        })));
      }
      
      if (rec) {
        all = all.concat(rec.map(r => ({
          id: `r-${r.id}`,
          rawId: r.id,
          tipo: 'reclamacao',
          protocol: `REC-${new Date(r.created_at).getFullYear()}-${r.id.toString().padStart(4, '0')}`,
          title: 'Reclamação Particular',
          description: r.descricao,
          category: 'reclamacao',
          status: r.status || 'Aberta',
          date: new Date(r.created_at).toLocaleDateString(),
          time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: currentUser.name,
          timestamp: new Date(r.created_at).getTime(),
          createdAt: r.created_at,
          blocoDenunciado: r.bloco_denunciado,
          apartamentoDenunciado: r.apartamento_denunciado,
          anexos: Array.isArray(r.anexos) ? r.anexos : [],
          temAnexo: Array.isArray(r.anexos) && r.anexos.length > 0,
        })));
      }
      
      all.sort((a, b) => b.timestamp - a.timestamp);
      setRequestsList(all);

      // Se a tela foi aberta via link com ?ocorrenciaId=, abre o modal já focado naquela ocorrência
      const ocorrenciaIdParam = searchParams.get('ocorrenciaId');
      if (ocorrenciaIdParam) {
        const match = all.find(r => r.tipo === 'ocorrencia' && String(r.rawId) === String(ocorrenciaIdParam));
        if (match) setSelectedRequest(match);
      }
    }
    fetchMyRequests();
  }, [currentUser?.id, searchParams]);

  const filteredRequests = requestsList.filter(req => {
    const matchesSearch = req.protocol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeFilter === 'Todos') return true;
    if (activeFilter === 'Abertas') return req.status === 'Aberta';
    if (activeFilter === 'Em Análise') return req.status === 'Em Análise' || req.status === 'Em Andamento';
    if (activeFilter === 'Resolvidas') return req.status === 'Resolvida';
    return true;
  });

  const renderModalTimeline = (req) => {
    const currentIdx = getTimelineStepIndex(req.status);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', margin: '1rem 0' }}>
        {TIMELINE_STEPS.map((step, idx) => {
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;
          const dotColor = isFuture ? '#cbd5e1' : (isCurrent ? '#f97316' : '#10b981');
          const stepDate = idx === 0 ? req.createdAt : (isCurrent ? req.updatedAt : null);
          return (
            <React.Fragment key={step.key}>
              {idx > 0 && (
                <div style={{ flex: 1, height: 2, marginTop: 7, background: idx <= currentIdx ? '#10b981' : '#e2e8f0' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: dotColor,
                  border: isCurrent ? '3px solid #fed7aa' : 'none', boxSizing: 'border-box',
                }} />
                <span style={{ fontSize: '0.75rem', marginTop: '0.35rem', textAlign: 'center', color: isFuture ? '#94a3b8' : '#334155', fontWeight: isCurrent ? 700 : 500 }}>
                  {step.label}
                </span>
                {stepDate && (
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                    {new Date(stepDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

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
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Minhas Solicitações</h2>
              <p className="header-date">Acompanhe o status e histórico dos seus chamados</p>
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
                {currentUser?.name?.charAt(0) || 'M'}
              </div>
            </div>
          </div>
        </header>

        {/* List Content */}
        <div className="dashboard-content-scroll" style={{ backgroundColor: '#f8fafc' }}>
          <div className="ms-container">
            
            {/* Actions Bar */}
            <div className="ms-header-actions">
              <div className="ms-search-wrapper">
                <Search size={18} className="ms-search-icon" />
                <input 
                  type="text" 
                  className="ms-search-input" 
                  placeholder="Pesquisar protocolo ou título..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                <button className="btn-ms-new" onClick={() => setShowNewDropdown(!showNewDropdown)}>
                  <Plus size={18} strokeWidth={2.5}/> Nova Solicitação
                </button>
                {showNewDropdown && (
                  <div className="ms-new-dropdown">
                    <button className="ms-dropdown-item" onClick={() => navigate('/ocorrencia')}>
                      <FileEdit size={16} className="ms-dropdown-item-icon" /> Registrar Ocorrência
                    </button>
                    <button className="ms-dropdown-item" onClick={() => navigate('/reclamacao')}>
                      <FileWarning size={16} className="ms-dropdown-item-icon" /> Registrar Reclamação
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Pill Filters */}
            <div className="ms-filters">
              {['Todos', 'Abertas', 'Em Análise', 'Resolvidas'].map(filter => (
                <button 
                  key={filter}
                  className={`ms-filter-pill ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Premium SaaS Cards Grid */}
            {filteredRequests.length > 0 ? (
              <div className="ms-cards-grid">
                {filteredRequests.map(req => {
                  const theme = getCategoryTheme(req.category);
                  return (
                    <div key={req.id} className="ms-premium-card">
                      {/* Card Header */}
                      <div className="ms-card-header">
                        <span className={`ms-status ${getStatusClass(req.status)}`}>
                          {req.status === 'Resolvida' && <div style={{width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a'}}></div>}
                          {(req.status === 'Em Análise' || req.status === 'Em Andamento') && <div style={{width: 6, height: 6, borderRadius: '50%', backgroundColor: '#d97706'}}></div>}
                          {req.status === 'Aberta' && <div style={{width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444'}}></div>}
                          {req.status}
                        </span>
                        <div className={`ms-card-icon-wrap ${theme.class}`}>
                          {theme.icon}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="ms-card-body">
                        <span className="ms-protocol-tag">{req.protocol}</span>
                        <h4 className="ms-card-title">{req.title}</h4>
                      </div>

                      <div className="ms-card-divider"></div>

                      {/* Card Footer */}
                      <div className="ms-card-footer">
                        <div className="ms-card-date">
                          <CalendarDays size={14} />
                          {req.date}
                        </div>
                        <div
                          className="ms-card-action"
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedRequest(req)}
                          onKeyDown={(e) => { if (e.key === 'Enter') setSelectedRequest(req); }}
                          style={{ cursor: 'pointer' }}
                        >
                          Acompanhar <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ms-empty">
                <FolderOpen size={48} className="ms-empty-icon" />
                <h4 className="ms-empty-title">Nenhum protocolo encontrado</h4>
                <p className="ms-empty-desc">Sua busca ou filtro não retornou nenhum registro. Tente usar outros termos.</p>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Modal de Acompanhamento */}
      {selectedRequest && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}
          onClick={() => setSelectedRequest(null)}
        >
          <div
            style={{
              background: 'white', borderRadius: '1rem', maxWidth: 520, width: '100%',
              maxHeight: '85vh', overflowY: 'auto', padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{selectedRequest.protocol}</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0 0' }}>{selectedRequest.title}</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <span className={`ms-status ${getStatusClass(selectedRequest.status)}`} style={{ display: 'inline-flex', marginTop: '0.5rem' }}>
              {selectedRequest.status}
            </span>

            {selectedRequest.tipo === 'ocorrencia' && renderModalTimeline(selectedRequest)}

            {selectedRequest.description && (
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginTop: '1rem' }}>
                {selectedRequest.description}
              </p>
            )}

            {selectedRequest.tipo === 'ocorrencia' && selectedRequest.funcionarioNome && (
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748b', marginTop: '0.75rem' }}>
                <UserCog size={15} /> Atribuída a <strong>{selectedRequest.funcionarioNome}</strong>
              </p>
            )}

            {selectedRequest.tipo === 'reclamacao' && (selectedRequest.blocoDenunciado || selectedRequest.apartamentoDenunciado) && (
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.75rem' }}>
                Local denunciado: {selectedRequest.blocoDenunciado} {selectedRequest.apartamentoDenunciado}
              </p>
            )}

            {selectedRequest.anexos && selectedRequest.anexos.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <Paperclip size={14} /> {selectedRequest.anexos.length > 1 ? `${selectedRequest.anexos.length} fotos anexadas` : 'Foto anexada'}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedRequest.anexos.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir foto em tamanho completo"
                    >
                      <img
                        src={url}
                        alt={`Anexo ${idx + 1} de ${selectedRequest.title}`}
                        style={{
                          width: 96, height: 96, objectFit: 'cover',
                          borderRadius: '0.6rem', border: '1px solid #e2e8f0',
                          display: 'block',
                        }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#94a3b8', marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <CalendarDays size={14} /> Registrado em {selectedRequest.date} às {selectedRequest.time}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinhasSolicitacoes;