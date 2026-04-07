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
import './Dashboard.css';
import './MinhasSolicitacoes.css';

const mockRequests = [
  { id: 1, protocol: 'REQ-2026-089', title: 'Infiltração grave no teto da sala e corredor', category: 'Hidráulica', status: 'Em Análise', date: '15/03/2026', time: '14:30', author: 'João Morador' },
  { id: 2, protocol: 'REQ-2026-075', title: 'Morador do 402 com som alto durante toda madrugada', category: 'Barulho', status: 'Aberta', date: '12/03/2026', time: '22:45', author: 'Maria Funcionária' },
  { id: 3, protocol: 'REQ-2026-041', title: 'Lâmpada do corredor do 3º andar queimada', category: 'Elétrica', status: 'Resolvida', date: '05/03/2026', time: '09:15', author: 'João Morador' },
  { id: 4, protocol: 'REQ-2026-036', title: 'Vazamento contínuo na pia da cozinha', category: 'Hidráulica', status: 'Resolvida', date: '01/03/2026', time: '11:00', author: 'Outro Morador' },
  { id: 5, protocol: 'REQ-2026-012', title: 'Lixo deixado no hall de entrada fora do horário', category: 'Limpeza', status: 'Resolvida', date: '20/02/2026', time: '08:00', author: 'Outro Morador' },
  { id: 6, protocol: 'REQ-2026-005', title: 'Portão da garagem do subsolo travando', category: 'Outros', status: 'Resolvida', date: '10/02/2026', time: '18:20', author: 'João Morador' },
];

const MinhasSolicitacoes = () => {
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
    switch(cat) {
      case 'Hidráulica': return { icon: <Droplet size={20} strokeWidth={2.5}/>, class: 'ms-icon-blue' };
      case 'Elétrica': return { icon: <Zap size={20} strokeWidth={2.5}/>, class: 'ms-icon-yellow' };
      case 'Barulho': return { icon: <Volume2 size={20} strokeWidth={2.5}/>, class: 'ms-icon-red' };
      case 'Limpeza': return { icon: <Trash2 size={20} strokeWidth={2.5}/>, class: 'ms-icon-green' };
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

  const filteredRequests = mockRequests.filter(req => {
    // Isolamento de dados (Row Level Security - Mock)
    if (currentUser?.role === 'MORADOR' && req.author !== currentUser?.name) {
      return false;
    }

    const matchesSearch = req.protocol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeFilter === 'Todos') return true;
    if (activeFilter === 'Abertas') return req.status === 'Aberta';
    if (activeFilter === 'Em Análise') return req.status === 'Em Análise';
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
            <div>
              <h2 className="header-title">Minhas Solicitações</h2>
              <p className="header-subtitle">Acompanhe o status e histórico dos seus chamados</p>
            </div>
          </div>
          
          <div className="header-right">
            <NotificationMenu />
            <div className="user-profile-dropdown" onClick={() => navigate('/perfil')} style={{ cursor: 'pointer' }}>
              <div className="user-avatar">
                 <span>M</span>
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
                          {req.status === 'Em Análise' && <div style={{width: 6, height: 6, borderRadius: '50%', backgroundColor: '#d97706'}}></div>}
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
