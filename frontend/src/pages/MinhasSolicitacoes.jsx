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
  FolderOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationMenu from '../components/NotificationMenu';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import './Dashboard.css';
import './MinhasSolicitacoes.css';

const MinhasSolicitacoes = () => {
  const [requestsList, setRequestsList] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const navigate = useNavigate();
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
        
      let all = [];
      if (occ) {
        all = all.concat(occ.map(o => ({
          id: `o-${o.id}`,
          protocol: `OCO-${new Date(o.created_at).getFullYear()}-${o.id.toString().padStart(4, '0')}`,
          title: o.titulo,
          category: o.categoria || 'Outros',
          status: o.status || 'Aberta',
          date: new Date(o.created_at).toLocaleDateString(),
          time: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: currentUser.name,
          timestamp: new Date(o.created_at).getTime()
        })));
      }
      
      if (rec) {
        all = all.concat(rec.map(r => ({
          id: `r-${r.id}`,
          protocol: `REC-${new Date(r.created_at).getFullYear()}-${r.id.toString().padStart(4, '0')}`,
          title: 'Reclamação Particular',
          category: 'reclamacao',
          status: r.status || 'Aberta',
          date: new Date(r.created_at).toLocaleDateString(),
          time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: currentUser.name,
          timestamp: new Date(r.created_at).getTime()
        })));
      }
      
      all.sort((a, b) => b.timestamp - a.timestamp);
      setRequestsList(all);
    }
    fetchMyRequests();
  }, [currentUser?.id]);

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
                        <div className="ms-card-action">
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
    </div>
  );
};

export default MinhasSolicitacoes;
