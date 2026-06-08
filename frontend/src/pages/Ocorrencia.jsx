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
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationMenu from '../components/NotificationMenu';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { criarNotificacao } from '../services/notificationService';
import { supabase } from '../backend/supabaseClient';
import './Dashboard.css';
import './Ocorrencia.css';

const Ocorrencia = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [visibility, setVisibility] = useState('sindico');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Handle Drag events para a zona de upload
  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Triggers when file is dropped
  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Triggers when file is selected with click
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
      const titulo = formData.get('titulo');
      const categoria = formData.get('categoria');
      const local = formData.get('local');
      const descText = formData.get('descricao');
      
      const descricaoCompleta = local ? `${descText}\n\nLocal Relacionado: ${local}` : descText;

      // 1. Upload dos anexos (Fotos/Vídeos)
      const uploadedUrls = [];
      for (const fileObj of files) {
        const fileExt = fileObj.name.split('.').pop();
        const fileName = `${currentUser.id}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('anexos')
          .upload(fileName, fileObj.file);
          
        if (uploadError) {
          console.error('Erro no upload', uploadError);
          continue; // Pula a imagem que deu erro
        }
        
        const { data: { publicUrl } } = supabase.storage.from('anexos').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      // 2. Inserir no Banco de Dados
      const { data, error } = await supabase.from('Ocorrencias').insert({
        titulo: titulo,
        categoria: categoria,
        descricao: descricaoCompleta,
        privacidade: visibility,
        status: 'Aberta',
        morador_id: currentUser.id,
        condominio_id: currentUser.condominio_id,
        anexos: uploadedUrls
      }).select();

      if (error) throw error;
      
      // Notificar síndico
      await criarNotificacao({
        destinatario_id: 'sindico-mock-id', // O painel do síndico depois vai puxar as notificações do condomínio
        condominio_id: currentUser.condominio_id,
        tipo: 'NOVA_OCORRENCIA',
        titulo: 'Nova Ocorrência Registrada',
        descricao: `Uma nova ocorrência foi registrada por ${currentUser?.name || 'Morador'}.`,
        referencia_tipo: 'ocorrencia',
        referencia_id: data[0]?.id,
        remetente_id: currentUser?.id,
        remetente_nome: currentUser?.name || 'Morador'
      });

      alert('Ocorrência registrada com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar ocorrência: ' + err.message);
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

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <main className="main-content">
        {/* Header Superior Moderno */}
        <header className="main-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="header-breadcrumbs">
               <h2 className="header-title">Ocorrência Estrutural</h2>
               <p className="header-date">Notifique problemas nas áreas comuns</p>
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
              
              <div className="form-alert-info">
                 <Info size={18} className="info-icon" />
                 <div>
                    <h4>Orientações para Registro</h4>
                    <p>Utilize este formulário apenas para problemas estruturais, manutenção ou limpeza do condomínio. Para questões com vizinhos, use a aba "Nova Reclamação".</p>
                 </div>
              </div>

              <form className="saas-occurrence-form" onSubmit={handleSubmit}>
                
                {/* 1. Detalhes Básicos */}
                <div className="form-section">
                  <div className="section-header-block">
                     <span className="section-step-badge">1</span>
                     <h3 className="section-heading">Detalhes Básicos</h3>
                  </div>
                  
                  <div className="saas-grid">
                    <div className="saas-input-group full-width">
                      <label>Título da Ocorrência <span className="req">*</span></label>
                      <input type="text" name="titulo" placeholder="Ex: Lâmpada queimada no corredor do 3º andar" required />
                    </div>
                    
                    <div className="saas-input-group">
                      <label>Categoria <span className="req">*</span></label>
                      <select name="categoria" required className="saas-select" defaultValue="">
                        <option value="" disabled>Selecione uma categoria</option>
                        <option value="hidraulica">💧 Hidráulica (Vazamentos, Encanamento)</option>
                        <option value="manutencao">🔧 Manutenção (Reparos Gerais)</option>
                        <option value="limpeza">🧹 Limpeza (Áreas Comuns)</option>
                        <option value="jardinagem">🌿 Jardinagem (Jardim, Paisagismo)</option>
                        <option value="seguranca">🛡️ Segurança (Câmeras, Portaria)</option>
                        <option value="areas_comuns">🏢 Áreas Comuns (Salão, Piscina, Academia)</option>
                        <option value="estrutural">🏗️ Estrutural (Rachaduras, Infiltração)</option>
                        <option value="barulho">🔊 Barulho / Perturbação</option>
                        <option value="garagem">🅿️ Garagem / Estacionamento</option>
                      </select>
                    </div>

                    <div className="saas-input-group">
                      <label>Local / Bloco e Apartamento Relacionado</label>
                      <input type="text" name="local" placeholder="Ex: Bloco B, Corredor 3º andar" />
                    </div>
                  </div>
                </div>

                <div className="section-divider"></div>

                {/* 2. Descrição e Evidências */}
                <div className="form-section">
                   <div className="section-header-block">
                     <span className="section-step-badge">2</span>
                     <h3 className="section-heading">Descrição e Evidências</h3>
                   </div>
                   
                   <div className="saas-input-group full-width">
                      <label>Descrição Detalhada <span className="req">*</span></label>
                      <textarea name="descricao" rows="4" placeholder="Descreva o que aconteceu em detalhes para ajudar a equipe de manutenção..." required></textarea>
                   </div>
                   
                   {/* Zona de Upload Drag & Drop SaaS */}
                   <div className="saas-input-group full-width" style={{ marginTop: '0.5rem' }}>
                      <label>Anexos (Fotos ou Vídeos)</label>
                      
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
                            accept="image/*,video/*" 
                            onChange={handleChange} 
                            style={{ display: 'none' }} 
                         />
                         
                         <div className="upload-icon-circle">
                           <UploadCloud size={28} />
                         </div>
                         <h4 className="upload-title">Clique para enviar ou arraste os arquivos aqui</h4>
                         <p className="upload-subtitle">Formatos suportados: JPG, PNG, MP4 (Máx. 50MB)</p>
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

                {/* 3. Privacidade e Envio */}
                <div className="form-section">
                   <div className="section-header-block">
                     <span className="section-step-badge">3</span>
                     <h3 className="section-heading">Privacidade do Chamado</h3>
                   </div>

                   <div className="visibility-cards-container">
                      <label className={`visibility-card ${visibility === 'sindico' ? 'selected' : ''}`}>
                         <input 
                           type="radio" 
                           name="visibilidade" 
                           value="sindico" 
                           checked={visibility === 'sindico'}
                           onChange={() => setVisibility('sindico')}
                         />
                         <div className="visibility-card-content">
                            <span className="visibility-radio-custom"></span>
                            <div className="visibility-text">
                               <h5>Apenas Administração</h5>
                               <p>Sua ocorrência será enviada diretamente para o síndico e zelador. Ela não aparecerá no feed do condomínio.</p>
                            </div>
                         </div>
                      </label>

                      <label className={`visibility-card ${visibility === 'mural' ? 'selected' : ''}`}>
                         <input 
                           type="radio" 
                           name="visibilidade" 
                           value="mural" 
                           checked={visibility === 'mural'}
                           onChange={() => setVisibility('mural')}
                         />
                         <div className="visibility-card-content">
                            <span className="visibility-radio-custom"></span>
                            <div className="visibility-text">
                               <h5>Público no Mural</h5>
                               <p>Tornar esta ocorrência visível para todos os moradores no Feed (ideal para registrar algo de interesse geral estrutural).</p>
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
                    {isSubmitting ? 'Enviando...' : <><CheckCircle2 size={18} style={{ marginRight: '6px' }}/> Registrar Ocorrência</>}
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

export default Ocorrencia;
