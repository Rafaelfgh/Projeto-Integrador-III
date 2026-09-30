import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, CheckCircle2, AlertCircle, Clock, BarChart3, X, Send, ShieldAlert,
  MapPin, FileText,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import ContextBanner from '../components/ContextBanner';
import NotificationMenu from '../components/NotificationMenu';
import { supabase } from '../backend/supabaseClient';
import GerenciarOcorrencia from '../components/GerenciarOcorrencia';
import { contemPalavrao, MSG_PALAVRAO } from '../utils/palavroes';
import './Dashboard.css';
import './PainelSindico.css';

export const CATEGORIA_SETOR = {
  'hidraulica':    'manutencao',
  'manutencao':    'manutencao',
  'limpeza':       'limpeza',
  'jardinagem':    'limpeza',
  'seguranca':     'seguranca',
  'areas_comuns':  'infraestrutura',
  'estrutural':    'infraestrutura',
  'barulho':       'seguranca',
  'garagem':       'infraestrutura',
  'Hidráulica':    'manutencao',
  'Elétrica':      'infraestrutura',
  'Infraestrutura':'infraestrutura',
  'Limpeza':       'limpeza',
  'Barulho':       'seguranca',
  'Portaria':      'seguranca',
  'Jardinagem':    'limpeza',
  'Manutenção Geral':'manutencao',
  'Outros':        'manutencao',
};

