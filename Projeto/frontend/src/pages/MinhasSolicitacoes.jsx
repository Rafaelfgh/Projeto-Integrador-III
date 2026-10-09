import React, { useState } from 'react';
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
import { useVisualizadorImagem } from '../contexts/visualizadorImagem';
import AtualizacaoOcorrencia from '../components/AtualizacaoOcorrencia';
import ConversaOcorrencia from '../components/ConversaOcorrencia';
import Janela from '../components/Janela';
import { carregarNomes, assinarEvidencias } from '../services/ocorrenciaService';
import { protocoloOcorrencia, protocoloReclamacao } from '../utils/protocolo';
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
  const [carga, setCarga] = useState('carregando'); // 'carregando' | 'ok' | 'erro'
  const [tentativa, setTentativa] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [aba, setAba] = useState('ocorrencias');          // 'ocorrencias' | 'reclamacoes'
  const [tipoOcorrencia, setTipoOcorrencia] = useState('todas'); // 'todas' | 'publicas' | 'pessoais'
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const abrirImagem = useVisualizadorImagem();
  const [nomes, setNomes] = useState({});
  const [fotos, setFotos] = useState({});
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
      case 'Em Andamento': return 'ms-status-yellow';
      case 'Resolvida': return 'ms-status-green';
      default: return '';
    }
  };

  React.useEffect(() => {
    async function fetchMyRequests() {
      if (!currentUser?.id) return;
      setCarga('carregando');

      const [{ data: occ, error: erroOcc }, { data: rec, error: erroRec }] = await Promise.all([
        supabase.from('Ocorrencias').select('*').eq('morador_id', currentUser.id).order('created_at', { ascending: false }),
        supabase.from('Reclamacoes').select('*').eq('morador_id', currentUser.id).order('created_at', { ascending: false }),
      ]);
      if (erroOcc || erroRec) {
        console.error('Erro ao buscar solicitações:', erroOcc || erroRec);
        setCarga('erro');
        return;
      }

      // Nomes (responsável, quem colocou em andamento, quem concluiu) e fotos das provas
      const [mapaNomes, mapaFotos] = await Promise.all([
        carregarNomes((occ || []).flatMap(o => [o.atribuido_a, o.andamento_por, o.concluida_por])),
        assinarEvidencias((occ || []).flatMap(o => o.conclusao_evidencias || [])),
      ]);
      setNomes(mapaNomes);
      setFotos(mapaFotos);

      let all = [];
      if (occ) {
        all = all.concat(occ.map(o => ({
          id: `o-${o.id}`,
          rawId: o.id,
          tipo: 'ocorrencia',
          protocol: protocoloOcorrencia(o.id, o.created_at),
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
          funcionarioNome: o.atribuido_a ? (mapaNomes[o.atribuido_a] || null) : null,
          pessoal: o.privacidade === 'pessoal',
          ocorrencia: o,
        })));
      }
      
      if (rec) {
        all = all.concat(rec.map(r => ({
          id: `r-${r.id}`,
          rawId: r.id,
          tipo: 'reclamacao',
          protocol: protocoloReclamacao(r.id, r.created_at),
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
      setCarga('ok');

      // Se a tela foi aberta via link com ?ocorrenciaId=, abre o modal já focado naquela ocorrência
      const ocorrenciaIdParam = searchParams.get('ocorrenciaId');
      if (ocorrenciaIdParam) {
        const match = all.find(r => r.tipo === 'ocorrencia' && String(r.rawId) === String(ocorrenciaIdParam));
        if (match) setSelectedRequest(match);
      }
      const reclamacaoIdParam = searchParams.get('reclamacaoId');
      if (reclamacaoIdParam) {
        const match = all.find(r => r.tipo === 'reclamacao' && String(r.rawId) === String(reclamacaoIdParam));
        if (match) {
          setAba('reclamacoes');
          setSelectedRequest(match);
        }
      }
    }
    fetchMyRequests();
  }, [currentUser?.id, searchParams, tentativa]);

  // Fecha o detalhe e tira do endereço o link da notificação (para poder abrir de novo)
  const fecharDetalhe = () => {
    setSelectedRequest(null);
    if (searchParams.get('ocorrenciaId') || searchParams.get('reclamacaoId')) setSearchParams({}, { replace: true });
  };

  // Subtelas: Ocorrências (públicas ou pessoais) e Reclamações
  const ocorrencias  = requestsList.filter(req => req.tipo === 'ocorrencia');
  const reclamacoes  = requestsList.filter(req => req.tipo === 'reclamacao');

  const filteredRequests = (aba === 'ocorrencias' ? ocorrencias : reclamacoes).filter(req => {
    const matchesSearch = req.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (aba === 'reclamacoes') return true;

    if (tipoOcorrencia === 'publicas' && req.pessoal) return false;
    if (tipoOcorrencia === 'pessoais' && !req.pessoal) return false;

    if (activeFilter === 'Todos') return true;
    if (activeFilter === 'Abertas') return req.status === 'Aberta';
    if (activeFilter === 'Em Análise') return req.status === 'Em Análise';
    if (activeFilter === 'Em Andamento') return req.status === 'Em Andamento';
    if (activeFilter === 'Concluídas') return req.status === 'Resolvida';
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

            {/* Subtelas */}
            <div className="ms-abas" role="tablist">
              <button role="tab" aria-selected={aba === 'ocorrencias'} className={aba === 'ocorrencias' ? 'ativa' : ''} onClick={() => setAba('ocorrencias')}>
                Ocorrências <span>{ocorrencias.length}</span>
              </button>
              <button role="tab" aria-selected={aba === 'reclamacoes'} className={aba === 'reclamacoes' ? 'ativa' : ''} onClick={() => setAba('reclamacoes')}>
                Reclamações <span>{reclamacoes.length}</span>
              </button>
            </div>

            {aba === 'ocorrencias' && (
              <>
                {/* Tipo: públicas (mural) ou pessoais (apartamento) */}
                <div className="ms-filters" aria-label="Tipo de ocorrência">
                  {[
                    { key: 'todas', label: 'Todas' },
                    { key: 'publicas', label: 'Públicas' },
                    { key: 'pessoais', label: 'Pessoais' },
                  ].map(t => (
                    <button
                      key={t.key}
                      className={`ms-filter-pill ${tipoOcorrencia === t.key ? 'active' : ''}`}
                      onClick={() => setTipoOcorrencia(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Status */}
                <div className="ms-filters" aria-label="Status">
                  {['Todos', 'Abertas', 'Em Análise', 'Em Andamento', 'Concluídas'].map(filter => (
                    <button
                      key={filter}
                      className={`ms-filter-pill ms-filter-pill-sec ${activeFilter === filter ? 'active' : ''}`}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Premium SaaS Cards Grid */}
            {carga === 'carregando' ? (
              <div className="ms-empty"><p className="ms-empty-desc">Carregando...</p></div>
            ) : carga === 'erro' ? (
              <ErroCarregamento onTentar={() => setTentativa(t => t + 1)} />
            ) : filteredRequests.length > 0 ? (
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
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className="ms-protocol-tag">{req.protocol}</span>
                          {req.tipo === 'ocorrencia' && (
                            <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '2px 8px', color: req.pessoal ? '#6d28d9' : '#0f766e', background: req.pessoal ? '#f5f3ff' : '#f0fdfa' }}>
                              {req.pessoal ? 'Pessoal' : 'Pública'}
                            </span>
                          )}
                        </div>
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

      {/* Janela de acompanhamento */}
      {selectedRequest && (
        <Janela
          icone={selectedRequest.tipo === 'reclamacao' ? ClipboardList : FileText}
          titulo={selectedRequest.title}
          subtitulo={selectedRequest.protocol}
          onFechar={fecharDetalhe}
          fecharAoClicarFora
          rodape={<button type="button" className="janela-btn janela-btn-sec" onClick={fecharDetalhe}>Fechar</button>}
        >
          <div>
            <span className={`ms-status ${getStatusClass(selectedRequest.status)}`} style={{ display: 'inline-flex' }}>
              {selectedRequest.status}
            </span>

            {selectedRequest.tipo === 'ocorrencia' && renderModalTimeline(selectedRequest)}

            {selectedRequest.description && (
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginTop: '1rem' }}>
                {selectedRequest.description}
              </p>
            )}

            {selectedRequest.tipo === 'ocorrencia' && (
              <div style={{ marginTop: '1rem' }}>
                <AtualizacaoOcorrencia ocorrencia={selectedRequest.ocorrencia} nomes={nomes} fotos={fotos} />
              </div>
            )}

            {selectedRequest.tipo === 'ocorrencia' && selectedRequest.pessoal && (
              <p style={{ fontSize: '0.8rem', color: '#6d28d9', marginTop: '0.75rem' }}>
                Ocorrência pessoal: só você, o síndico e o funcionário encaminhado veem.
              </p>
            )}

            {selectedRequest.tipo === 'ocorrencia' && selectedRequest.pessoal && (
              <ConversaOcorrencia ocorrencia={selectedRequest.ocorrencia} />
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
                    <button
                      key={idx}
                      type="button" className="img-zoom"
                      title="Ampliar foto"
                      onClick={() => abrirImagem(selectedRequest.anexos, idx)}
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
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#94a3b8', marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <CalendarDays size={14} /> Registrado em {selectedRequest.date} às {selectedRequest.time}
            </div>
          </div>
        </Janela>
      )}
    </div>
  );
};

export default MinhasSolicitacoes;