import React, { useState } from 'react';
import { 
  Menu, Bell, Clock, AlertTriangle, CheckCircle2, ChevronRight, MapPin, 
  UploadCloud, X, Play, Image as ImageIcon, CheckCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css'; // reaproveitar layout base do sidebar
import './PainelFuncionario.css';

// Mock Tasks para o Funcionario (Equipe Técnica)
const initialTasks = [
  { id: 101, title: 'Infiltração grave no teto da sala', location: 'Apto 102 - Bloco A', status: 'Em Execução', sla: 'warning', hoursLeft: 12, category: 'Hidráulica' },
  { id: 102, title: 'Lâmpada do corredor 3º andar', location: 'Bloco B - 3º Andar', status: 'Pendente', sla: 'ok', hoursLeft: 48, category: 'Elétrica' },
  { id: 103, title: 'Portão da garagem não fecha', location: 'Portaria Principal', status: 'Em Execução', sla: 'danger', hoursLeft: -2, category: 'Infraestrutura' },
  { id: 104, title: 'Vazamento contínuo na pia', location: 'Apto 405 - Bloco C', status: 'Pendente', sla: 'warning', hoursLeft: 8, category: 'Hidráulica' },
  { id: 105, title: 'Manutenção Preventiva de Pintura', location: 'Hall de Entrada', status: 'Submetida p/ Aprovar', sla: 'ok', hoursLeft: 72, category: 'Limpeza' }
];

const PainelFuncionario = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Modal states
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Metrics
  const emExecucao = tasks.filter(t => t.status === 'Em Execução').length;
  const atrasadas = tasks.filter(t => t.sla === 'danger' && t.status !== 'Concluída').length;
  // Simulating that user completed 2 tasks today
  const concluidasHoje = 2; 

  const handleOpenModal = (task) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setComment('');
    setUploadedFiles([]);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
  };

  const handleUploadSimulate = (e) => {
      const files = Array.from(e.target.files);
      if(files.length > 0) {
          setUploadedFiles([...uploadedFiles, ...files.map(f => f.name)]);
      }
  };

  const saveTaskUpdate = (e) => {
    e.preventDefault();
    if (selectedTask) {
        setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, status: newStatus } : t));
        alert('Status da Tarefa atualizado com sucesso!');
        handleCloseModal();
    }
  };

  // Filter Logic
  const filteredTasks = tasks.filter(t => {
      if (activeFilter === 'Todas') return true;
      if (activeFilter === 'Pendentes') return t.status === 'Pendente';
      if (activeFilter === 'Em Execução') return t.status === 'Em Execução';
      if (activeFilter === 'Atrasadas') return t.sla === 'danger' && t.status !== 'Concluída';
      return true;
  });

  const getSlaClass = (sla) => {
    if (sla === 'ok') return 'sla-ok';
    if (sla === 'warning') return 'sla-warning';
    return 'sla-danger';
  };
  const getSlaTextClass = (sla) => {
    if (sla === 'ok') return 'sla-ok-text';
    if (sla === 'warning') return 'sla-warning-text';
    return 'sla-danger-text';
  };

  const getSlaIcon = (sla) => {
    if (sla === 'ok') return <CheckCircle2 size={16} />;
    if (sla === 'warning') return <Clock size={16} />;
    return <AlertTriangle size={16} />;
  };

  const formatHours = (hours) => {
      if (hours < 0) return `Atrasado há ${Math.abs(hours)}h`;
      return `Restam ${hours}h`;
  };

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
             <div className="header-breadcrumbs">
               <h2 className="header-title">Painel Operacional</h2>
            </div>
          </div>
          <div className="header-right">
             <NotificationMenu />
             <div className="user-profile-dropdown" onClick={() => navigate('/perfil')}>
                <div className="user-avatar"><span>{currentUser?.name?.charAt(0) || 'F'}</span></div>
             </div>
          </div>
        </header>

        <div className="dashboard-content-scroll pf-container">
            
            {/* Resumo */}
            <div className="pf-header">
                <h1 className="pf-title">Olá, {currentUser?.name?.split(' ')[0] || 'Técnico'}</h1>
                <p className="pf-subtitle">Aqui está o resumo do seu turno atual.</p>
            </div>

            <div className="pf-metrics-grid">
                <div className="pf-metric-card">
                    <div className="pf-metric-icon-box pf-metric-blue"><Play size={20} /></div>
                    <div className="pf-metric-info">
                        <h4>{emExecucao}</h4>
                        <span>Em Execução</span>
                    </div>
                </div>
                <div className="pf-metric-card" style={{ border: atrasadas > 0 ? '1px solid #fca5a5' : ''}}>
                    <div className="pf-metric-icon-box pf-metric-red"><AlertTriangle size={20} /></div>
                    <div className="pf-metric-info">
                        <h4 className="text-rose">{atrasadas}</h4>
                        <span className="text-rose">Atrasadas (SLA)</span>
                    </div>
                </div>
                <div className="pf-metric-card">
                    <div className="pf-metric-icon-box pf-metric-green"><CheckCircle size={20} /></div>
                    <div className="pf-metric-info">
                        <h4>{concluidasHoje}</h4>
                        <span>Concluídas Hoje</span>
                    </div>
                </div>
            </div>

            {/* List and Filters */}
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-slate-800)' }}>Minhas Tarefas</h3>
            
            <div className="pf-filters">
                {['Todas', 'Pendentes', 'Em Execução', 'Atrasadas'].map(filter => (
                    <button 
                       key={filter} 
                       className={`pf-filter-btn ${activeFilter === filter ? 'active' : ''}`}
                       onClick={() => setActiveFilter(filter)}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            <div className="pf-tasks-grid">
               {filteredTasks.length > 0 ? filteredTasks.map(task => (
                   <div key={task.id} className={`pf-task-card ${getSlaClass(task.sla)}`}>
                       <div className="pf-task-header">
                           <span className={`pf-status-badge ${
                               task.status === 'Pendente' ? 'pf-status-pendente' : 
                               task.status === 'Em Execução' ? 'pf-status-execucao' : 'pf-status-concluida'
                           }`}>
                               {task.status}
                           </span>
                           <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CÓD: #{task.id}</span>
                       </div>
                       
                       <h3 className="pf-task-title">{task.title}</h3>
                       
                       <div className="pf-task-location">
                           <MapPin size={14} /> {task.location}
                       </div>

                       <div className="pf-task-meta">
                           <div className={`pf-sla-tag ${getSlaTextClass(task.sla)}`}>
                               {getSlaIcon(task.sla)}
                               {formatHours(task.hoursLeft)}
                           </div>
                           
                           <button className="pf-btn-action" onClick={() => handleOpenModal(task)}>
                               Atualizar <ChevronRight size={16} />
                           </button>
                       </div>
                   </div>
               )) : (
                   <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                       Nenhuma tarefa encontrada neste filtro. Excelente trabalho!
                   </div>
               )}
            </div>

        </div>

        {/* Modal de Atualização de Status */}
        {selectedTask && (
            <div className="pf-modal-overlay">
                <div className="pf-modal">
                    <div className="pf-modal-header">
                        <h2 className="pf-modal-title">Atualizar Execução</h2>
                        <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
                    </div>
                    
                    <form onSubmit={saveTaskUpdate}>
                        <div className="pf-form-group">
                            <label>Atualizar Status</label>
                            
                            {(currentUser?.role === 'SINDICO' || currentUser?.role === 'ADMIN') ? (
                                <select className="pf-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                    <option value="Pendente">Pendente</option>
                                    <option value="Em Execução">Em Execução</option>
                                    <option value="Concluída">Concluída (Requer Validação)</option>
                                    <option value="Arquivada (Validado)">Arquivada / Aprovada</option>
                                    <option value="Cancelada">Cancelada</option>
                                </select>
                            ) : (
                                <>
                                    <select className="pf-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                        <option value="Pendente" disabled={selectedTask.status !== 'Pendente'}>Pendente</option>
                                        <option value="Em Execução">Em Execução (Iniciada)</option>
                                        <option value="Concluída">Concluída (Aguardando Validação do Síndico)</option>
                                    </select>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                                        <i>Nota: A validação final, alterações de prioridade ou cancelamento da atividade só podem ser realizadas pelo painel do Síndico.</i>
                                    </p>
                                </>
                            )}
                        </div>
                        
                        <div className="pf-form-group">
                            <label>Comentário Técnico (Opcional)</label>
                            <textarea 
                                className="pf-textarea" 
                                rows="3" 
                                placeholder="Descreva o que foi feito ou impeditivos..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="pf-form-group">
                            <label>Anexar Evidências (Fotos do serviço)</label>
                            <label className="pf-upload-btn">
                                <UploadCloud size={24} />
                                <span style={{ fontSize: '0.85rem' }}>Clique p/ enviar da Galeria ou Câmera</span>
                                <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleUploadSimulate}/>
                            </label>
                            {uploadedFiles.length > 0 && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {uploadedFiles.map((file, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                            <ImageIcon size={12}/> {file}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pf-modal-footer">
                            <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                            <button type="submit" className="btn-primary">Salvar Status e Fechar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default PainelFuncionario;