export const CATEGORIA_LABEL = {
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

export const SETOR_LABEL = {
  manutencao:    'Manutenção',
  infraestrutura:'Infraestrutura',
  limpeza:       'Limpeza',
  seguranca:     'Segurança',
};

export const SETOR_COLOR = {
  manutencao:    { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  infraestrutura:{ bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  limpeza:       { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  seguranca:     { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
};

const kpiData = {
  abertas:   { value: 8,  trend: 'up',      trendValue: '12%' },
  analise:   { value: 5,  trend: 'down',    trendValue: '4%'  },
  resolvidas:{ value: 24, trend: 'up',      trendValue: '18%' },
  total:     { value: 37, trend: 'neutral', trendValue: '0%'  },
};

const dataTimeline = [
  { name: '01/03', abertas: 3, resolvidas: 2 },
  { name: '05/03', abertas: 4, resolvidas: 3 },
  { name: '10/03', abertas: 2, resolvidas: 5 },
  { name: '15/03', abertas: 5, resolvidas: 2 },
  { name: '20/03', abertas: 3, resolvidas: 7 },
  { name: '25/03', abertas: 1, resolvidas: 4 },
];

const dataCategory = [
  { name: 'Hidráulica', value: 35, fill: '#6366f1' },
  { name: 'Elétrica',   value: 25, fill: '#818cf8' },
  { name: 'Barulho',    value: 20, fill: '#a5b4fc' },
  { name: 'Limpeza',    value: 15, fill: '#c7d2fe' },
  { name: 'Outros',     value: 5,  fill: '#e0e7ff' },
];

const dataStatus = [
  { name: 'Abertas',    value: 8,  fill: '#ef4444' },
  { name: 'Em Análise', value: 5,  fill: '#f59e0b' },
  { name: 'Resolvidas', value: 24, fill: '#10b981' },
];

const recentOccurrences = [
  { id: 1, title: 'Vazamento no banheiro',    subtitle: 'Apt 301 - Bloco A', category: 'Hidráulica',  status: 'Aberta',      timeOpen: 'há 2 horas', responsible: null,         isReclamacao: false },
  { id: 2, title: 'Falta de luz no corredor', subtitle: '3º Andar - Bloco B', category: 'Elétrica',   status: 'Em Andamento', timeOpen: 'há 5 horas', responsible: 'João Silva', isReclamacao: false },
  { id: 3, title: 'Festa com som alto',       subtitle: 'Apt 502 - Bloco C',  category: 'Barulho',    status: 'Aberta',      timeOpen: 'há 1 dia',   responsible: null,         isReclamacao: false },
].map(occ => ({ ...occ, setor: CATEGORIA_SETOR[occ.category] ?? 'manutencao' }));

const slaEmRisco = [
  { id: 101, title: 'Conserto Elevador',      category: 'Infraestrutura', timeRemaining: '< 2h', priority: 'danger'  },
  { id: 102, title: "Vazamento Caixa D'água", category: 'Hidráulica',     timeRemaining: '4h',   priority: 'warning' },
];

const heatmapDays  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const heatmapTimes = ['08h','10h','12h','14h','16h','18h','20h'];
const heatmapData  = Array.from({ length: 7 }, () =>
  Array.from({ length: 7 }, () => Math.floor(Math.random() * 5))
);

// ---------------------------------------------------------------------------
// CustomTooltip
// ---------------------------------------------------------------------------
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor:'#1e293b', padding:'12px', border:'1px solid #334155', borderRadius:'8px' }}>
      <p style={{ color:'#f8fafc', fontWeight:600, marginBottom:8, fontSize:'0.85rem' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', backgroundColor: entry.color || entry.fill }} />
          <span style={{ color:'#cbd5e1', fontSize:'0.75rem', textTransform:'capitalize' }}>{entry.name}:</span>
          <span style={{ color:'white', fontWeight:'bold', fontSize:'0.8rem' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const SetorBadge = ({ setor }) => {
  const cfg = SETOR_COLOR[setor] ?? SETOR_COLOR.manutencao;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px',
      borderRadius:20, fontSize:'0.72rem', fontWeight:600,
      background:cfg.bg, color:cfg.text, border:`1px solid ${cfg.border}`, whiteSpace:'nowrap',
    }}>
      {SETOR_LABEL[setor]}
    </span>
  );
};

const ResponsavelChip = ({ name }) => (
  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.8rem', color:'#334155', fontWeight:500 }}>
    <div style={{ width:24, height:24, borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:700 }}>
      {name.charAt(0)}
    </div>
    {name}
  </div>
);

// ---------------------------------------------------------------------------
// TabelaComAbas — separa Ocorrências de Reclamações em abas distintas
// ---------------------------------------------------------------------------
const TabelaComAbas = ({ ocorrencias, reclamacoes, onGerenciar, onAbrirReclamacao, respondidas }) => {
  const [abaAtiva, setAbaAtiva] = useState('ocorrencias');

  const abas = [
    { key: 'ocorrencias', label: '📋 Ocorrências', count: ocorrencias.length },
    { key: 'reclamacoes', label: '🔒 Reclamações', count: reclamacoes.length },
  ];

  const tabStyle = (key) => ({
    padding: '0.6rem 1.25rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    borderBottom: abaAtiva === key ? '2px solid #f97316' : '2px solid transparent',
    background: 'none',
    color: abaAtiva === key ? '#f97316' : '#64748b',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'inherit',
  });

  const countBadge = (n, active) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    fontSize: '0.7rem',
    fontWeight: 700,
    background: active ? '#fff7ed' : '#f1f5f9',
    color: active ? '#f97316' : '#94a3b8',
    padding: '0 6px',
  });

  return (
    <div className="ps-card" style={{ padding: '1.25rem 0 0 0', overflow: 'hidden' }}>
      {/* Header com abas */}
      <div style={{ padding: '0 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <h3 className="ps-section-title">Registros Recentes</h3>
            <p className="ps-section-subtitle">Gerencie ocorrências e reclamações separadamente</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {abas.map(a => (
            <button key={a.key} style={tabStyle(a.key)} onClick={() => setAbaAtiva(a.key)}>
              {a.label}
              <span style={countBadge(a.count, abaAtiva === a.key)}>{a.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Aba Ocorrências */}
      {abaAtiva === 'ocorrencias' && (
        <div className="ps-table-wrapper">
          <table className="ps-table-modern" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '30%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '28%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Ocorrência</th>
                <th>Setor</th>
                <th>Status</th>
                <th>Data</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {ocorrencias.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Nenhuma ocorrência registrada
                  </td>
                </tr>
              ) : ocorrencias.map(occ => (
                <tr key={occ.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
                      {occ.title}
                      {occ.pessoal && (
                        <span style={{ marginLeft: 6, fontSize: '0.68rem', fontWeight: 700, color: '#6d28d9', background: '#f5f3ff', borderRadius: 999, padding: '1px 7px' }}>Pessoal</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                      {occ.subtitle} · {occ.categoryLabel || occ.category}
                    </div>
                  </td>
                  <td><SetorBadge setor={occ.setor} /></td>
                  <td>
                    <span className={`badge-pill ${occ.status === 'Aberta' ? 'badge-red' : occ.status === 'Em Andamento' ? 'badge-yellow' : 'badge-green'}`}>
                      {occ.status}
                    </span>
                  </td>
                  <td>
                    <div className="time-open"><Clock size={12} /> {occ.timeOpen}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {occ.responsible
                        ? <ResponsavelChip name={occ.responsible} />
                        : <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sem responsável</span>}
                      <button
                        onClick={() => onGerenciar(occ.id)}
                        style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 6, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4338ca', cursor: 'pointer' }}
                      >
                        Gerenciar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aba Reclamações */}
      {abaAtiva === 'reclamacoes' && (
        <div className="ps-table-wrapper">
          <table className="ps-table-modern" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '35%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '22%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Local denunciado</th>
                <th>Data</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {reclamacoes.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Nenhuma reclamação registrada
                  </td>
                </tr>
              ) : reclamacoes.map(rec => {
                const foiRespondida = respondidas.has(rec.rawId);
                return (
                <tr
                  key={rec.id}
                  onClick={() => onAbrirReclamacao(rec)}
                  style={{
                    cursor: 'pointer',
                    background: foiRespondida ? 'white' : '#fdf4ff',
                    opacity: foiRespondida ? 0.75 : 1,
                  }}
                >
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
                      🔒 Reclamação Particular
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {rec.descricao || 'Sem descrição'}
                    </div>
                  </td>
                  <td>
                    {/* Registros antigos tinham bloco_denunciado = 'Ver unidade' (bug corrigido).
                        Se for esse valor ou nulo, mostra só o apartamento sem o bloco. */}
                    {(() => {
                      const blocoValido = rec.bloco_denunciado && rec.bloco_denunciado !== 'Ver unidade';
                      const apt = rec.apartamento_denunciado || '—';
                      return blocoValido ? (
                        <>
                          <div style={{ fontWeight:600, color:'#0f172a', fontSize:'0.85rem' }}>Bloco {rec.bloco_denunciado}</div>
                          <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2 }}>Apt {apt}</div>
                        </>
                      ) : (
                        <div style={{ fontWeight:600, color:'#0f172a', fontSize:'0.85rem' }}>Apt {apt}</div>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="time-open"><Clock size={12} /> {rec.timeOpen}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: '#7e22ce', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldAlert size={13} /> Ver e responder
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button style={{ padding: '0.25rem 0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>Anterior</button>
        <button style={{ padding: '0.25rem 0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>Próxima</button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// DrawerReclamacao — privacidade: denunciante anônimo, local do denunciado visível
// ---------------------------------------------------------------------------
const DrawerReclamacao = ({ reclamacao, onFechar, currentUser, onRespondida }) => {
  const [resposta,  setResposta]  = useState('');
  const [enviando,  setEnviando]  = useState(false);
  const [enviado,   setEnviado]   = useState(false);
  const [erro,      setErro]      = useState(null);

  const enviarResposta = async () => {
    if (!resposta.trim() || enviando) return;
    setErro(null);
    if (await contemPalavrao(resposta)) {
      setErro(MSG_PALAVRAO);
      return;
    }
    setEnviando(true);

    const { error } = await supabase
      .from('notificacoes')
      .insert({
        destinatario_id: reclamacao.morador_id,
        condominio_id:   currentUser.condominio_id,
        tipo:            'RESPOSTA_RECLAMACAO',
        titulo:          'O síndico respondeu sua reclamação',
        descricao:       resposta.trim(),
        lida:            false,
        referencia_tipo: 'reclamacao',
        referencia_id:   String(reclamacao.rawId),
        remetente_nome:  currentUser?.name || 'Síndico',
      });

    setEnviando(false);
    if (error) {
      console.error('Erro ao enviar resposta:', error);
      setErro(error.message);
      return;
    }
    setEnviado(true);
    setResposta('');
    onRespondida(reclamacao.rawId);
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onFechar}
        style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)', zIndex:200 }}
      />

      {/* Drawer */}
      <div style={{
        position:'fixed', top:0, right:0, width:480, height:'100%',
        background:'#fff', zIndex:201, overflowY:'auto',
        borderLeft:'1px solid #e2e8f0', display:'flex', flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{ padding:24, borderBottom:'1px solid #f1f5f9', background:'#fdf4ff' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'#f3e8ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <ShieldAlert size={22} color="#7e22ce" />
              </div>
              <div>
                <h2 style={{ margin:0, fontSize:18, color:'#0f172a', fontWeight:700 }}>Reclamação Particular</h2>
                <p style={{ margin:'4px 0 0', fontSize:12, color:'#7e22ce', fontWeight:600 }}>
                  🔒 Confidencial — denunciante anônimo
                </p>
              </div>
            </div>
            <button onClick={onFechar} style={{ width:36, height:36, borderRadius:12, border:'none', cursor:'pointer', background:'white' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding:24, flex:1, display:'flex', flexDirection:'column', gap:20 }}>

          {/* Local denunciado — síndico precisa saber onde agir */}
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b', marginBottom:10 }}>
              <MapPin size={15} />
              <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Local denunciado</span>
            </div>
            <div style={{ display:'flex', gap:16 }}>
              {reclamacao.bloco_denunciado && reclamacao.bloco_denunciado !== 'Ver unidade' && (
                <div>
                  <p style={{ margin:0, fontSize:12, color:'#94a3b8' }}>Bloco</p>
                  <p style={{ margin:'2px 0 0', fontSize:15, fontWeight:700, color:'#0f172a' }}>
                    {reclamacao.bloco_denunciado}
                  </p>
                </div>
              )}
              <div>
                <p style={{ margin:0, fontSize:12, color:'#94a3b8' }}>Apartamento</p>
                <p style={{ margin:'2px 0 0', fontSize:15, fontWeight:700, color:'#0f172a' }}>
                  {reclamacao.apartamento_denunciado || '—'}
                </p>
              </div>
              <div>
                <p style={{ margin:0, fontSize:12, color:'#94a3b8' }}>Data</p>
                <p style={{ margin:'2px 0 0', fontSize:13, fontWeight:600, color:'#475569' }}>
                  {new Date(reclamacao.criado_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b', marginBottom:10 }}>
              <FileText size={15} />
              <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Descrição</span>
            </div>
            <div style={{ background:'#f8fafc', borderRadius:12, padding:16, color:'#334155', fontSize:14, lineHeight:1.7 }}>
              {reclamacao.descricao || 'Sem descrição.'}
            </div>
          </div>

          {/* Denunciante — anônimo */}
          <div style={{ background:'#fafafa', border:'1.5px dashed #e2e8f0', borderRadius:12, padding:14, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:16 }}>👤</span>
            </div>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#475569' }}>Morador anônimo</p>
              <p style={{ margin:'2px 0 0', fontSize:12, color:'#94a3b8' }}>Identidade protegida por privacidade</p>
            </div>
          </div>

          {/* Campo de resposta */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b' }}>
              <Send size={15} />
              <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Responder ao morador</span>
            </div>
            <p style={{ margin:0, fontSize:12, color:'#94a3b8' }}>
              A resposta chegará como notificação para quem fez a reclamação, sem revelar que você sabe a identidade dele.
            </p>
            <textarea
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              placeholder="Escreva aqui o retorno para o morador. Ex: 'Recebemos sua reclamação e vamos tomar as medidas cabíveis...'"
              disabled={enviado}
              style={{
                flex:1, minHeight:130, borderRadius:14, border:'1.5px solid #e2e8f0',
                padding:16, resize:'none', fontFamily:'inherit', fontSize:14,
                outline:'none', lineHeight:1.6,
                background: enviado ? '#f0fdf4' : 'white',
                color: enviado ? '#15803d' : '#334155',
              }}
            />

            {erro && (
              <p style={{ margin:0, fontSize:13, color:'#b91c1c', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'8px 12px' }}>{erro}</p>
            )}
            {enviado ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', background:'#f0fdf4', borderRadius:12, border:'1px solid #bbf7d0' }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span style={{ fontSize:13, fontWeight:600, color:'#16a34a' }}>Resposta enviada com sucesso!</span>
              </div>
            ) : (
              <button
                onClick={enviarResposta}
                disabled={!resposta.trim() || enviando}
                style={{
                  height:46, border:'none', borderRadius:14,
                  background: resposta.trim() ? '#7e22ce' : '#e2e8f0',
                  color: resposta.trim() ? 'white' : '#94a3b8',
                  fontWeight:700, fontSize:14, cursor: resposta.trim() ? 'pointer' : 'not-allowed',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  transition:'all 0.2s',
                }}
              >
                <Send size={16} />
                {enviando ? 'Enviando...' : 'Enviar resposta ao morador'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// PainelSindico
// ---------------------------------------------------------------------------
const PainelSindico = () => {
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [reclamacaoAberta, setReclamacaoAberta]  = useState(null);
  const [respondidas,      setRespondidas]       = useState(new Set());
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [occurrencesList, setOccurrencesList] = useState([]);
  const [funcionarios,    setFuncionarios]    = useState([]);
  const [kpis,            setKpis]            = useState(kpiData);
  const [statusChart,     setStatusChart]     = useState(dataStatus);
  const [gerenciando,     setGerenciando]     = useState(null);

  const fetchDados = React.useCallback(async () => {
    if (!currentUser?.condominio_id) return;

    const [{ data: funcs }, { data: esp }] = await Promise.all([
      supabase.from('Funcionarios').select('id, nome').eq('condominio_id', currentUser.condominio_id).eq('status', 'ATIVO'),
      supabase.from('funcionario_especialidades').select('funcionario_id, categoria'),
    ]);

    const { data: occ } = await supabase
      .from('Ocorrencias')
      .select('*, Moradores(nome, bloco, apartamento), Funcionarios(nome)')
      .eq('condominio_id', currentUser.condominio_id)
      .order('created_at', { ascending: false });

    const { data: rec } = await supabase
      .from('Reclamacoes')
      .select('*, Moradores(nome, bloco, apartamento)')
      .eq('condominio_id', currentUser.condominio_id)
      .order('created_at', { ascending: false });

    // Carga real da equipe: especialidades e tarefas abertas por funcionário
    const espPorFunc = {};
    (esp || []).forEach(e => { (espPorFunc[e.funcionario_id] ||= []).push(e.categoria); });
    const abertasPorFunc = {};
    (occ || []).forEach(o => {
      if (o.atribuido_a && o.status !== 'Resolvida') abertasPorFunc[o.atribuido_a] = (abertasPorFunc[o.atribuido_a] || 0) + 1;
    });
    setFuncionarios((funcs || []).map(f => ({
      ...f,
      especialidades: espPorFunc[f.id] || [],
      abertas: abertasPorFunc[f.id] || 0,
    })));

    let all = [];
    if (occ) {
      all = all.concat(occ.map(o => ({
        id:            o.id,
        isReclamacao:  false,
        title:         o.titulo,
        subtitle:      o.Moradores ? `Bloco ${o.Moradores.bloco} - Apt ${o.Moradores.apartamento}` : 'Área Comum',
        category:      o.categoria || 'Outros',
        categoryLabel: CATEGORIA_LABEL[o.categoria] || o.categoria,
        status:        o.status || 'Aberta',
        pessoal:       o.privacidade === 'pessoal',
        timeOpen:      new Date(o.created_at).toLocaleDateString(),
        responsible:   o.Funcionarios?.nome || null,
        atribuido_a:   o.atribuido_a || null,
        setor:         CATEGORIA_SETOR[o.categoria] || 'manutencao',
        criado_em:     new Date(o.created_at).getTime(),
      })));
    }

    if (rec) {
      all = all.concat(rec.map(r => ({
        id:                    `r-${r.id}`,
        rawId:                 r.id,
        isReclamacao:          true,
        title:                 'Reclamação Particular',
        subtitle:              `Bloco ${r.bloco_denunciado || '?'} - Apt ${r.apartamento_denunciada || r.apartamento_denunciado || '?'}`,
        category:              'barulho',
        categoryLabel:         '🔊 Reclamação',
        status:                'Aberta',
        timeOpen:              new Date(r.created_at).toLocaleDateString(),
        responsible:           null,
        atribuido_a:           null,
        setor:                 'seguranca',
        criado_em:             new Date(r.created_at).getTime(),
        // Dados do drawer — denunciante anônimo pro síndico, mas morador_id
        // guardado pra poder enviar notificação de resposta
        morador_id:            r.morador_id,
        descricao:             r.descricao,
        bloco_denunciado:      r.bloco_denunciado,
        apartamento_denunciado: r.apartamento_denunciada || r.apartamento_denunciado,
      })));
    }

    all.sort((a, b) => b.criado_em - a.criado_em);

    if (all.length > 0) {
      setOccurrencesList(all.slice(0, 15));

      const abertas     = all.filter(x => x.status === 'Aberta').length;
      const emAndamento = all.filter(x => x.status === 'Em Andamento').length;
      const resolvidas  = all.filter(x => x.status === 'Resolvida').length;

      setKpis({
        abertas:   { value: abertas,      trend: 'neutral', trendValue: '' },
        analise:   { value: emAndamento,  trend: 'neutral', trendValue: '' },
        resolvidas:{ value: resolvidas,   trend: 'neutral', trendValue: '' },
        total:     { value: all.length,   trend: 'neutral', trendValue: '' },
      });
      setStatusChart([
        { name: 'Abertas',      value: abertas,     fill: '#ef4444' },
        { name: 'Em Andamento', value: emAndamento, fill: '#f59e0b' },
        { name: 'Resolvidas',   value: resolvidas,  fill: '#10b981' },
      ]);
    } else {
      setOccurrencesList(recentOccurrences);
    }
  }, [currentUser?.condominio_id]);

  React.useEffect(() => { fetchDados(); }, [fetchDados]);

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Painel do Síndico</h2>
              <p className="header-date">{currentUser?.condominio_nome || 'Condomínio'}</p>
            </div>
          </div>
          <div className="header-right">
            <NotificationMenu />
            <div onClick={() => navigate('/perfil')} style={{ display:'flex', alignItems:'center', gap:'0.75rem', borderLeft:'1px solid #e2e8f0', paddingLeft:'1rem', cursor:'pointer' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--role-primary-color)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                {currentUser?.name?.charAt(0) || 'S'}
              </div>
            </div>
          </div>
        </header>

        <ContextBanner />

        <div className="dashboard-content-scroll">
          <div className="dashboard-content-inner" style={{ maxWidth:1400, margin:'0 auto' }}>

            <div style={{ marginBottom:'1.25rem' }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:'0 0 2px' }}>Ocorrências do Condomínio</h3>
              <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>Distribuição automática por setor · Monitoramento em tempo real</p>
            </div>

            {/* KPIs */}
            <div className="ps-kpis-grid" style={{ marginBottom:'1.25rem' }}>
              {[
                { label:'ABERTAS',     value:kpis.abertas.value,    trend:kpis.abertas.trendValue,    trendType:kpis.abertas.trend,    borderColor:'#ef4444', iconBg:'#fef2f2', iconColor:'#ef4444', Icon:AlertCircle  },
                { label:'EM ANDAMENTO',value:kpis.analise.value,    trend:kpis.analise.trendValue,    trendType:kpis.analise.trend,    borderColor:'#f59e0b', iconBg:'#fffbeb', iconColor:'#f59e0b', Icon:Clock        },
                { label:'RESOLVIDAS',  value:kpis.resolvidas.value, trend:kpis.resolvidas.trendValue, trendType:kpis.resolvidas.trend, borderColor:'#10b981', iconBg:'#f0fdf4', iconColor:'#10b981', Icon:CheckCircle2 },
                { label:'TOTAL (MÊS)', value:kpis.total.value,      trend:'—',                        trendType:'neutral',             borderColor:'#ea580c', iconBg:'#fff7ed', iconColor:'#ea580c', Icon:BarChart3    },
              ].map((k, i) => {
                const trendColor = k.trendType === 'up' ? (k.label === 'ABERTAS' ? '#dc2626' : '#16a34a') : k.trendType === 'down' ? '#16a34a' : '#94a3b8';
                return (
                  <div key={i} style={{ background:'#fff', borderRadius:10, padding:'18px 20px', border:'1px solid #e2e8f0', borderLeft:`4px solid ${k.borderColor}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:'#94a3b8', letterSpacing:'0.07em', margin:0 }}>{k.label}</p>
                      <div style={{ width:28, height:28, borderRadius:7, background:k.iconBg, color:k.iconColor, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <k.Icon size={14} />
                      </div>
                    </div>
                    <p style={{ fontSize:32, fontWeight:700, color:'#0f172a', margin:'0 0 6px', lineHeight:1 }}>{k.value}</p>
                    <p style={{ fontSize:12, color:trendColor, margin:0, fontWeight:500 }}>
                      {k.trendType === 'up' ? '↑ ' : k.trendType === 'down' ? '↓ ' : ''}{k.trend}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="ps-main-grid">
              {/* LEFT COLUMN */}
              <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

                <div className="ps-charts-row">
                  <div className="ps-card">
                    <h3 className="ps-section-title">Evolução de Ocorrências</h3>
                    <p className="ps-section-subtitle">Comparativo de aberturas e resoluções</p>
                    <div className="ps-chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dataTimeline} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} dy={10} />
                          <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} dx={-10} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="abertas"    stroke="#ef4444" strokeWidth={2} fillOpacity={0.05} fill="#ef4444" activeDot={{ r:4, strokeWidth:0 }} />
                          <Area type="monotone" dataKey="resolvidas" stroke="#10b981" strokeWidth={2} fillOpacity={0.05} fill="#10b981" activeDot={{ r:4, strokeWidth:0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="ps-card">
                    <h3 className="ps-section-title">Por Categoria</h3>
                    <p className="ps-section-subtitle">Volume absoluto por tipo</p>
                    <div className="ps-chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataCategory} layout="vertical" margin={{ top:10, right:10, left:10, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'#475569' }} tickLine={false} axisLine={false} width={80} />
                          <RechartsTooltip cursor={{ fill:'#f8fafc' }} content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[0,4,4,0]} barSize={16}>
                            {dataCategory.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Heatmap */}
                <div className="ps-card">
                  <h3 className="ps-section-title">Mapa de Calor Semanal</h3>
                  <p className="ps-section-subtitle">Horários de pico na abertura de ocorrências</p>
                  <div className="heatmap-container">
                    <div className="heatmap-header">{heatmapTimes.map(t => <div key={t} className="heatmap-time-label">{t}</div>)}</div>
                    {heatmapDays.map((day, dIdx) => (
                      <div key={day} className="heatmap-row">
                        <div className="heatmap-day-label">{day}</div>
                        {heatmapData[dIdx].map((val, tIdx) => (
                          <div key={tIdx} className={`heatmap-cell hm-lvl-${val}`} title={`${val} ocorrências`} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabela com abas */}
                <TabelaComAbas
                  ocorrencias={occurrencesList.filter(o => !o.isReclamacao)}
                  reclamacoes={occurrencesList.filter(o => o.isReclamacao)}
                  onGerenciar={setGerenciando}
                  onAbrirReclamacao={setReclamacaoAberta}
                  respondidas={respondidas}
                />

              </div>{/* /left */}

              {/* RIGHT COLUMN */}
              <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

                <div className="ps-card">
                  <h3 className="ps-section-title">Distribuição de Status</h3>
                  <div className="ps-chart-donut-container" style={{ height:200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusChart} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} cornerRadius={4} dataKey="value" stroke="none">
                          {statusChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center-text" />
                  </div>
                  <div className="ps-legend-vertical">
                    {statusChart.map(s => (
                      <div key={s.name} className="legend-item-v">
                        <div className="legend-item-v-left"><div className="legend-dot" style={{ backgroundColor:s.fill }} />{s.name}</div>
                        <div className="legend-item-v-val">{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ps-card">
                  <h3 className="ps-section-title">SLA em Risco</h3>
                  <p className="ps-section-subtitle" style={{ marginBottom:'1rem' }}>Prazos de atendimento curtos</p>
                  <div className="widget-list">
                    {slaEmRisco.map(sla => (
                      <div key={sla.id} className="widget-item">
                        <div className="widget-item-left">
                          <div className="w-icon-box"><AlertCircle size={16} color={sla.priority === 'danger' ? '#ef4444' : '#f59e0b'} /></div>
                          <div className="w-texts">
                            <span className="w-title">{sla.title}</span>
                            <span className="w-subtitle">{SETOR_LABEL[CATEGORIA_SETOR[sla.category] ?? 'manutencao']} · Prazo estourando</span>
                          </div>
                        </div>
                        <div className={`w-badge-${sla.priority}`}>{sla.timeRemaining}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ps-card">
                  <h3 className="ps-section-title">Carga da Equipe</h3>
                  <p className="ps-section-subtitle" style={{ marginBottom:'1rem' }}>Tarefas em aberto por funcionário</p>
                  <div className="widget-list">
                    {funcionarios.length > 0
                      ? [...funcionarios].sort((a, b) => b.abertas - a.abertas).map(emp => (
                          <div key={emp.id} className="widget-item">
                            <div className="widget-item-left">
                              <div className="w-icon-box" style={{ background:'#f1f5f9', color:'#475569', fontSize:'0.7rem', fontWeight:700 }}>{emp.nome?.charAt(0) || 'F'}</div>
                              <div className="w-texts">
                                <span className="w-title">{emp.nome}</span>
                                <span className="w-subtitle">
                                  {emp.especialidades.length > 0
                                    ? emp.especialidades.map(c => CATEGORIA_LABEL[c] || c).join(' · ')
                                    : 'Sem especialidade'}
                                </span>
                              </div>
                            </div>
                            <div className="w-right-val">{emp.abertas}</div>
                          </div>
                        ))
                      : <p style={{ color:'#94a3b8', fontSize:'0.85rem', margin:0 }}>Nenhum funcionário ativo cadastrado.</p>
                    }
                  </div>
                </div>

              </div>{/* /right */}
            </div>
          </div>
        </div>
      </main>

      {/* Gestão da ocorrência (análise, atribuição, andamento, conclusão) */}
      {gerenciando && (
        <GerenciarOcorrencia
          ocorrenciaId={gerenciando}
          onFechar={() => setGerenciando(null)}
          onAtualizada={fetchDados}
        />
      )}

      {/* Drawer de reclamação */}
      {reclamacaoAberta && (
        <DrawerReclamacao
          reclamacao={reclamacaoAberta}
          onFechar={() => setReclamacaoAberta(null)}
          currentUser={currentUser}
          onRespondida={(id) => setRespondidas(prev => new Set([...prev, id]))}
        />
      )}
    </div>
  );
};

export default PainelSindico;