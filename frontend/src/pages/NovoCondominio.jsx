import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react';
import './NovoCondominio.css';

const MOCK_AREAS = [
  { id: 'piscina_ad', icon: '🏊', name: 'Piscina adulto' },
  { id: 'piscina_inf', icon: '🏊', name: 'Piscina infantil' },
  { id: 'salao', icon: '🎉', name: 'Salão de festas' },
  { id: 'churrasqueira', icon: '🔥', name: 'Churrasqueira' },
  { id: 'academia', icon: '💪', name: 'Academia' },
  { id: 'quadra', icon: '🏀', name: 'Quadra poliesportiva' },
  { id: 'playground', icon: '🛝', name: 'Playground' },
  { id: 'coworking', icon: '💻', name: 'Coworking' },
  { id: 'sauna', icon: '🧖', name: 'Sauna' },
  { id: 'lavanderia', icon: '👕', name: 'Lavanderia' },
  { id: 'pet', icon: '🐾', name: 'Pet place' },
  { id: 'brinquedoteca', icon: '🎮', name: 'Brinquedoteca' },
  { id: 'jardim', icon: '🌿', name: 'Jardim / Área verde' },
  { id: 'estacionamento', icon: '🅿️', name: 'Estac. coberto' }
];

const NovoCondominio = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Unified State for all fields
  const [formData, setFormData] = useState({
    // Step 1
    nome: '', cnpj: '', endereco: '', cidade: '', estado: '', cep: '', emailContato: '', telefone: '',
    // Step 2
    numBlocos: '', nomeBlocos: '', andares: '', aptsPorAndar: '',
    // Step 3
    vagasTotais: '', vagasExclusivas: 1, vagasRotativas: 0, vagasVisitantes: 0, vagasPCD: 0, regraVagas: 'Uma vaga exclusiva por unidade',
    // Step 4
    areasSelecionadas: [], outrasAreas: '',
    // Step 5
    plano: '', vencimento: 'Todo dia 5', pagamento: 'Boleto bancário',
    // Step 6
    silencioInicio: '22h', silencioFim: '08h', limiteReservas: 2, antecedenciaReserva: '48 horas', permiteMoradorReserva: true, exigeAprovacaoReserva: true,
    slaCri: '24h', slaMod: '72h', slaBaixa: '7 dias',
    // Step 7
    sindicoNome: '', sindicoEmail: '', sindicoTelefone: '', sindicoCPF: '', sindicoSenha: '',
    // Step 8 (Funcionários)
    funcionarios: [],
    // Step 9 (Moradores)
    moradores: []
  });

  // Local state for adding inline items
  const [funcTemp, setFuncTemp] = useState({ nome: '', email: '', cargo: '', categoria: 'Manutenção' });
  const [showFuncForm, setShowFuncForm] = useState(false);

  const [moradorTemp, setMoradorTemp] = useState({ nome: '', email: '', bloco: '', unidade: '', tipo: 'Proprietário', vaga: '' });
  const [showMoradorForm, setShowMoradorForm] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const toggleArea = (id) => {
    setFormData(prev => {
      const isSelected = prev.areasSelecionadas.includes(id);
      return {
        ...prev,
        areasSelecionadas: isSelected 
          ? prev.areasSelecionadas.filter(a => a !== id)
          : [...prev.areasSelecionadas, id]
      };
    });
  };

  const validateStep = (current) => {
    let newErrors = {};
    if (current === 1) {
      if (!formData.nome) newErrors.nome = 'Nome é obrigatório';
      if (!formData.emailContato) newErrors.emailContato = 'E-mail é obrigatório';
    } else if (current === 2) {
      if (!formData.numBlocos || parseInt(formData.numBlocos) < 1) newErrors.numBlocos = 'Obrigatório';
      if (!formData.andares || parseInt(formData.andares) < 1) newErrors.andares = 'Obrigatório';
      if (!formData.aptsPorAndar || parseInt(formData.aptsPorAndar) < 1) newErrors.aptsPorAndar = 'Obrigatório';
    } else if (current === 5) {
      if (!formData.plano) newErrors.plano = 'Selecione um plano';
    } else if (current === 7) {
      if (!formData.sindicoNome) newErrors.sindicoNome = 'Nome obrigatório';
      if (!formData.sindicoEmail) newErrors.sindicoEmail = 'E-mail obrigatório';
      if (!formData.sindicoSenha) newErrors.sindicoSenha = 'Senha obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 10) setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleActivate = () => {
    if (validateStep(10)) { /* In step 10, checklist validates itself visually */
      setIsSuccess(true);
    }
  };

  const getBlockByStep = (s) => {
    if (s <= 4) return 1;
    if (s <= 6) return 2;
    if (s <= 9) return 3;
    return 4;
  };

  const curBlock = getBlockByStep(step);

  const blockNames = ["1. Dados", "2. Operacional", "3. Usuários", "4. Ativação"];

  const renderTitle = (title, subtitle) => (
    <>
      <h2 className="nc-step-title">{title}</h2>
      <p className="nc-step-subtitle">{subtitle}</p>
    </>
  );

  return (
    <div className="nc-page">
      {/* Topbar */}
      <div className="nc-topbar">
        <h1 className="nc-title">Novo Condomínio</h1>
        <button className="nc-cancel-btn" onClick={() => navigate('/login')}><X size={18}/> Cancelar</button>
      </div>

      {!isSuccess && (
        <div className="nc-progress-bar-container">
          <div className="nc-blocks-nav">
             <div className="nc-block-line"></div>
             {[1,2,3,4].map(b => (
               <div key={b} className={`nc-block-item ${curBlock === b ? 'active' : curBlock > b ? 'visited' : 'future'}`}>
                  <div className="nc-block-circle">
                     {curBlock > b ? <Check size={16}/> : b}
                  </div>
                  <span className="nc-block-label">{blockNames[b-1]}</span>
               </div>
             ))}
          </div>
          <div className="nc-step-indicator">
            Etapa {step} de 10 — {
              [
                "Identificação e endereço", "Estrutura física", "Vagas de garagem", "Áreas de lazer",
                "Plano e cobrança", "Regras e SLAs", "Cadastrar síndico", "Cadastrar funcionários",
                "Convidar moradores", "Revisão e ativação"
              ][step - 1]
            }
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="nc-content-container">
        
        {isSuccess ? (
          <div className="nc-step-content nc-success-state">
            {/* Simple CSS Confetti */}
            {Array.from({length:30}).map((_,i) => <div key={i} className="confetti" style={{left:`${Math.random()*100}%`, animationDelay:`${Math.random()}s`, backgroundColor: ['#10b981','#3b82f6','#f59e0b','#f43f5e'][i%4]}}></div>)}
            <div className="nc-success-icon"><Check size={40} /></div>
            <h2>Condomínio ativado com sucesso!</h2>
            <p>{formData.nome || 'O condomínio'} está ativo. O síndico e os moradores já podem fazer login.</p>
            <div style={{display:'flex', gap:'1rem'}}>
              <button className="nc-btn-primary" onClick={() => navigate('/login')}>Ir para o Login</button>
              <button className="nc-btn-outline" onClick={() => window.location.reload()}>Criar outro condomínio</button>
            </div>
          </div>
        ) : (
          <div className="nc-step-content">
            
            {/* STEP 1 */}
            {step === 1 && (
              <>
                {renderTitle("Identificação e endereço", "Informações básicas de cadastro do condomínio no sistema.")}
                <div className="nc-form-grid">
                  <div className="nc-form-group full-width">
                     <label className="nc-label">Nome do condomínio *</label>
                     <input type="text" className={`nc-input ${errors.nome ? 'nc-input-error' : ''}`} placeholder="Ex: Edifício Aurora" name="nome" value={formData.nome} onChange={handleChange} />
                     {errors.nome && <span className="nc-error-msg">{errors.nome}</span>}
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">CNPJ</label>
                     <input type="text" className="nc-input" placeholder="00.000.000/0001-00" name="cnpj" value={formData.cnpj} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">CEP</label>
                     <input type="text" className="nc-input" placeholder="00000-000" name="cep" value={formData.cep} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group full-width">
                     <label className="nc-label">Endereço completo</label>
                     <input type="text" className="nc-input" placeholder="Rua, número, complemento" name="endereco" value={formData.endereco} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Cidade</label>
                     <input type="text" className="nc-input" name="cidade" value={formData.cidade} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Estado</label>
                     <select className="nc-select" name="estado" value={formData.estado} onChange={handleChange}>
                       <option value="">Selecione...</option>
                       <option value="SP">São Paulo</option>
                       <option value="RJ">Rio de Janeiro</option>
                       <option value="MG">Minas Gerais</option>
                       <option value="Outro">Outro...</option>
                     </select>
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">E-mail de contato *</label>
                     <input type="email" className={`nc-input ${errors.emailContato ? 'nc-input-error' : ''}`} placeholder="adm@condominio.com.br" name="emailContato" value={formData.emailContato} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Telefone</label>
                     <input type="text" className="nc-input" placeholder="(11) 00000-0000" name="telefone" value={formData.telefone} onChange={handleChange} />
                  </div>
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                {renderTitle("Estrutura física", "Define como o condomínio é organizado. O sistema criará automaticamente todos os blocos e unidades.")}
                <div className="nc-form-grid">
                  <div className="nc-form-group">
                     <label className="nc-label">Número de blocos *</label>
                     <input type="number" min="1" max="20" className={`nc-input ${errors.numBlocos ? 'nc-input-error' : ''}`} placeholder="Ex: 4" name="numBlocos" value={formData.numBlocos} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Nome dos blocos / Prefixo</label>
                     <input type="text" className="nc-input" placeholder="Ex: Torre" name="nomeBlocos" value={formData.nomeBlocos} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Andares por bloco *</label>
                     <input type="number" min="1" max="50" className={`nc-input ${errors.andares ? 'nc-input-error' : ''}`} placeholder="Ex: 10" name="andares" value={formData.andares} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Unidades por andar *</label>
                     <input type="number" min="1" max="20" className={`nc-input ${errors.aptsPorAndar ? 'nc-input-error' : ''}`} placeholder="Ex: 4" name="aptsPorAndar" value={formData.aptsPorAndar} onChange={handleChange} />
                  </div>
                </div>

                {formData.numBlocos && formData.andares && formData.aptsPorAndar && (
                  <div className="nc-preview-card">
                     <div className="nc-preview-header">
                        Preview da estrutura
                        <span className="nc-preview-stats">
                          {formData.numBlocos} blocos · {formData.andares} andares · {formData.aptsPorAndar} unidades p/ andar · <strong>Total: {formData.numBlocos * formData.andares * formData.aptsPorAndar} unidades</strong>
                        </span>
                     </div>
                     <div className="nc-blocks-grid">
                        {Array.from({length: Math.min(formData.numBlocos, 8)}).map((_, i) => (
                          <div key={i} className="nc-preview-block-item">
                            <span className="nc-pb-name">{formData.nomeBlocos || 'Bloco'} {String.fromCharCode(65 + i)}</span>
                            <span className="nc-pb-apts">{formData.andares * formData.aptsPorAndar} apts</span>
                          </div>
                        ))}
                        {formData.numBlocos > 8 && (
                          <div className="nc-preview-block-item" style={{background:'#f1f5f9', color:'#64748b'}}>
                            <span style={{fontWeight:'700'}}>+{formData.numBlocos - 8}</span>
                          </div>
                        )}
                     </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                {renderTitle("Vagas de garagem", "Configure as vagas vinculadas ao condomínio.")}
                <div className="nc-form-grid">
                  <div className="nc-form-group full-width">
                     <label className="nc-label">Regra de uso</label>
                     <select className="nc-select" name="regraVagas" value={formData.regraVagas} onChange={handleChange}>
                       <option>Uma vaga exclusiva por unidade</option>
                       <option>Livre — sem vínculo fixo</option>
                       <option>Personalizado</option>
                     </select>
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Total de vagas estruturais</label>
                     <input type="number" className="nc-input" name="vagasTotais" value={formData.vagasTotais} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Vagas exclusivas p/ unidade</label>
                     <input type="number" className="nc-input" name="vagasExclusivas" value={formData.vagasExclusivas} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Vagas Rotativas</label>
                     <input type="number" className="nc-input" name="vagasRotativas" value={formData.vagasRotativas} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Vagas Visitantes</label>
                     <input type="number" className="nc-input" name="vagasVisitantes" value={formData.vagasVisitantes} onChange={handleChange} />
                  </div>
                </div>

                <div className="nc-info-card" style={{marginTop:'2rem'}}>
                  Total configurado calculado dinamicamente baseado na sua estrutura do Etapa 2 + parâmetros acima.
                </div>
              </>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <>
                {renderTitle("Áreas de lazer e comum", "Selecione as áreas que o condomínio possui. Ativa o módulo de Reservas.")}
                <div className="nc-areas-grid">
                  {MOCK_AREAS.map(area => (
                    <div key={area.id} onClick={() => toggleArea(area.id)} className={`nc-area-card ${formData.areasSelecionadas.includes(area.id) ? 'selected' : ''}`}>
                       <span className="nc-area-icon">{area.icon}</span>
                       <span className="nc-area-name">{area.name}</span>
                    </div>
                  ))}
                </div>
                <div className="nc-form-group full-width" style={{marginTop:'1.5rem'}}>
                   <label className="nc-label">Outras áreas não listadas</label>
                   <input type="text" className="nc-input" placeholder="Descreva separando por vírgula" name="outrasAreas" value={formData.outrasAreas} onChange={handleChange} />
                </div>
              </>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <>
                {renderTitle("Plano e cobrança", "Selecione o plano contratado e configure o faturamento.")}
                <div className="nc-plans-grid">
                   {/* Plano Basico */}
                   <div className={`nc-plan-card ${formData.plano === 'Básico' ? 'selected' : ''}`} onClick={() => {setFormData({...formData, plano:'Básico'}); setErrors(prev=>({...prev, plano:null}))}}>
                      <div className="nc-plan-name">Básico</div>
                      <div className="nc-plan-price">R$ 290<span>/mês</span></div>
                      <ul className="nc-plan-features">
                        <li className="nc-plan-feature"><Check size={14} color="#10b981"/> Até 50 unidades</li>
                        <li className="nc-plan-feature"><Check size={14} color="#10b981"/> Ocorrências e Mural</li>
                        <li className="nc-plan-feature" style={{color:'#94a3b8'}}><X size={14} color="#94a3b8"/> Financeiro & Reservas</li>
                      </ul>
                   </div>

                   {/* Plano Pro */}
                   <div className={`nc-plan-card ${formData.plano === 'Pro' ? 'selected' : ''}`} style={{borderColor: formData.plano === 'Pro' ? '#4f46e5' : '#cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} onClick={() => {setFormData({...formData, plano:'Pro'}); setErrors(prev=>({...prev, plano:null}))}}>
                      <div className="nc-plan-badge">Popular</div>
                      <div className="nc-plan-name">Pro</div>
                      <div className="nc-plan-price">R$ 490<span>/mês</span></div>
                      <ul className="nc-plan-features">
                        <li className="nc-plan-feature"><Check size={14} color="#10b981"/> Até 200 unidades</li>
                        <li className="nc-plan-feature"><Check size={14} color="#10b981"/> Tudo do Básico</li>
                        <li className="nc-plan-feature"><Check size={14} color="#10b981"/> Financeiro e Reservas</li>
                        <li className="nc-plan-feature"><Check size={14} color="#10b981"/> Votações e Relatórios</li>
                      </ul>
                   </div>

                   {/* Plano Enterprise */}
                   <div className={`nc-plan-card ${formData.plano === 'Enterprise' ? 'selected' : ''}`} onClick={() => {setFormData({...formData, plano:'Enterprise'}); setErrors(prev=>({...prev, plano:null}))}}>
                      <div className="nc-plan-name">Enterprise</div>
                      <div className="nc-plan-price">R$ 890<span>/mês</span></div>
                      <ul className="nc-plan-features">
                        <li className="nc-plan-feature"><Check size={14} color="#10b981"/> Unidades Ilimitadas</li>
                        <li className="nc-plan-feature"><Check size={14} color="#10b981"/> Tudo do Pro</li>
                        <li className="nc-plan-feature"><Check size={14} color="#10b981"/> Auditoria Master API</li>
                      </ul>
                   </div>
                </div>
                {errors.plano && <div className="nc-error-msg" style={{marginBottom:'1rem', fontSize:'0.9rem', fontWeight:'600'}}>{errors.plano}</div>}

                <div className="nc-form-grid">
                  <div className="nc-form-group">
                     <label className="nc-label">Vencimento da mensalidade</label>
                     <select className="nc-select" name="vencimento" value={formData.vencimento} onChange={handleChange}>
                       <option>Todo dia 5</option>
                       <option>Todo dia 10</option>
                       <option>Todo dia 15</option>
                       <option>Todo dia 20</option>
                     </select>
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Método de pagamento</label>
                     <select className="nc-select" name="pagamento" value={formData.pagamento} onChange={handleChange}>
                       <option>Boleto bancário</option>
                       <option>Cartão de crédito</option>
                       <option>PIX recorrente</option>
                     </select>
                  </div>
                </div>
              </>
            )}

            {/* STEP 6 */}
            {step === 6 && (
              <>
                {renderTitle("Regras e SLAs", "Defina as regras que serão aplicadas automaticamente nos módulos.")}
                
                <h4 style={{fontSize:'1rem', color:'#1e293b', marginBottom:'1rem'}}>Regras do Condomínio</h4>
                <div className="nc-form-grid">
                  <div className="nc-form-group">
                     <label className="nc-label">Horário de Silêncio - Início</label>
                     <select className="nc-select" name="silencioInicio" value={formData.silencioInicio} onChange={handleChange}><option>20h</option><option>21h</option><option>22h</option><option>23h</option></select>
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Horário de Silêncio - Fim</label>
                     <select className="nc-select" name="silencioFim" value={formData.silencioFim} onChange={handleChange}><option>06h</option><option>07h</option><option>08h</option><option>09h</option></select>
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Limite Reservas / Mês</label>
                     <input type="number" className="nc-input" name="limiteReservas" value={formData.limiteReservas} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Antecedência Reserva</label>
                     <select className="nc-select" name="antecedenciaReserva" value={formData.antecedenciaReserva} onChange={handleChange}><option>24 horas</option><option>48 horas</option><option>72 horas</option></select>
                  </div>
                </div>

                <div className="nc-divider"></div>
                <h4 style={{fontSize:'1rem', color:'#1e293b', marginBottom:'0.5rem'}}>SLA de Ocorrências</h4>
                <p style={{fontSize:'0.8rem', color:'#64748b', marginBottom:'1rem'}}>O sistema disparará alertas automaticamente quando ultrapassar o prazo.</p>
                <div className="nc-form-grid">
                  <div className="nc-form-group">
                     <label className="nc-label">SLA Crítica</label>
                     <select className="nc-select" name="slaCri" value={formData.slaCri} onChange={handleChange}><option>4h</option><option>8h</option><option>12h</option><option>24h</option></select>
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">SLA Moderada</label>
                     <select className="nc-select" name="slaMod" value={formData.slaMod} onChange={handleChange}><option>24h</option><option>48h</option><option>72h</option></select>
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">SLA Baixa</label>
                     <select className="nc-select" name="slaBaixa" value={formData.slaBaixa} onChange={handleChange}><option>3 dias</option><option>5 dias</option><option>7 dias</option></select>
                  </div>
                </div>
              </>
            )}

            {/* STEP 7 */}
            {step === 7 && (
              <>
                {renderTitle("Cadastrar síndico", "O síndico terá acesso ao painel de gestão central do condomínio.")}
                <div className="nc-info-card" style={{marginTop:0, marginBottom:'2rem', background:'#f5f3ff', borderColor:'#8b5cf6', color:'#6d28d9'}}>
                  O e-mail receberá as credenciais de primeiro acesso logado.
                </div>

                <div className="nc-form-grid">
                  <div className="nc-form-group full-width">
                     <label className="nc-label">Nome completo *</label>
                     <input type="text" className={`nc-input ${errors.sindicoNome ? 'nc-input-error' : ''}`} name="sindicoNome" value={formData.sindicoNome} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">E-mail de login *</label>
                     <input type="email" className={`nc-input ${errors.sindicoEmail ? 'nc-input-error' : ''}`} name="sindicoEmail" value={formData.sindicoEmail} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group">
                     <label className="nc-label">Telefone</label>
                     <input type="text" className="nc-input" name="sindicoTelefone" value={formData.sindicoTelefone} onChange={handleChange} />
                  </div>
                  <div className="nc-form-group full-width">
                     <label className="nc-label">Senha provisória *</label>
                     <div style={{display:'flex', gap:'0.5rem'}}>
                       <input type="text" className={`nc-input ${errors.sindicoSenha ? 'nc-input-error' : ''}`} style={{flex:1}} name="sindicoSenha" value={formData.sindicoSenha} onChange={handleChange} />
                       <button className="nc-btn-outline" onClick={() => setFormData({...formData, sindicoSenha: Math.random().toString(36).slice(-8)})}>Gerar</button>
                     </div>
                  </div>
                </div>
              </>
            )}

            {/* STEP 8 */}
            {step === 8 && (
              <>
                {renderTitle("Cadastrar funcionários", "Cada funcionário recebe login individual (Opcional).")}
                
                {formData.funcionarios.length === 0 ? (
                  <div style={{padding:'2rem', textAlign:'center', border:'2px dashed #cbd5e1', borderRadius:'12px', color:'#94a3b8', marginBottom:'1.5rem'}}>
                    Nenhum funcionário cadastrado ainda.
                  </div>
                ) : (
                  <div style={{marginBottom:'1.5rem'}}>
                    {formData.funcionarios.map((f, i) => (
                      <div key={i} className="nc-list-row">
                        <div className="nc-list-user">
                          <div className="nc-avatar-sm">{f.nome.charAt(0)}</div>
                          <div style={{display:'flex', flexDirection:'column'}}>
                            <span style={{fontWeight:'600', color:'#1e293b', fontSize:'0.9rem'}}>{f.nome}</span>
                            <span style={{fontSize:'0.75rem', color:'#64748b'}}>{f.cargo}</span>
                          </div>
                        </div>
                        <button style={{background:'none', border:'none', color:'#ef4444', fontSize:'0.8rem', cursor:'pointer'}} onClick={() => {
                          const nList = [...formData.funcionarios]; nList.splice(i,1); setFormData({...formData, funcionarios: nList});
                        }}>Remover</button>
                      </div>
                    ))}
                  </div>
                )}

                {showFuncForm ? (
                  <div className="nc-inline-box">
                    <h5 style={{margin:'0 0 1rem 0', color:'#1e293b'}}>Novo Funcionário</h5>
                    <div className="nc-form-grid">
                      <div className="nc-form-group"><label className="nc-label">Nome</label><input type="text" className="nc-input" value={funcTemp.nome} onChange={e=>setFuncTemp({...funcTemp, nome:e.target.value})} /></div>
                      <div className="nc-form-group"><label className="nc-label">E-mail</label><input type="email" className="nc-input" value={funcTemp.email} onChange={e=>setFuncTemp({...funcTemp, email:e.target.value})} /></div>
                      <div className="nc-form-group"><label className="nc-label">Cargo</label><input type="text" className="nc-input" value={funcTemp.cargo} onChange={e=>setFuncTemp({...funcTemp, cargo:e.target.value})} /></div>
                      <div className="nc-form-group"><label className="nc-label">Categoria</label><select className="nc-select" value={funcTemp.categoria} onChange={e=>setFuncTemp({...funcTemp, categoria:e.target.value})}><option>Manutenção</option><option>Portaria</option><option>Limpeza</option></select></div>
                    </div>
                    <div style={{display:'flex', gap:'1rem', marginTop:'1.5rem'}}>
                      <button className="nc-btn-primary" onClick={() => { if(funcTemp.nome) { setFormData({...formData, funcionarios: [...formData.funcionarios, funcTemp]}); setShowFuncForm(false); setFuncTemp({nome:'',email:'',cargo:'',categoria:'Manutenção'}); } }}>Salvar funcionário</button>
                      <button className="nc-btn-outline" onClick={() => setShowFuncForm(false)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button className="nc-btn-outline" onClick={() => setShowFuncForm(true)}>+ Adicionar funcionário</button>
                )}
              </>
            )}

            {/* STEP 9 */}
            {step === 9 && (
              <>
                {renderTitle("Convidar moradores", "Pré-cadastre os moradores para este condomínio (Opcional).")}
                
                {formData.moradores.length > 0 && (
                  <div style={{marginBottom:'1.5rem'}}>
                    {formData.moradores.map((m, i) => (
                      <div key={i} className="nc-list-row">
                        <div className="nc-list-user">
                          <div className="nc-avatar-sm" style={{background:'#e0f2fe', color:'#0284c7'}}>{m.nome.charAt(0)}</div>
                          <div style={{display:'flex', flexDirection:'column'}}>
                            <span style={{fontWeight:'600', color:'#1e293b', fontSize:'0.9rem'}}>{m.nome}</span>
                            <span style={{fontSize:'0.75rem', color:'#64748b'}}>{m.bloco} - {m.unidade} • {m.tipo}</span>
                          </div>
                        </div>
                        <button style={{background:'none', border:'none', color:'#ef4444', fontSize:'0.8rem', cursor:'pointer'}} onClick={() => {
                          const nList = [...formData.moradores]; nList.splice(i,1); setFormData({...formData, moradores: nList});
                        }}>Remover</button>
                      </div>
                    ))}
                  </div>
                )}

                {showMoradorForm ? (
                  <div className="nc-inline-box">
                    <h5 style={{margin:'0 0 1rem 0', color:'#1e293b'}}>Adicionar Morador</h5>
                    <div className="nc-form-grid">
                      <div className="nc-form-group"><label className="nc-label">Nome Completo</label><input type="text" className="nc-input" value={moradorTemp.nome} onChange={e=>setMoradorTemp({...moradorTemp, nome:e.target.value})} /></div>
                      <div className="nc-form-group"><label className="nc-label">E-mail</label><input type="email" className="nc-input" value={moradorTemp.email} onChange={e=>setMoradorTemp({...moradorTemp, email:e.target.value})} /></div>
                      <div className="nc-form-group"><label className="nc-label">Unidade/Apt</label><input type="text" className="nc-input" value={moradorTemp.unidade} onChange={e=>setMoradorTemp({...moradorTemp, unidade:e.target.value})} /></div>
                      <div className="nc-form-group"><label className="nc-label">Tipo</label><select className="nc-select" value={moradorTemp.tipo} onChange={e=>setMoradorTemp({...moradorTemp, tipo:e.target.value})}><option>Proprietário</option><option>Inquilino</option></select></div>
                    </div>
                    <div style={{display:'flex', gap:'1rem', marginTop:'1.5rem'}}>
                      <button className="nc-btn-primary" onClick={() => { if(moradorTemp.nome) { setFormData({...formData, moradores: [...formData.moradores, moradorTemp]}); setShowMoradorForm(false); setMoradorTemp({nome:'',email:'',bloco:'',unidade:'',tipo:'Proprietário',vaga:''}); } }}>Adicionar morador</button>
                      <button className="nc-btn-outline" onClick={() => setShowMoradorForm(false)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{display:'flex', gap:'1rem'}}>
                    <button className="nc-btn-outline" style={{borderColor:'#4f46e5', color:'#4f46e5'}} onClick={() => setShowMoradorForm(true)}>+ Adicionar morador</button>
                    <button className="nc-btn-outline">Importar CSV</button>
                  </div>
                )}
              </>
            )}

            {/* STEP 10 */}
            {step === 10 && (
              <>
                {renderTitle("Revisão e ativação", "Confira todas as configurações antes de ativar o condomínio.")}
                
                {Object.keys(errors).length > 0 && (
                  <div className="nc-val-error">
                    <AlertTriangle size={20}/> Existem campos obrigatórios pendentes em etapas anteriores. Resolva-os antes de ativar.
                  </div>
                )}

                <div className="nc-checklist">
                   <div className="nc-checkitem">
                     <div className="nc-icon-wrapper">{formData.nome && formData.emailContato ? <CheckCircle2 color="#10b981"/> : <AlertTriangle color="#ef4444"/>}</div>
                     <div className="nc-checktext">
                       <span className="nc-checktext-title">Dados cadastrais</span>
                       <span className="nc-checktext-desc">{formData.nome ? formData.nome : 'Faltando informações obrigatórias'}</span>
                     </div>
                   </div>
                   <div className="nc-checkitem">
                     <div className="nc-icon-wrapper">{formData.numBlocos && formData.aptsPorAndar ? <CheckCircle2 color="#10b981"/> : <AlertTriangle color="#ef4444"/>}</div>
                     <div className="nc-checktext">
                       <span className="nc-checktext-title">Estrutura física</span>
                       <span className="nc-checktext-desc">{formData.numBlocos ? `${formData.numBlocos} Blocos configurados` : 'Não configurado'}</span>
                     </div>
                   </div>
                   <div className="nc-checkitem">
                     <div className="nc-icon-wrapper">{formData.plano ? <CheckCircle2 color="#10b981"/> : <AlertTriangle color="#ef4444"/>}</div>
                     <div className="nc-checktext">
                       <span className="nc-checktext-title">Plano Selecionado</span>
                       <span className="nc-checktext-desc">{formData.plano || 'Nenhum plano escolhido'}</span>
                     </div>
                   </div>
                   <div className="nc-checkitem">
                     <div className="nc-icon-wrapper">{formData.sindicoNome && formData.sindicoSenha ? <CheckCircle2 color="#10b981"/> : <AlertTriangle color="#ef4444"/>}</div>
                     <div className="nc-checktext">
                       <span className="nc-checktext-title">Síndico Master</span>
                       <span className="nc-checktext-desc">{formData.sindicoNome || 'Pendência no cadastro do líder'}</span>
                     </div>
                   </div>
                </div>

              </>
            )}

          </div>
        )}

      </div>

      {/* Footer Navigation */}
      {!isSuccess && (
        <div style={{backgroundColor:'transparent'}}>
          <div className="nc-footer">
            <button className="nc-btn-outline" onClick={handlePrev} disabled={step === 1}><ArrowLeft size={16}/> Voltar</button>
            
            <div className="nc-dots-indicator">
               {Array.from({length:10}).map((_, i) => (
                 <div key={i} className={`nc-dot ${i+1 <= step ? 'filled' : ''}`}></div>
               ))}
            </div>

            {step < 10 ? (
              <button className="nc-btn-primary" onClick={handleNext}>Continuar <ArrowRight size={16}/></button>
            ) : (
              <button className="nc-btn-green" disabled={Object.keys(errors).length > 0} onClick={handleActivate}><Check size={16}/> Ativar Condomínio</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NovoCondominio;
