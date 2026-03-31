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
import './Dashboard.css';
import './FeedOcorrencias.css';

// Mock data structured for a SaaS ticket feed
const feedData = [
  { 
    id: 1, 
    userInitial: 'M', 
    userName: 'Maria Santos', 
    role: 'Bloco A, 302', 
    timeAgo: 'Há 2 horas',
    title: 'Limpeza do hall de entrada no Bloco A', 
    description: 'A área comum do hall de entrada está necessitando de uma limpeza mais profunda, especialmente próximo aos elevadores onde há marcas de sujeira recorrentes.',
    category: 'Limpeza', 
    status: 'Aberta', 
    upvotes: 12,
    comments: 3
  },
  { 
    id: 2, 
    userInitial: 'A', 
    userName: 'Anônimo', 
    role: 'Condômino', 
    timeAgo: 'Há 5 horas',
    title: 'Veículo estacionado fora da vaga (Garagem subsolo)', 
    description: 'Um veículo SUV preto está frequentemente estacionando ocupando parte da faixa de pedestres no subsolo 1, dificultando a manobra dos demais.',
    category: 'Outros', 
    status: 'Em Análise',
    upvotes: 45,
    comments: 8
  },
  { 
    id: 3, 
    userInitial: 'C', 
    userName: 'Carlos Lima', 
    role: 'Bloco C, 105', 
    timeAgo: 'Ontem',
    title: 'Oscilação de energia nos andares baixos do Bloco C', 
    description: 'Estou notando que durante a noite as luzes oscilam de forma intermitente. Já conversei com o vizinho do 104 e ele relatou o mesmo problema.',
    category: 'Elétrica', 
    status: 'Resolvida',
    upvotes: 21,
    comments: 5
  },
  { 
    id: 4, 
    userInitial: 'R', 
    userName: 'Roberto Silva', 
    role: 'Síndico', 
    timeAgo: 'Ontem',
    title: 'Manutenção preventiva das bombas d\'água concluída', 
    description: 'Informo a todos que a manutenção preventiva semestral das bombas hidráulicas de todos os blocos foi concluída com sucesso sem necessidade de corte no fornecimento.',
    category: 'Hidráulica', 
    status: 'Resolvida',
    upvotes: 89,
    comments: 12
  },
];

const FeedOcorrencias = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos os status');
  const [categoryFilter, setCategoryFilter] = useState('Todas as categorias');
  const navigate = useNavigate();

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

  const filteredFeed = feedData.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos os status' || ticket.status === statusFilter;
    const matchesCat = categoryFilter === 'Todas as categorias' || ticket.category === categoryFilter;
    
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
            <div>
              <h2 className="header-title">Feed do Condomínio</h2>
              <p className="header-subtitle">Acompanhe os chamados públicos e engaje com a comunidade</p>
            </div>
          </div>

          <div className="header-right">
            <div className="header-search" style={{ marginRight: '1rem' }}>
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Buscar no feed..." className="search-input" />
            </div>

            <NotificationMenu />

            <div className="user-profile-dropdown" onClick={() => navigate('/perfil')} style={{ cursor: 'pointer' }}>
              <div className="user-avatar">
                 <span>M</span>
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
                    <option>Hidráulica</option>
                    <option>Elétrica</option>
                    <option>Barulho</option>
                    <option>Limpeza</option>
                    <option>Outros</option>
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
