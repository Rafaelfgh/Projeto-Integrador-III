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
import { useCategorias } from '../hooks/useCategorias';
import { supabase } from '../backend/supabaseClient';
import './Dashboard.css';
import './Ocorrencia.css';

const Ocorrencia = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [visibility, setVisibility] = useState('mural');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { categorias } = useCategorias();
  const { currentUser } = useAuth();
  const ehSindico = currentUser?.role === 'SINDICO';

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
      const titulo = formData.get('titulo');
      const categoria = formData.get('categoria');
      const local = formData.get('local');
      const descText = formData.get('descricao');
      
      const descricaoCompleta = local ? `${descText}\n\nLocal Relacionado: ${local}` : descText;

      // 1. Upload dos anexos
      const uploadedUrls = [];
      for (const fileObj of files) {
        const fileExt = fileObj.name.split('.').pop();
        const fileName = `${currentUser.id}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
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

      // 2. Inserir ocorrência no banco
      const { error } = await supabase.from('Ocorrencias').insert({
        titulo: titulo,
        categoria: categoria,
        descricao: descricaoCompleta,
        privacidade: visibility,
        status: 'Aberta',
        morador_id: currentUser.id,
        condominio_id: currentUser.condominio_id,
        anexos: uploadedUrls
      });

      if (error) throw error;

      // As notificações (síndico, funcionários da especialidade e confirmação
      // para o autor) são criadas por trigger no banco.

      setIsSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1400);
    } catch (err) {
      console.error(err);
      setErroEnvio('Não foi possível registrar a ocorrência: ' + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
                        {categorias.map(c => (
                          <option key={c.slug} value={c.slug}>
                            {c.icone} {c.nome}{c.descricao ? ` (${c.descricao})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="saas-input-group">
                      <label>Local / Bloco e Apartamento Relacionado</label>
                      <input type="text" name="local" placeholder="Ex: Bloco B, Corredor 3º andar" />
                    </div>
                  </div>
                </div>

                <div className="section-divider"></div>

                <div className="form-section">
                   <div className="section-header-block">
                     <span className="section-step-badge">2</span>
                     <h3 className="section-heading">Descrição e Evidências</h3>
                   </div>
                   
                   <div className="saas-input-group full-width">
                      <label>Descrição Detalhada <span className="req">*</span></label>
                      <textarea name="descricao" rows="4" placeholder="Descreva o que aconteceu em detalhes para ajudar a equipe de manutenção..." required></textarea>
                   </div>
                   
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

                <div className="form-section">
                   <div className="section-header-block">
                     <span className="section-step-badge">3</span>
                     <h3 className="section-heading">Onde é o problema?</h3>
                   </div>

                   <div className="visibility-cards-container">
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
                               <h5>Área comum do condomínio</h5>
                               <p>Aparece no Mural de Ocorrências para todos os moradores e para a equipe de manutenção da categoria escolhida.</p>
                            </div>
                         </div>
                      </label>

                      {/* O síndico fala direto com os funcionários: não registra ocorrência pessoal */}
                      {!ehSindico && (
                      <label className={`visibility-card ${visibility === 'pessoal' ? 'selected' : ''}`}>
                         <input
                           type="radio"
                           name="visibilidade"
                           value="pessoal"
                           checked={visibility === 'pessoal'}
                           onChange={() => setVisibility('pessoal')}
                         />
                         <div className="visibility-card-content">
                            <span className="visibility-radio-custom"></span>
                            <div className="visibility-text">
                               <h5>Problema no meu apartamento</h5>
                               <p>Ocorrência pessoal (ex.: infiltração ou rachadura dentro da sua unidade). Vai direto para análise do síndico, que encaminha a um funcionário. Não aparece no mural.</p>
                            </div>
                         </div>
                      </label>
                      )}
                   </div>
                </div>

                {erroEnvio && (
                  <p role="alert" style={{ margin: '0 0 1rem', padding: '0.75rem 1rem', borderRadius: 8, background: '#fee2e2', color: '#b91c1c', fontSize: '0.875rem' }}>
                    {erroEnvio}
                  </p>
                )}

                <div className="saas-form-footer">
                  <button type="button" className="btn-cancel-saas" onClick={() => navigate('/dashboard')} disabled={isSubmitting || isSuccess}>
                    Cancelar
                  </button>
                  <button type="submit" className={`btn-primary-saas${isSuccess ? ' btn-success-state' : ''}`} disabled={isSubmitting || isSuccess}>
                    {isSuccess
                      ? <><CheckCircle2 size={18} style={{ marginRight: '6px' }}/> Registrado!</>
                      : isSubmitting
                        ? <><span className="btn-spinner"/>&nbsp;Enviando...</>
                        : <><CheckCircle2 size={18} style={{ marginRight: '6px' }}/> Registrar Ocorrência</>}
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