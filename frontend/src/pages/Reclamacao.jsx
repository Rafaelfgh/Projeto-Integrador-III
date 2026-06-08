import React, { useState, useRef } from 'react';
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
  UploadCloud,
  Image as ImageIcon,
  Film,
  CheckCircle2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationMenu from '../components/NotificationMenu';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { criarNotificacao } from '../services/notificationService';
import { supabase } from '../backend/supabaseClient';
import './Dashboard.css';
import './Ocorrencia.css'; // Usa o mesmo CSS SaaS de Ocorrência

const Reclamacao = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [visibility, setVisibility] = useState('sindico');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Zone Handlers
  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = function(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles).map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type
    }));
    setFiles(prev => [...prev, ...fileArray]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };
  
  const onButtonClick = () => {
    inputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.target);
      const tipo = formData.get('tipo');
      const unidade = formData.get('unidade');
      const data_violacao = formData.get('data_violacao');
      const hora = formData.get('hora_violacao');
      const descText = formData.get('descricao');

      const descricaoCompleta = `Tipo de Violação: ${tipo}\nData: ${data_violacao}\nHora: ${hora}\n\nDescrição do Morador:\n${descText}`;

      // 1. Upload dos anexos (Fotos/Vídeos)
      const uploadedUrls = [];
      for (const fileObj of files) {
        const fileExt = fileObj.name.split('.').pop();
        const fileName = `reclamacao-${currentUser.id}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('anexos')
          .upload(fileName, fileObj.file);
          
        if (uploadError) {
          console.error('Erro no upload', uploadError);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage.from('anexos').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      // 2. Inserir no Banco de Dados
      const { data, error } = await supabase.from('Reclamacoes').insert({
        descricao: descricaoCompleta,
        apartamento_denunciado: unidade,
        bloco_denunciado: 'Ver unidade', // Como o input é livre, salva em um só
        morador_id: currentUser.id,
        condominio_id: currentUser.condominio_id,
        anexos: uploadedUrls
      }).select();

      if (error) throw error;
      
      // Notificar síndico
      await criarNotificacao({
        destinatario_id: 'sindico-mock-id',
        condominio_id: currentUser.condominio_id,
        tipo: 'NOVA_OCORRENCIA',
        titulo: 'Nova Reclamação Particular',
        descricao: `Uma nova reclamação foi registrada de forma sigilosa.`,
        referencia_tipo: 'reclamacao',
        referencia_id: data[0]?.id,
        remetente_id: currentUser?.id,
        remetente_nome: currentUser?.name || 'Morador'
      });

      alert('Reclamação registrada com absoluto sigilo!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar reclamação: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Sidebar - Padrão SaaS */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="header-breadcrumbs">
               <h2 className="header-title">Reclamação Particular</h2>
               <p className="header-date">Reportar problemas e violações de regras</p>
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

        {/* Scaffold de Conteúdo SaaS */}
        <div className="dashboard-content-scroll form-page-bg">
          <div className="dashboard-content-inner centered-form-layout">
            
            <div className="saas-card-container">
              
              <div className="form-alert-info" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
                 <AlertTriangle size={18} className="info-icon" style={{ color: '#d97706' }} />
                 <div>
                    <h4 style={{ color: '#92400e' }}>Aviso de Sigilo</h4>
                    <p style={{ color: '#b45309' }}>Toda reclamação sobre vizinhos é tratada com <strong>total sigilo</strong>. Não exponha incidentes no Mural. O síndico analisará as evidências formadas antes de aplicar multas ou advertências.</p>
                 </div>
              </div>

              <form className="saas-occurrence-form" onSubmit={handleSubmit}>
                
                {/* 1. Detalhes da Reclamação */}
                <div className="form-section">
                  <div className="section-header-block">
                     <span className="section-step-badge" style={{ backgroundColor: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }}>1</span>
                     <h3 className="section-heading">Identificação do Problema</h3>
                  </div>
                  
                  <div className="saas-grid">
                    <div className="saas-input-group">
                      <label>Tipo de Violação <span className="req">*</span></label>
                      <select name="tipo" required className="saas-select" defaultValue="">
                        <option value="" disabled>Selecione o tipo de reclamação</option>
                        <option value="barulho">🔊 Barulho Fora do Horário Permitido</option>
                        <option value="lixo">🗑️ Descarte Irregular de Lixo</option>
                        <option value="estacionamento">🚗 Uso Indevido de Vaga de Garagem</option>
                        <option value="pets">🐕 Problemas com Pets</option>
                        <option value="outro">Outro (especifique na descrição)</option>
                      </select>
                    </div>

                    <div className="saas-input-group">
                      <label>Unidade Envolvida <span className="req">*</span></label>
                      <input type="text" name="unidade" placeholder="Ex: Apartamento 204" required />
                    </div>

                    <div className="saas-input-group">
                      <label>Data Corrigida da Violação <span className="req">*</span></label>
                      <input type="date" name="data_violacao" required style={{ color: '#475569' }} />
                    </div>

                    <div className="saas-input-group">
                      <label>Horário do Incidente <span className="req">*</span></label>
                      <input type="time" name="hora_violacao" required style={{ color: '#475569' }} />
                    </div>
                  </div>
                </div>

                <div className="section-divider"></div>

                {/* 2. Descrição e Evidências */}
                <div className="form-section">
                   <div className="section-header-block">
                     <span className="section-step-badge" style={{ backgroundColor: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }}>2</span>
                     <h3 className="section-heading">Descrição e Evidências Confidenciais</h3>
                   </div>
                   
                   <div className="saas-input-group full-width">
                      <label>Descrição Detalhada <span className="req">*</span></label>
                      <textarea name="descricao" rows="5" placeholder="Relate com precisão o que aconteceu, tempo de duração, se houve tentativa prévia de diálogo, etc..." required></textarea>
                   </div>
                   
                   {/* Zona de Upload Drag & Drop SaaS */}
                   <div className="saas-input-group full-width" style={{ marginTop: '0.5rem' }}>
                      <label>Anexos (Provas: Aúdio, Vídeo, Fotos)</label>
                      
                      <div 
                         className={`upload-drop-zone ${dragActive ? 'drag-active' : ''}`}
                         onDragEnter={handleDrag}
                         onDragOver={handleDrag}
                         onDragLeave={handleDrag}
                         onDrop={handleDrop}
                         onClick={onButtonClick}
                      >
                         <input 
                            ref={inputRef}
                            type="file" 
                            multiple 
                            accept="image/*,video/*,audio/*" 
                            onChange={handleChange} 
                            style={{ display: 'none' }} 
                         />
                         
                         <div className="upload-icon-circle">
                           <UploadCloud size={28} />
                         </div>
                         <h4 className="upload-title">Clique para anexar ou arraste arquivos</h4>
                         <p className="upload-subtitle">Grave vídeos curtos ou tire fotos. (Máx. 50MB)</p>
                      </div>

                      {/* Lista de Arquivos Anexados */}
                      {files.length > 0 && (
                        <div className="attached-files-list">
                          {files.map(file => (
                            <div key={file.id} className="file-preview-card">
                               <div className="file-icon-box">
                                 {file.type.includes('image') ? <ImageIcon size={20} className="file-image-icon"/> : <Film size={20} className="file-video-icon"/>}
                               </div>
                               <div className="file-details">
                                 <span className="file-name">{file.name}</span>
                                 <span className="file-size">{file.size}</span>
                               </div>
                               <button 
                                 type="button" 
                                 className="file-remove-btn" 
                                 onClick={() => removeFile(file.id)}
                                 title="Remover anexo"
                               >
                                 <Trash2 size={16} />
                               </button>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                </div>

                <div className="section-divider"></div>

                {/* 3. Confirmação de Privacidade Exclusiva */}
                <div className="form-section">
                   <div className="section-header-block">
                     <span className="section-step-badge" style={{ backgroundColor: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }}>3</span>
                     <h3 className="section-heading">Privacidade Restrita</h3>
                   </div>

                   <div className="visibility-cards-container" style={{ gridTemplateColumns: '1fr' }}>
                      {/* Única opção p/ reclamação */}
                      <label className={`visibility-card selected`}>
                         <div className="visibility-card-content" style={{ borderColor: '#f97316', backgroundColor: '#fff7ed' }}>
                            <span className="visibility-radio-custom" style={{ borderColor: '#f97316' }}>
                               <span style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#f97316', borderRadius: '50%' }}></span>
                            </span>
                            <div className="visibility-text">
                               <h5>Canal de Confiança - Apenas ao Síndico</h5>
                               <p>Sua identidade e suas provas anexadas são mantidas sob estrito sigilo. O síndico vai processar a notificação diretamente com a outra parte sem expor você publicamente.</p>
                            </div>
                         </div>
                      </label>
                   </div>
                </div>

                {/* Ações (Cancel / Submit) */}
                <div className="saas-form-footer">
                  <button type="button" className="btn-cancel-saas" onClick={() => navigate('/dashboard')} disabled={isSubmitting}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary-saas" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : <><CheckCircle2 size={18} style={{ marginRight: '6px' }}/> Registrar Reclamação</>}
                  </button>
                </div>
                
              </form>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reclamacao;
