import React, { useState, useRef } from 'react';
import {
  Menu, AlertTriangle, CheckCircle2, X, Play, UploadCloud, CheckCircle,
  MessageSquare, AlertCircle, User, Calendar, Building2, Timer, Camera,
  Eye, XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import { useAuth } from '../contexts/AuthContext';
import { criarNotificacao } from '../services/notificationService';
import './Dashboard.css';
import './PainelFuncionario.css';

// ─── DADOS ───────────────────────────────────────────────────────────────────
const CATEGORY_META = {
  Limpeza:        { color: '#2563eb', bg: '#eff6ff', icon: '🧹' },
  Manutenção:     { color: '#c2410c', bg: '#fff7ed', icon: '🔧' },
  Segurança:      { color: '#b91c1c', bg: '#fef2f2', icon: '🛡️' },
  Portaria:       { color: '#15803d', bg: '#f0fdf4', icon: '🏠' },
  Hidráulica:     { color: '#0e7490', bg: '#ecfeff', icon: '💧' },
  Elétrica:       { color: '#7c3aed', bg: '#f5f3ff', icon: '⚡' },
  Infraestrutura: { color: '#374151', bg: '#f9fafb', icon: '🏗️' },
};

const PRIORITY_META = {
  Urgente: { color: '#dc2626', bg: '#fef2f2', label: 'Urgente', dot: '#dc2626' },
  Alta:    { color: '#ea580c', bg: '#fff7ed', label: 'Alta',    dot: '#ea580c' },
  Média:   { color: '#d97706', bg: '#fffbeb', label: 'Média',   dot: '#d97706' },
  Normal:  { color: '#16a34a', bg: '#f0fdf4', label: 'Normal',  dot: '#16a34a' },
};

const STATUS_META = {
  Pendente:               { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', progress: 0   },
  'Em andamento':         { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', progress: 35  },
  'Aguardando validação': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', progress: 75  },
  Concluída:              { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', progress: 100 },
  'Não concluída':        { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', progress: 0   },
};

const TIMELINE_STEPS = [
  { key: 'criada',    label: 'Solicitação criada'    },
  { key: 'gerada',    label: 'Tarefa gerada'         },
  { key: 'atribuida', label: 'Funcionário atribuído' },
  { key: 'iniciada',  label: 'Serviço iniciado'      },
  { key: 'evidencia', label: 'Evidência enviada'     },
  { key: 'validando', label: 'Aguardando validação'  },
  { key: 'validada',  label: 'Validado pelo síndico' },
];

const initialTasks = [
  {
    id: 101,
    title: 'Vazamento no banheiro do apto 304',
    descricao: 'Morador relatou vazamento na tubulação do banheiro causando infiltração no teto do vizinho do andar de baixo. Necessário verificação urgente e reparo imediato.',
    bloco: 'Bloco B', apartamento: '304',
    status: 'Em andamento', priority: 'Urgente',
    slaHours: 2, hoursLeft: -2, category: 'Hidráulica',
    assigneeName: 'Maria Manutenção',
    moradorNome: 'João Silva', moradorApto: '304 - Bloco B',
    createdAt: '25/05/2026 08:15', prazo: '25/05/2026 10:00',
    unreadComments: 1,
    evidencias: [{ name: 'foto_vazamento_01.jpg', size: '2.3 MB', status: 'Enviada', url: null }],
    timelineEvents: { criada: '25/05 08:15', gerada: '25/05 08:20', atribuida: '25/05 08:25', iniciada: '25/05 08:30', evidencia: null, validando: null, validada: null },
    history: [
      { id: 1, author: 'Maria Manutenção', role: 'Técnico', time: 'Ontem, 14:00', text: 'Iniciei a quebra da parede para achar o cano furado.' },
      { id: 2, author: 'Roberto Síndico',  role: 'Síndico', time: 'Hoje, 09:00',  text: 'Maria, qual a previsão? O morador está cobrando.' },
    ],
  },
  {
    id: 102,
    title: 'Curto-circuito nas arandelas do Hall',
    descricao: 'Três arandelas do hall de entrada do Bloco A apresentaram curto-circuito após a chuva de ontem.',
    bloco: 'Bloco A', apartamento: 'Área comum',
    status: 'Pendente', priority: 'Alta',
    slaHours: 8, hoursLeft: 4, category: 'Elétrica',
    assigneeName: 'Maria Manutenção',
    moradorNome: 'Síndico Roberto', moradorApto: 'Área Comum',
    createdAt: '25/05/2026 06:00', prazo: '25/05/2026 14:00',
    unreadComments: 0, evidencias: [],
    timelineEvents: { criada: '25/05 06:00', gerada: '25/05 06:05', atribuida: '25/05 06:10', iniciada: null, evidencia: null, validando: null, validada: null },
    history: [],
  },
  {
    id: 103,
    title: 'Limpeza pós-obra na garagem',
    descricao: 'Limpeza completa da garagem do subsolo 2 após reforma. Remover entulho, limpar piso e sinalizar vagas.',
    bloco: 'Subsolo', apartamento: 'Garagem 2',
    status: 'Concluída', priority: 'Normal',
    slaHours: 6, hoursLeft: 48, category: 'Limpeza',
    assigneeName: 'Maria Manutenção',
    moradorNome: 'Síndico Roberto', moradorApto: 'Área Comum',
    createdAt: '24/05/2026 14:00', prazo: '25/05/2026 08:00',
    unreadComments: 0,
    evidencias: [
      { name: 'garagem_antes.jpg',  size: '1.5 MB', status: 'Validada', url: null },
      { name: 'garagem_depois.jpg', size: '1.7 MB', status: 'Validada', url: null },
    ],
    timelineEvents: { criada: '24/05 14:00', gerada: '24/05 14:05', atribuida: '24/05 14:10', iniciada: '24/05 15:00', evidencia: '25/05 07:30', validando: '25/05 07:35', validada: '25/05 08:10' },
    history: [
      { id: 1, author: 'Maria Manutenção', role: 'Técnico', time: '25/05 07:30', text: 'Serviço concluído. Entulho removido e piso lavado.' },
      { id: 2, author: 'Roberto Síndico',  role: 'Síndico', time: '25/05 08:10', text: '✅ Validado! Ótimo trabalho Maria.' },
    ],
  },
  {
    id: 104,
    title: 'Desentupir ralo da lavanderia coletiva',
    descricao: 'Ralo da área de lavanderia coletiva da cobertura está entupido há 2 dias causando acúmulo de água.',
    bloco: 'Cobertura', apartamento: 'Lavanderia',
    status: 'Pendente', priority: 'Média',
    slaHours: 24, hoursLeft: 20, category: 'Hidráulica',
    assigneeName: 'Maria Manutenção',
    moradorNome: 'Ana Costa', moradorApto: '801 - Cobertura',
    createdAt: '25/05/2026 07:00', prazo: '26/05/2026 07:00',
    unreadComments: 0, evidencias: [],
    timelineEvents: { criada: '25/05 07:00', gerada: '25/05 07:02', atribuida: '25/05 07:05', iniciada: null, evidencia: null, validando: null, validada: null },
    history: [],
  },
  {
    id: 106,
    title: 'Verificação câmeras - Portaria',
    descricao: 'Verificar e testar todas as câmeras da portaria. Conferir gravação, ângulo e qualidade de imagem.',
    bloco: 'Portaria', apartamento: 'Externo',
    status: 'Aguardando validação', priority: 'Normal',
    slaHours: 6, hoursLeft: 3, category: 'Segurança',
    assigneeName: 'Maria Manutenção',
    moradorNome: 'Síndico Roberto', moradorApto: 'Administração',
    createdAt: '24/05/2026 14:00', prazo: '25/05/2026 18:00',
    unreadComments: 0,
    evidencias: [
      { name: 'cam_01_ok.jpg', size: '1.8 MB', status: 'Enviada', url: null },
      { name: 'cam_02_ok.jpg', size: '2.1 MB', status: 'Enviada', url: null },
    ],
    timelineEvents: { criada: '24/05 14:00', gerada: '24/05 14:05', atribuida: '24/05 14:10', iniciada: '24/05 15:00', evidencia: '24/05 17:30', validando: '24/05 17:35', validada: null },
    history: [
      { id: 1, author: 'Maria Manutenção', role: 'Técnico', time: '24/05 17:30', text: 'Todas as câmeras testadas. Evidências anexadas.' },
    ],
  },
];

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const CategoryPill = ({ category }) => {
  const m = CATEGORY_META[category] || {};
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:400, color:m.color, background:m.bg }}>
      {m.icon} {category}
    </span>
  );
};

const PriorityPill = ({ priority }) => {
  const m = PRIORITY_META[priority] || PRIORITY_META.Normal;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:400, color:m.color, background:m.bg }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:m.dot, flexShrink:0 }} />
      {m.label}
    </span>
  );
};

