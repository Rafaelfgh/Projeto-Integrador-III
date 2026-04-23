import React, { useState } from 'react';
import { 
  Menu, Bell, Clock, AlertTriangle, CheckCircle2, ChevronRight, MapPin, 
  UploadCloud, X, Play, Image as ImageIcon, CheckCircle, MessageSquare, AlertCircle, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';
import './PainelFuncionario.css';

// Mock Tasks para o Funcionario (Equipe Técnica)
// Simulando dados do Brasil e SLAs
const initialTasks = [
  { 
    id: 101, title: 'Vazamento no banheiro do apto 304', location: 'Apto 304 - Bloco B', 
    status: 'Em andamento', sla: 'danger', hoursLeft: -2, category: 'Hidráulica', 
    assigneeName: 'Maria Manutenção',
    unreadComments: 1,
    history: [
      { id: 1, author: 'Maria Manutenção', time: 'Ontem, 14:00', text: 'Iniciei a quebra da parede para achar o cano furado.' },
      { id: 2, author: 'Roberto Síndico', time: 'Hoje, 09:00', text: 'Maria, qual a previsão? O morador está cobrando.' }
    ]
  },
  { 
    id: 102, title: 'Curto-circuito nas arandelas do Hall', location: 'Hall de Entrada - Bloco A', 
    status: 'Pendente', sla: 'warning', hoursLeft: 4, category: 'Elétrica', 
    assigneeName: 'Maria Manutenção',
    unreadComments: 0, history: []
  },
  { 
    id: 103, title: 'Limpeza pós-obra na garagem', location: 'Garagem Subsolo 2', 
    status: 'Finalizada', sla: 'ok', hoursLeft: 48, category: 'Limpeza', 
    assigneeName: 'Maria Manutenção',
    unreadComments: 0,
    history: [
      { id: 1, author: 'Maria Manutenção', time: 'Hoje, 10:30', text: 'Serviço concluído, entulho removido.' }
    ]
  },
  { 
    id: 104, title: 'Desentupir ralo da lavanderia coletiva', location: 'Área Comum - Cobertura', 
    status: 'Pendente', sla: 'ok', hoursLeft: 24, category: 'Hidráulica', 
    assigneeName: 'Maria Manutenção',
    unreadComments: 0, history: []
  },
  { 
    id: 105, title: 'Troca de fechadura da portaria', location: 'Portaria Principal', 
    status: 'Pendente', sla: 'danger', hoursLeft: -5, category: 'Infraestrutura', 
    assigneeName: 'João Silva', // Outro funcionário
    unreadComments: 0, history: []
  }
];

const PainelFuncionario = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeFilter, setActiveFilter] = useState('Todas');
  
  // Modal states
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(''); // 'Em andamento', 'Finalizada', 'Não concluída'
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [reschedule, setReschedule] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Filtrar APENAS as tarefas atribuídas ao usuário logado
  const myTasks = tasks.filter(t => t.assigneeName === (currentUser?.name || 'Maria Manutenção'));

  // Metrics baseadas apenas nas minhas tarefas
  const emAndamentoCount = myTasks.filter(t => t.status === 'Em andamento').length;
  const atrasadasCount = myTasks.filter(t => t.hoursLeft < 0 && t.status !== 'Finalizada').length;
  const concluidasHojeCount = myTasks.filter(t => t.status === 'Finalizada').length; 

  const handleOpenModal = (task) => {
    setSelectedTask(task);
    setSelectedStatus(task.status === 'Pendente' ? 'Em andamento' : task.status);
    setComment('');
    setReason('');
    setReschedule(false);
    setUploadedFiles([]);

    // Clear unread indicator when opening
    if(task.unreadComments > 0) {
       setTasks(tasks.map(t => t.id === task.id ? { ...t, unreadComments: 0 } : t));
    }
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
        if (selectedStatus === 'Não concluída' && reason.trim() === '') {
            alert('Por favor, informe o motivo da não conclusão.');
            return;
        }

        const newHistory = [...selectedTask.history];
        if (comment.trim()) {
           newHistory.push({ id: Date.now(), author: currentUser?.name || 'Técnico', time: 'Agora mesmo', text: comment });
        }
        if (selectedStatus === 'Não concluída') {
           newHistory.push({ id: Date.now()+1, author: currentUser?.name || 'Técnico', time: 'Agora mesmo', text: `[NÃO CONCLUÍDA] Motivo: ${reason}` });
        }

        setTasks(tasks.map(t => t.id === selectedTask.id ? { 
            ...t, 
            status: selectedStatus,
            history: newHistory
        } : t));
        alert('Tarefa atualizada com sucesso!');
        handleCloseModal();
    }
  };

  // Quick Action: Marcar como finalizada diretamente do card
  const quickFinish = (taskId, e) => {
      e.stopPropagation(); // Evita abrir o modal se clicar no botão
      if(window.confirm("Confirmar finalização rápida desta tarefa?")) {
         setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'Finalizada' } : t));
      }
  };

  // Filter Logic over myTasks
  const filteredTasks = myTasks.filter(t => {
      if (activeFilter === 'Todas') return true;
      if (activeFilter === 'Pendentes') return t.status === 'Pendente';
      if (activeFilter === 'Em andamento') return t.status === 'Em andamento';
      if (activeFilter === 'Finalizadas') return t.status === 'Finalizada';
      if (activeFilter === 'Atrasadas') return t.hoursLeft < 0 && t.status !== 'Finalizada';
      return true;
  });

  const getSlaClass = (task) => {
    if (task.status === 'Finalizada') return 'sla-ok';
    if (task.hoursLeft < 0) return 'sla-danger';
    if (task.hoursLeft <= 12) return 'sla-warning';
    return 'sla-ok';
  };

  const getSlaTextClass = (task) => {
    if (task.status === 'Finalizada') return 'sla-ok-text';
    if (task.hoursLeft < 0) return 'sla-danger-text';
    if (task.hoursLeft <= 12) return 'sla-warning-text';
    return 'sla-ok-text';
  };

  const formatHours = (task) => {
      if (task.status === 'Finalizada') return 'Concluída no prazo';
      if (task.hoursLeft < 0) return `Atrasado há ${Math.abs(task.hoursLeft)}h`;
      return `Restam ${task.hoursLeft}h`;
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
               <h2 className="header-title">Minhas Tarefas</h2>
               <p className="header-date">Operacional</p>
            </div>
          </div>
          <div className="header-right">
             <NotificationMenu />
             <div className="user-profile-dropdown" onClick={() => navigate('/perfil')} style={{cursor:'pointer'}}>
                <div className="user-avatar" style={{background:'#16a34a'}}><span>{currentUser?.name?.charAt(0) || 'F'}</span></div>
             </div>
          </div>
        </header>

        <div className="dashboard-content-scroll pf-container">
            
            {/* Resumo */}
            <div className="pf-header">
                <h1 className="pf-title">Olá, {currentUser?.name?.split(' ')[0] || 'Técnico'}!</h1>
                <p className="pf-subtitle">Aqui está o resumo do seu turno atual. Você tem {myTasks.filter(t=>t.status !== 'Finalizada').length} tarefas pendentes.</p>
            </div>

            <div className="pf-metrics-grid">
                <div className="pf-metric-card">
                    <div className="pf-metric-icon-box pf-metric-blue"><Play size={20} /></div>
                    <div className="pf-metric-info">
                        <h4>{emAndamentoCount}</h4>
                        <span>Em Andamento</span>
                    </div>
                </div>
                <div className="pf-metric-card" style={{ border: atrasadasCount > 0 ? '1px solid #fca5a5' : ''}}>
                    <div className="pf-metric-icon-box pf-metric-red"><AlertTriangle size={20} /></div>
                    <div className="pf-metric-info">
                        <h4 className="text-rose">{atrasadasCount}</h4>
                        <span className="text-rose">Atrasadas (SLA)</span>
                    </div>
                </div>
                <div className="pf-metric-card">
                    <div className="pf-metric-icon-box pf-metric-green"><CheckCircle size={20} /></div>
                    <div className="pf-metric-info">
                        <h4>{concluidasHojeCount}</h4>
                        <span>Concluídas Hoje</span>
                    </div>
                </div>
            </div>

            {/* List and Filters */}
            <div className="pf-filters">
                {['Todas', 'Pendentes', 'Em andamento', 'Finalizadas', 'Atrasadas'].map(filter => (
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
                   <div key={task.id} className={`pf-task-card ${getSlaClass(task)}`} onClick={() => handleOpenModal(task)} style={{cursor: 'pointer'}}>
                       <div className="pf-task-header">
                           <span className={`pf-status-badge ${
                               task.status === 'Pendente' ? 'status-aberta' : 
                               task.status === 'Em andamento' ? 'status-andamento' : 
                               task.status === 'Não concluída' ? 'status-naoconcluida' : 'status-finalizada'
                           }`}>
                               {task.status}
                           </span>
                           <span className="pf-task-category">{task.category}</span>
                       </div>
                       
                       <h3 className="pf-task-title">{task.title}</h3>
                       
                       <div className="pf-task-location">
                           <MapPin size={14} /> {task.location}
                       </div>

                       <div className="pf-task-meta">
                           <div className={`pf-sla-tag ${getSlaTextClass(task)}`}>
                               {task.status === 'Finalizada' ? <CheckCircle2 size={16}/> : (task.hoursLeft < 0 ? <AlertTriangle size={16}/> : <Clock size={16}/>)}
                               {formatHours(task)}
                           </div>
                           
                           <div className="pf-quick-actions">
                               {task.unreadComments > 0 && (
                                   <button className="btn-icon-round" title="Novos Comentários">
                                       <MessageSquare size={16} />
                                       <span className="unread-dot"></span>
                                   </button>
                               )}
                               {task.status !== 'Finalizada' && (
                                   <button className="btn-icon-round finish" title="Finalizar Rápido" onClick={(e) => quickFinish(task.id, e)}>
                                       <CheckCircle2 size={18} />
                                   </button>
                               )}
                           </div>
                       </div>
                   </div>
               )) : (
                   <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '12px', gridColumn: '1 / -1' }}>
                       Nenhuma tarefa encontrada neste filtro. Excelente trabalho!
                   </div>
               )}
            </div>

        </div>

        {/* Modal de Detalhes e Execução */}
        {selectedTask && (
            <div className="pf-modal-overlay">
                <div className="pf-modal">
                    <div className="pf-modal-header">
                        <div>
                           <h2 className="pf-modal-title">Ordem de Serviço #{selectedTask.id}</h2>
                           <p className="pf-modal-subtitle">{selectedTask.title} • {selectedTask.location}</p>
                        </div>
                        <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
                    </div>
                    
                    <div className="pf-modal-body">
                       <form id="task-form" onSubmit={saveTaskUpdate}>
                           
                           <div className="pf-form-group">
                               <label>Marcar Status</label>
                               <div className="status-options-grid">
                                   <div className={`status-option-btn ${selectedStatus === 'Em andamento' ? 'active-andamento' : ''}`} onClick={() => setSelectedStatus('Em andamento')}>
                                      <Play size={20} /> Em andamento
                                   </div>
                                   <div className={`status-option-btn ${selectedStatus === 'Finalizada' ? 'active-finalizada' : ''}`} onClick={() => setSelectedStatus('Finalizada')}>
                                      <CheckCircle2 size={20} /> Finalizada
                                   </div>
                                   <div className={`status-option-btn ${selectedStatus === 'Não concluída' ? 'active-naoconcluida' : ''}`} onClick={() => setSelectedStatus('Não concluída')}>
                                      <X size={20} /> Não concluída
                                   </div>
                               </div>
                           </div>
                           
                           {/* Mostrar campos adicionais dependendo do Status */}
                           {selectedStatus === 'Não concluída' && (
                               <div className="alert-danger-box">
                                   <AlertCircle size={24} color="#dc2626" style={{flexShrink:0}}/>
                                   <div style={{flex: 1}}>
                                       <label style={{display:'block', fontWeight:700, fontSize:'0.85rem', color:'#991b1b', marginBottom:'0.5rem'}}>Motivo obrigatório</label>
                                       <textarea 
                                           className="pf-textarea" 
                                           style={{borderColor:'#fca5a5', background:'white'}}
                                           placeholder="Ex: Morador não estava em casa, falta de peça..."
                                           value={reason} onChange={e => setReason(e.target.value)}
                                           required
                                       ></textarea>
                                       <label style={{display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.75rem', fontSize:'0.85rem', cursor:'pointer'}}>
                                           <input type="checkbox" checked={reschedule} onChange={e=>setReschedule(e.target.checked)}/> Solicitar reagendamento para o síndico
                                       </label>
                                   </div>
                               </div>
                           )}

                           {selectedStatus === 'Finalizada' && (
                               <div className="pf-form-group">
                                   <label>Anexar Evidências (Obrigatório foto do serviço concluído)</label>
                                   <label className="pf-upload-area">
                                       <UploadCloud size={32} color="#64748b" style={{marginBottom:'0.5rem'}}/>
                                       <span style={{ display:'block', fontSize: '0.9rem', fontWeight:600, color:'#1e293b' }}>Clique para enviar foto</span>
                                       <span style={{ fontSize: '0.75rem', color:'#64748b' }}>Galeria ou Câmera do celular</span>
                                       <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleUploadSimulate}/>
                                   </label>
                                   {uploadedFiles.length > 0 && (
                                       <div className="pf-file-list">
                                           {uploadedFiles.map((file, i) => (
                                               <div key={i} className="pf-file-item">
                                                   <span style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><ImageIcon size={14} color="#4f46e5"/> {file}</span>
                                                   <button type="button" style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer'}} onClick={() => setUploadedFiles(uploadedFiles.filter((_, idx)=>idx!==i))}><X size={14}/></button>
                                               </div>
                                           ))}
                                       </div>
                                   )}
                               </div>
                           )}

                           {(selectedStatus === 'Em andamento' || selectedStatus === 'Finalizada') && (
                               <div className="pf-form-group">
                                   <label>Adicionar Comentário / Reporte Extra</label>
                                   <textarea 
                                       className="pf-textarea" 
                                       placeholder="Reporte algo adicional ao síndico..."
                                       value={comment} onChange={e => setComment(e.target.value)}
                                   ></textarea>
                               </div>
                           )}
                       </form>

                       {/* Histórico da Ocorrência */}
                       {selectedTask.history.length > 0 && (
                           <div className="pf-comments-log">
                               <h4 style={{fontSize:'0.9rem', margin:'0 0 1rem 0', color:'#1e293b'}}>Histórico de Ações</h4>
                               {selectedTask.history.map(item => (
                                   <div key={item.id} className="pf-comment-item">
                                       <div className="pf-comment-avatar">{item.author.charAt(0)}</div>
                                       <div className="pf-comment-bubble">
                                           <div className="pf-comment-header">
                                               <span className="pf-comment-name">{item.author}</span>
                                               <span className="pf-comment-time">{item.time}</span>
                                           </div>
                                           <p className="pf-comment-text">{item.text}</p>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       )}

                    </div>
                    
                    <div className="pf-modal-footer">
                        <button type="button" className="btn-outline-primary" onClick={handleCloseModal}>Cancelar</button>
                        <button type="submit" form="task-form" className="btn-saas-primary" style={{background:'#16a34a'}}>Salvar Alterações</button>
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default PainelFuncionario;
