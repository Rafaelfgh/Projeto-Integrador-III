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
  Filter,
  Clock,
  ArrowUpCircle,
  MessageSquare,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationMenu from '../components/NotificationMenu';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import './Dashboard.css';
import './FeedOcorrencias.css';

const CATEGORIA_LABEL = {
  'hidraulica':   '💧 Hidráulica',
  'manutencao':   '🔧 Manutenção',
  'limpeza':      '🧹 Limpeza',
  'jardinagem':   '🌿 Jardinagem',
  'seguranca':    '🛡️ Segurança',
  'areas_comuns': '🏢 Áreas Comuns',
  'estrutural':   '🏗️ Estrutural',
  'barulho':      '🔊 Barulho/Perturbação',
  'garagem':      '🅿️ Garagem/Estacionamento',
};

const FeedOcorrencias = () => {
  const [feedList, setFeedList] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos os status');
  const [categoryFilter, setCategoryFilter] = useState('Todas as categorias');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const getStatusClass = (status) => {
    switch(status) {
      case 'Aberta': return 'f-status-red';
      case 'Em Análise': return 'f-status-yellow';
      case 'Resolvida': return 'f-status-green';
      default: return '';
    }
  };

  const getCategoryClass = (cat) => {
    switch(cat) {
      case 'Hidráulica': return 'feed-tag-blue';
      case 'Elétrica': return 'feed-tag-orange';
      case 'Barulho': return 'feed-tag-red';
      case 'Limpeza': return 'feed-tag-green';
      default: return 'feed-tag-purple';
    }
  };

  React.useEffect(() => {
    async function fetchFeed() {
      if (!currentUser?.condominio_id) return;
      
      // Busca apenas ocorrências marcadas como "mural" (públicas)
      const { data: occ } = await supabase.from('Ocorrencias')
        .select('*, Moradores(nome, bloco, apartamento)')
        .eq('condominio_id', currentUser.condominio_id)
        .eq('privacidade', 'mural')
        .order('created_at', { ascending: false });
        
      if (occ) {
        const formatadas = occ.map(o => ({
          id: o.id,
          userInitial: o.Moradores?.nome?.charAt(0) || 'M',
          userName: o.Moradores?.nome || 'Morador',
          role: o.Moradores ? `Bloco ${o.Moradores.bloco}, Apt ${o.Moradores.apartamento}` : 'Condômino',
          timeAgo: new Date(o.created_at).toLocaleDateString(),
          title: o.titulo,
          description: o.descricao,
          category: CATEGORIA_LABEL[o.categoria] || o.categoria || 'Outros',
          rawCategory: o.categoria || 'Outros',
          status: o.status || 'Aberta',
          upvotes: 0,
          comments: 0
        }));
        setFeedList(formatadas);
      }
    }
    fetchFeed();
  }, [currentUser?.condominio_id]);

  const filteredFeed = feedList.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos os status' || ticket.status === statusFilter;
    
    // Simplificando o filtro de categoria para bater com o select
    const matchesCat = categoryFilter === 'Todas as categorias' || 
                       ticket.rawCategory.toLowerCase().includes(categoryFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesCat;
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
              <h2 className="header-title">Feed do Condomínio</h2>
              <p className="header-date">Acompanhe os chamados públicos e engaje com a comunidade</p>
            </div>
          </div>

          <div className="header-right">
            <div className="header-search" style={{ marginRight: '1rem' }}>
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Buscar no feed..." className="search-input" />
            </div>

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

        {/* Content Box */}
        <div className="dashboard-content-scroll" style={{ backgroundColor: '#f8fafc' }}>
          <div className="feed-container">
            
            {/* Filter Hub */}
            <div className="feed-filter-box">
              <div className="feed-filter-top">
                <div className="feed-search-wrapper">
                  <Search size={18} className="feed-search-icon" />
                  <input 
                    type="text" 
                    className="feed-search-input" 
                    placeholder="Pesquisar no mural..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="feed-filter-dropdowns">
                  <select 
                    className="feed-select" 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>Todos os status</option>
                    <option>Aberta</option>
                    <option>Em Análise</option>
                    <option>Resolvida</option>
                  </select>
                  <select 
                    className="feed-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option>Todas as categorias</option>
                    <option value="hidraulica">Hidráulica</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="limpeza">Limpeza</option>
                    <option value="jardinagem">Jardinagem</option>
                    <option value="seguranca">Segurança</option>
                    <option value="estrutural">Estrutural</option>
                    <option value="barulho">Barulho</option>
                    <option value="garagem">Garagem</option>
                    <option value="areas_comuns">Áreas Comuns</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ticket List */}
            {filteredFeed.length > 0 ? (
              <div className="feed-ticket-list">
                {filteredFeed.map(ticket => (
                  <div key={ticket.id} className="feed-ticket">
                    {/* Header */}
                    <div className="feed-ticket-header">
                      <div className="feed-user-info">
                        <div className="feed-user-avatar">{ticket.userInitial}</div>
                        <div className="feed-user-meta">
                          <span className="feed-user-name">{ticket.userName}</span>
                          <span className="feed-post-time">
                            <Clock size={12} /> {ticket.timeAgo} • <MapPin size={12} style={{marginLeft: 2}}/> {ticket.role}
                          </span>
                        </div>
                      </div>
                      <div className={`feed-ticket-status ${getStatusClass(ticket.status)}`}>
                        <div className="status-dot"></div>
                        {ticket.status}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="feed-ticket-body">
                      <h4 className="feed-ticket-title">{ticket.title}</h4>
                      <p className="feed-ticket-desc">{ticket.description}</p>
                    </div>

                    {/* Footer Actions */}
                    <div className="feed-ticket-footer">
                      <div className="feed-tags">
                        <span className={`feed-tag ${getCategoryClass(ticket.category)}`}>
                          {ticket.category}
                        </span>
                      </div>
                      <div className="feed-actions">
                        <button className="btn-feed-action btn-feed-primary">
                          <ArrowUpCircle size={16} /> 
                          Apoiar ({ticket.upvotes})
                        </button>
                        <button className="btn-feed-action">
                          <MessageSquare size={16} /> 
                          Comentar ({ticket.comments})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="feed-empty">
                <Filter size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                <h4 style={{ fontSize: '1.125rem', color: '#475569', marginBottom: '0.5rem' }}>Nenhum relato encontrado</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Tente alterar os filtros de busca para visualizar mais informações.</p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default FeedOcorrencias;