const StatusPill = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.Pendente;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:400, color:m.color, background:m.bg, border:`0.5px solid ${m.border}` }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:m.color, flexShrink:0 }} />
      {status}
    </span>
  );
};

const ProgressBar = ({ value, color }) => (
  <div style={{ height:3, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
    <div style={{ height:'100%', width:`${value}%`, background:color, borderRadius:99, transition:'width .4s' }} />
  </div>
);

const TimelineDot = ({ done, active }) => (
  <div style={{ position:'absolute', left:-7, top:3, width:14, height:14, borderRadius:'50%', border:`2px solid ${done ? '#16a34a' : active ? '#3b82f6' : '#e2e8f0'}`, background:done ? '#f0fdf4' : active ? '#eff6ff' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
    {done && <CheckCircle2 size={8} color="#16a34a" />}
    {active && !done && <div style={{ width:6, height:6, borderRadius:'50%', background:'#3b82f6' }} />}
  </div>
);

const sectionLabel = { fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em', margin:'20px 0 8px' };
const actionBtn = (bg, color, disabled = false) => ({
  display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px',
  borderRadius:8, border:'none', background:bg, color, fontSize:13,
  fontWeight:500, cursor:disabled ? 'not-allowed' : 'pointer',
  fontFamily:'inherit', opacity:disabled ? .6 : 1,
});

// ─── DRAWER ───────────────────────────────────────────────────────────────────
const TaskDrawer = ({ task, onClose, onUpdate, currentUserName }) => {
  const [uploadedFiles, setUploadedFiles] = useState(task.evidencias || []);
  const [comment, setComment] = useState('');
  const [reason, setReason]   = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const canFinish = uploadedFiles.length > 0;
  const sm = STATUS_META[task.status] || STATUS_META.Pendente;
  const pm = PRIORITY_META[task.priority] || PRIORITY_META.Normal;
  const canAct = !['Concluída', 'Aguardando validação'].includes(task.status);
  const isLate = task.hoursLeft < 0 && canAct;
  const tlKeys = TIMELINE_STEPS.map(s => s.key);
  const lastDone = tlKeys.filter(k => task.timelineEvents[k]).length - 1;

  const handleFiles = (files) => {
    const next = [...uploadedFiles, ...Array.from(files).map(f => ({ name:f.name, size:`${(f.size/1048576).toFixed(1)} MB`, status:'Enviando...', url:URL.createObjectURL(f) }))];
    setUploadedFiles(next);
    setTimeout(() => setUploadedFiles(u => u.map(f => f.status === 'Enviando...' ? { ...f, status:'Enviada' } : f)), 1200);
  };

  const changeStatus = async (newStatus) => {
    if (newStatus === 'Concluída' && !canFinish) { alert('📸 Anexe pelo menos uma foto antes de concluir.'); return; }
    const history = [...task.history];
    if (comment.trim()) history.push({ id:Date.now(), author:currentUserName, role:'Técnico', time:'Agora mesmo', text:comment });
    if (newStatus === 'Não concluída' && reason.trim()) history.push({ id:Date.now()+1, author:currentUserName, role:'Técnico', time:'Agora mesmo', text:`[NÃO CONCLUÍDA] ${reason}` });
    const tl = { ...task.timelineEvents };
    if (newStatus === 'Em andamento' && !tl.iniciada) tl.iniciada = 'Agora';
    if (newStatus === 'Concluída') { tl.evidencia = tl.evidencia || 'Agora'; tl.validando = 'Agora'; }
    onUpdate(task.id, { status:newStatus, history, evidencias:uploadedFiles, timelineEvents:tl });
    
    // Notificar síndico sobre atualização na tarefa
    if (newStatus === 'Concluída' || newStatus === 'Não concluída') {
      await criarNotificacao({
        destinatario_id: 'sindico-mock-id', // ID do síndico (obter do backend)
        tipo: newStatus === 'Concluída' ? 'TAREFA_FINALIZADA' : 'TAREFA_NAO_CONCLUIDA',
        titulo: newStatus === 'Concluída' ? 'Tarefa Concluída' : 'Tarefa Não Concluída',
        descricao: `A tarefa "${task.title}" foi marcada como ${newStatus} por ${currentUserName}.`,
        referencia_tipo: 'ocorrencia',
        referencia_id: task.id,
        remetente_nome: currentUserName
      });
    }
    
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.4)', zIndex:200, animation:'fadeIn .2s' }} />
      <div style={{ position:'fixed', top:0, right:0, width:500, height:'100%', background:'#fff', zIndex:201, display:'flex', flexDirection:'column', borderLeft:'1px solid #f1f5f9', animation:'slideIn .22s ease' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, background:'#fff', zIndex:2 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <CategoryPill category={task.category} />
              <PriorityPill priority={task.priority} />
              <StatusPill status={task.status} />
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <X size={16} />
            </button>
          </div>
          <h2 style={{ fontSize:15, fontWeight:600, color:'#0f172a', lineHeight:1.3, margin:0 }}>{task.title}</h2>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:8 }}>
            <span style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:4 }}><Building2 size={12} /> {task.bloco} · {task.apartamento}</span>
            <span style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:4 }}><Calendar size={12} /> {task.prazo}</span>
            {isLate && <span style={{ fontSize:11, fontWeight:600, color:'#dc2626', background:'#fef2f2', padding:'2px 8px', borderRadius:99 }}>⚠️ Atrasado {Math.abs(task.hoursLeft)}h</span>}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'0 24px 32px' }}>

          {/* Solicitante */}
          <p style={sectionLabel}>Solicitante</p>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'#f8fafc', borderRadius:10, border:'1px solid #f1f5f9' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#1d4ed8', flexShrink:0 }}>{task.moradorNome.charAt(0)}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{task.moradorNome}</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>{task.moradorApto}</div>
            </div>
          </div>

          {/* Detalhes */}
          <p style={sectionLabel}>Detalhes</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[['Responsável', task.assigneeName], ['SLA', `${task.slaHours}h`], ['Prazo', task.prazo], ['Criada em', task.createdAt]].map(([label, value]) => (
              <div key={label} style={{ background:'#f8fafc', borderRadius:8, padding:'10px 12px', border:'1px solid #f1f5f9' }}>
                <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:500, color:'#1e293b' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Descrição */}
          <p style={sectionLabel}>Descrição</p>
          <div style={{ fontSize:13, color:'#475569', lineHeight:1.7, background:'#f8fafc', borderRadius:8, padding:'12px 14px', border:'1px solid #f1f5f9' }}>{task.descricao}</div>

          {canAct && (
            <>
              <p style={sectionLabel}>Upload de evidências</p>
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }} onClick={() => fileRef.current?.click()} style={{ border:`1.5px dashed ${dragOver ? '#16a34a' : '#e2e8f0'}`, borderRadius:10, padding:'22px 16px', textAlign:'center', cursor:'pointer', background:dragOver ? '#f0fdf4' : '#fafafa', transition:'all .2s' }}>
                <Camera size={24} color={dragOver ? '#16a34a' : '#cbd5e1'} style={{ display:'block', margin:'0 auto 8px' }} />
                <div style={{ fontSize:13, fontWeight:500, color:'#475569' }}>Arraste fotos ou clique para selecionar</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>JPG, PNG — máx 10 MB</div>
              </div>
              <input ref={fileRef} type="file" multiple accept="image/*" style={{ display:'none' }} onChange={e => handleFiles(e.target.files)} />
            </>
          )}

          {uploadedFiles.length > 0 && (
            <>
              <p style={sectionLabel}>Evidências anexadas</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {uploadedFiles.map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#f8fafc', borderRadius:8, border:'1px solid #f1f5f9' }}>
                    <div style={{ width:36, height:36, borderRadius:6, background:'#e0e7ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📷</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:'#1e293b' }}>{f.name}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>{f.size}</div>
                    </div>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, fontWeight:600, background:f.status==='Validada'?'#f0fdf4':f.status==='Enviando...'?'#fffbeb':'#f0fdf4', color:f.status==='Validada'?'#15803d':f.status==='Enviando...'?'#b45309':'#15803d' }}>{f.status}</span>
                    {canAct && <button onClick={() => setUploadedFiles(uploadedFiles.filter((_,idx) => idx !== i))} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:2 }}><X size={14} /></button>}
                  </div>
                ))}
              </div>
            </>
          )}

          {canAct && (
            <>
              <p style={sectionLabel}>Comentário / observação</p>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Reporte algo ao síndico..." style={{ width:'100%', minHeight:80, borderRadius:8, border:'1px solid #e2e8f0', padding:'10px 12px', fontSize:13, fontFamily:'inherit', resize:'vertical', background:'#f8fafc', color:'#1e293b', boxSizing:'border-box', outline:'none' }} />
              <p style={sectionLabel}>Motivo de não conclusão (opcional)</p>
              <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Morador ausente, falta de peça..." style={{ width:'100%', minHeight:64, borderRadius:8, border:'1px solid #e2e8f0', padding:'10px 12px', fontSize:13, fontFamily:'inherit', resize:'vertical', background:'#f8fafc', color:'#1e293b', boxSizing:'border-box', outline:'none' }} />
            </>
          )}

          {task.history.length > 0 && (
            <>
              <p style={sectionLabel}>Histórico</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {task.history.map(item => (
                  <div key={item.id} style={{ display:'flex', gap:10 }}>
                    <div style={{ width:30, height:30, borderRadius:'50%', background:item.role==='Síndico'?'#fef3c7':'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:item.role==='Síndico'?'#92400e':'#1d4ed8', flexShrink:0, marginTop:2 }}>{item.author.charAt(0)}</div>
                    <div style={{ flex:1, background:'#f8fafc', borderRadius:8, padding:'10px 12px', border:'1px solid #f1f5f9' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'#1e293b' }}>{item.author}</span>
                        <span style={{ fontSize:11, color:'#94a3b8' }}>{item.time}</span>
                      </div>
                      <p style={{ fontSize:12, color:'#475569', margin:0, lineHeight:1.5 }}>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <p style={sectionLabel}>Andamento</p>
          <div style={{ position:'relative', paddingLeft:20 }}>
            <div style={{ position:'absolute', left:7, top:6, bottom:6, width:1, background:'#f1f5f9' }} />
            {TIMELINE_STEPS.map((step, i) => {
              const time = task.timelineEvents[step.key];
              const isDone = !!time;
              const isActive = !isDone && i === lastDone + 1;
              return (
                <div key={step.key} style={{ position:'relative', paddingBottom:14, paddingLeft:16 }}>
                  <TimelineDot done={isDone} active={isActive} />
                  <div style={{ fontSize:13, fontWeight:isDone?500:400, color:isDone?'#1e293b':'#94a3b8' }}>{step.label}</div>
                  {time && <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{time}</div>}
                </div>
              );
            })}
          </div>

          {canAct && (
            <>
              <p style={sectionLabel}>Ações</p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {task.status === 'Pendente' && <button onClick={() => changeStatus('Em andamento')} style={actionBtn('#16a34a','#fff')}><Play size={14} /> Iniciar serviço</button>}
                {task.status === 'Em andamento' && <button onClick={() => changeStatus('Concluída')} disabled={!canFinish} style={actionBtn(canFinish?'#16a34a':'#94a3b8','#fff',!canFinish)}><CheckCircle2 size={14} /> Finalizar tarefa</button>}
                <button onClick={() => changeStatus('Não concluída')} style={actionBtn('#fef2f2','#b91c1c')}><XCircle size={14} /> Não concluída</button>
              </div>
              {task.status === 'Em andamento' && !canFinish && (
                <p style={{ fontSize:11, color:'#b45309', marginTop:8, display:'flex', alignItems:'center', gap:4 }}><AlertCircle size={12} /> Anexe pelo menos uma foto para finalizar</p>
              )}
            </>
          )}

          {task.status === 'Aguardando validação' && (
            <div style={{ margin:'20px 0', padding:'12px 14px', background:'#fffbeb', borderRadius:8, border:'1px solid #fde68a', display:'flex', gap:8, alignItems:'center' }}>
              <Timer size={16} color="#b45309" style={{ flexShrink:0 }} />
              <span style={{ fontSize:13, color:'#b45309' }}>Aguardando validação do síndico. O morador foi notificado.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const TaskCard = ({ task, onClick }) => {
  const sm = STATUS_META[task.status] || STATUS_META.Pendente;
  const pm = PRIORITY_META[task.priority] || PRIORITY_META.Normal;
  const isConcluida = task.status === 'Concluída';
  const isLate = task.hoursLeft < 0 && !['Concluída','Aguardando validação'].includes(task.status);

  const accentColor =
    isConcluida ? '#16a34a' :
    isLate ? '#dc2626' :
    task.status === 'Aguardando validação' ? '#b45309' :
    task.hoursLeft <= 4 ? '#f59e0b' : '#e2e8f0';

  const sla = isConcluida
    ? { text:'Concluída no prazo', color:'#15803d', bg:'#f0fdf4' }
    : task.status === 'Aguardando validação'
    ? { text:'Aguardando síndico', color:'#b45309', bg:'#fffbeb' }
    : isLate
    ? { text:`Atrasado ${Math.abs(task.hoursLeft)}h`, color:'#dc2626', bg:'#fef2f2' }
    : { text:`${task.hoursLeft}h restantes`, color:'#16a34a', bg:'#f0fdf4' };

  return (
    <div
      onClick={() => onClick(task)}
      style={{ background:'#fff', borderRadius:12, cursor:'pointer', border:`0.5px solid ${accentColor === '#e2e8f0' ? '#e2e8f0' : accentColor + '33'}`, borderLeft:`3px solid ${accentColor}`, padding:'16px 18px', transition:'box-shadow .18s, transform .12s', boxSizing:'border-box' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.07)'; e.currentTarget.style.transform='translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}
    >
      {/* Título + SLA */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:10 }}>
        <h3 style={{ fontSize:14, fontWeight:600, color:'#0f172a', lineHeight:1.35, margin:0, flex:1 }}>{task.title}</h3>
        <span style={{ fontSize:11, fontWeight:500, color:sla.color, background:sla.bg, padding:'3px 10px', borderRadius:99, whiteSpace:'nowrap', flexShrink:0 }}>{sla.text}</span>
      </div>

      {/* Pills */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
        <CategoryPill category={task.category} />
        <PriorityPill priority={task.priority} />
        <StatusPill status={task.status} />
        {task.unreadComments > 0 && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:99, background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:500 }}>
            <MessageSquare size={11} /> {task.unreadComments} nova(s)
          </span>
        )}
      </div>

      <div style={{ display:'flex', gap:16, marginBottom:14 }}>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#64748b' }}><Building2 size={11} /> {task.bloco} · {task.apartamento}</span>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#64748b' }}><User size={11} /> {task.moradorNome}</span>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#64748b' }}><Calendar size={11} /> {task.createdAt.slice(0,10)}</span>
      </div>

      {/* Footer: progresso + ações */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#94a3b8', marginBottom:4 }}>
            <span>Progresso</span><span>{sm.progress}%</span>
          </div>
          <ProgressBar value={sm.progress} color={pm.dot} />
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          <button onClick={e => { e.stopPropagation(); onClick(task); }} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:6, border:'0.5px solid #e2e8f0', background:'#f8fafc', color:'#64748b', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
            <Eye size={11} /> Ver
          </button>
          {task.status === 'Pendente' && (
            <button onClick={e => { e.stopPropagation(); onClick(task); }} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:6, border:'none', background:'#16a34a', color:'#fff', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
              <Play size={11} /> Iniciar
            </button>
          )}
          {task.status === 'Em andamento' && (
            <>
              <button onClick={e => { e.stopPropagation(); onClick(task); }} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:6, border:'none', background:'#eff6ff', color:'#1d4ed8', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                <UploadCloud size={11} /> Evidência
              </button>
              <button onClick={e => { e.stopPropagation(); onClick(task); }} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:6, border:'none', background:'#16a34a', color:'#fff', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                <CheckCircle2 size={11} /> Finalizar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const PainelFuncionario = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks]             = useState(initialTasks);
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [selectedTask, setSelectedTask] = useState(null);

  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const userName = currentUser?.name || 'Funcionário';

  const emAndamento = tasks.filter(t => t.status === 'Em andamento').length;
  const atrasadas   = tasks.filter(t => t.hoursLeft < 0 && !['Concluída','Aguardando validação'].includes(t.status)).length;
  const concluidas  = tasks.filter(t => t.status === 'Concluída').length;
  const pendentes   = tasks.filter(t => t.status !== 'Concluída').length;

  const FILTERS = [
    { label: 'Todas' },
    { label: 'Pendentes',            match: t => t.status === 'Pendente' },
    { label: 'Em andamento',         match: t => t.status === 'Em andamento' },
    { label: 'Aguardando validação', match: t => t.status === 'Aguardando validação' },
    { label: 'Finalizadas',          match: t => t.status === 'Concluída' },
    { label: 'Atrasadas',            match: t => t.hoursLeft < 0 && !['Concluída','Aguardando validação'].includes(t.status) },
  ];

  const filteredTasks = tasks.filter(t => {
    const f = FILTERS.find(f => f.label === activeFilter);
    return !f?.match || f.match(t);
  });

  const handleUpdate = (id, changes) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));

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
            <div className="user-profile-dropdown" onClick={() => navigate('/perfil')} style={{ cursor:'pointer' }}>
              <div className="user-avatar" style={{ background:'#16a34a' }}>
                <span>{userName.charAt(0)}</span>
              </div>
            </div>
          </div>
        </header>

        <ContextBanner />

        <div className="dashboard-content-scroll pf-container">

          {/* Saudação */}
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:22, fontWeight:600, color:'#0f172a', margin:0 }}>Olá, {userName.split(' ')[0]}! </h1>
            <p style={{ fontSize:13, color:'#64748b', marginTop:4 }}>
              Segunda-feira, 25 de maio · Você tem <strong style={{ color:'#0f172a' }}>{pendentes}</strong> tarefa(s) pendentes.
            </p>
          </div>

          {/* Métricas */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
            {[
              { icon:<Play size={18} />, iconBg:'#eff6ff', iconColor:'#2563eb', num:emAndamento, label:'Em andamento', sub:'tarefas ativas' },
              { icon:<AlertTriangle size={18} />, iconBg:'#fef2f2', iconColor:'#dc2626', num:atrasadas, label:'Atrasadas (SLA)', sub:'fora do prazo', warn:true },
              { icon:<CheckCircle size={18} />, iconBg:'#f0fdf4', iconColor:'#16a34a', num:concluidas, label:'Concluídas', sub:'hoje', good:true },
            ].map(({ icon, iconBg, iconColor, num, label, sub, warn, good }) => (
              <div key={label} style={{ background:'#fff', borderRadius:14, border:`0.5px solid ${warn && num > 0 ? '#fecaca' : '#f1f5f9'}`, padding:'18px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:12, color:'#94a3b8', fontWeight:400, marginBottom:6 }}>{label}</div>
                    <div style={{ fontSize:28, fontWeight:600, color:warn && num > 0 ? '#dc2626' : '#0f172a', lineHeight:1 }}>{num}</div>
                  </div>
                  <div style={{ width:40, height:40, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', color:iconColor }}>{icon}</div>
                </div>
                <div style={{ fontSize:11, color:warn && num > 0 ? '#dc2626' : good && num > 0 ? '#16a34a' : '#94a3b8' }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
            {FILTERS.map(f => (
              <button key={f.label} onClick={() => setActiveFilter(f.label)} style={{
                padding:'6px 14px', borderRadius:99, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                border:`0.5px solid ${activeFilter === f.label ? '#0f172a' : '#e2e8f0'}`,
                background:activeFilter === f.label ? '#0f172a' : '#fff',
                color:activeFilter === f.label ? '#fff' : '#64748b',
                fontWeight:activeFilter === f.label ? 500 : 400, transition:'all .15s',
              }}>
                {f.label}
                {f.label === 'Atrasadas' && atrasadas > 0 && (
                  <span style={{ marginLeft:5, background:'#dc2626', color:'#fff', borderRadius:99, padding:'1px 6px', fontSize:10, fontWeight:700 }}>{atrasadas}</span>
                )}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filteredTasks.length > 0
              ? filteredTasks.map(task => <TaskCard key={task.id} task={task} onClick={setSelectedTask} />)
              : (
                <div style={{ padding:'3rem', textAlign:'center', border:'0.5px dashed #e2e8f0', borderRadius:12, background:'#fafafa' }}>
                  <CheckCircle2 size={32} color="#e2e8f0" style={{ display:'block', margin:'0 auto 12px' }} />
                  <div style={{ fontSize:14, fontWeight:500, color:'#64748b' }}>Nenhuma tarefa encontrada</div>
                  <div style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>Excelente trabalho! 🎉</div>
                </div>
              )
            }
          </div>

        </div>
      </main>

      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(id, changes) => { handleUpdate(id, changes); setSelectedTask(null); }}
          currentUserName={userName}
        />
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideIn { from { transform:translateX(30px); opacity:0 } to { transform:translateX(0); opacity:1 } }
      `}</style>
    </div>
  );
};

export default PainelFuncionario;