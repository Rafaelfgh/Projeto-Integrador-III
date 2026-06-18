import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Menu,
  X,
  Search,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  Play,
  Camera,
  AlertCircle,
  Building2,
  User,
  ShieldCheck,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';

import './Dashboard.css';
import './MinhasSolicitacoes.css';

// ======================================================
// METADADOS
// ======================================================

const CATEGORIA_META = {
  limpeza:       { label: 'Limpeza',        icon: '🧹', class: 'ms-icon-green'  },
  manutencao:    { label: 'Manutenção',      icon: '🔧', class: 'ms-icon-orange' },
  seguranca:     { label: 'Segurança',       icon: '🛡️', class: 'ms-icon-red'    },
  portaria:      { label: 'Portaria',        icon: '🏠', class: 'ms-icon-green'  },
  hidraulica:    { label: 'Hidráulica',      icon: '💧', class: 'ms-icon-blue'   },
  eletrica:      { label: 'Elétrica',        icon: '⚡', class: 'ms-icon-yellow' },
  infraestrutura:{ label: 'Infraestrutura',  icon: '🏗️', class: 'ms-icon-purple' },
  jardinagem:    { label: 'Jardinagem',      icon: '🌿', class: 'ms-icon-green'  },
  barulho:       { label: 'Barulho',         icon: '🔊', class: 'ms-icon-purple' },
  garagem:       { label: 'Garagem',         icon: '🅿️', class: 'ms-icon-blue'   },
  areas_comuns:  { label: 'Áreas Comuns',    icon: '🏢', class: 'ms-icon-purple' },
  estrutural:    { label: 'Estrutural',      icon: '🏗️', class: 'ms-icon-purple' },
};

const CATEGORIA_FALLBACK = { label: 'Outros', icon: '📋', class: 'ms-icon-blue' };

const STATUS_META = {
  'Aberta':       { label: 'Aberta',       class: 'ms-status-red'    },
  'Em Análise':   { label: 'Em Análise',   class: 'ms-status-yellow' },
  'Em Andamento': { label: 'Em Andamento', class: 'ms-status-yellow' },
  'Resolvida':    { label: 'Resolvida',    class: 'ms-status-green'  },
};

const STATUS_FALLBACK = { label: 'Aberta', class: 'ms-status-red' };

const getStatusMeta    = (s) => STATUS_META[s]    || STATUS_FALLBACK;
const getCategoriaMeta = (c) => CATEGORIA_META[c] || CATEGORIA_FALLBACK;

const FILTROS = [
  { key: 'todas',       label: 'Todos'       },
  { key: 'Aberta',      label: 'Abertas'     },
  { key: 'Em Análise',  label: 'Em análise'  },
  { key: 'Resolvida',   label: 'Resolvidas'  },
];

// ======================================================
// CARD
// ======================================================

const OcorrenciaCard = ({ ocorrencia, onAbrir }) => {
  const categoria = getCategoriaMeta(ocorrencia.categoria);
  const status    = getStatusMeta(ocorrencia.status);
  const protocolo = `TRF-${String(ocorrencia.id).padStart(3, '0')}`;

  return (
    <div className="ms-premium-card">
      <div className="ms-card-header">
        <span className={`ms-status ${status.class}`}>{status.label}</span>
        <div className={`ms-card-icon-wrap ${categoria.class}`}>
          <span style={{ fontSize: 18 }}>{categoria.icon}</span>
        </div>
      </div>

      <div className="ms-card-body">
        <span className="ms-protocol-tag">{protocolo}</span>
        <h4 className="ms-card-title">{ocorrencia.titulo}</h4>
      </div>

      <div className="ms-card-divider"></div>

      <div className="ms-card-footer">
        <div className="ms-card-date">
          <CalendarDays size={14} />
          {new Date(ocorrencia.created_at).toLocaleDateString('pt-BR')}
        </div>
        <button className="ms-card-action" onClick={() => onAbrir(ocorrencia)}>
          Acompanhar <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ======================================================
// DRAWER
// ======================================================

const OcorrenciaDrawer = ({ ocorrencia, onFechar, onAtualizar, currentUser }) => {
  const fileRef = useRef();
  const [observacao,  setObservacao]  = useState('');
  const [evidencias,  setEvidencias]  = useState([]);  // sempre começa vazio — foto nova é obrigatória

  const categoria    = getCategoriaMeta(ocorrencia.categoria);
  const podeFinalizar = evidencias.length > 0;

  const adicionarArquivos = (files) => {
    const novos = Array.from(files).map(file => ({
      id:   Date.now() + Math.random(),
      nome: file.name,
      url:  URL.createObjectURL(file),
    }));
    setEvidencias(prev => [...prev, ...novos]);
  };

  const iniciar = () => {
    onAtualizar(ocorrencia.id, { status: 'Em Andamento' });
    onFechar();
  };

  // ── Finalizar: persiste Resolvida + notifica síndico + notifica morador ──
  const finalizar = async () => {
    if (!podeFinalizar) return;

    // 1. Atualiza status no banco
    onAtualizar(ocorrencia.id, { status: 'Resolvida', evidencias, observacao_finalizacao: observacao });

    const condominio_id   = currentUser.condominio_id;
    const funcionarioNome = currentUser?.name || 'Funcionário';

    // 2. Busca o síndico ativo do condomínio em Gestao_Sindicos
    const { data: gestao } = await supabase
      .from('Gestao_Sindicos')
      .select('morador_id')
      .eq('condominio_id', condominio_id)
      .eq('ativo', true)
      .single();

    const sindicoId = gestao?.morador_id || null;

    // 3. Monta as notificações que serão enviadas
    const notificacoes = [];

    // Notificação para o síndico
    if (sindicoId) {
      notificacoes.push({
        destinatario_id: sindicoId,
        condominio_id,
        tipo:            'TAREFA_FINALIZADA',
        titulo:          'Tarefa finalizada',
        descricao:       `${funcionarioNome} finalizou: "${ocorrencia.titulo}"`,
        lida:            false,
        referencia_tipo: 'ocorrencia',
        referencia_id:   String(ocorrencia.id),
        remetente_nome:  funcionarioNome,
      });
    }

    // Notificação para o morador que abriu a ocorrência
    if (ocorrencia.morador_id) {
      notificacoes.push({
        destinatario_id: ocorrencia.morador_id,
        condominio_id,
        tipo:            'OCORRENCIA_RESOLVIDA',
        titulo:          'Sua ocorrência foi resolvida! ✅',
        descricao:       `"${ocorrencia.titulo}" foi finalizada pela equipe de manutenção.`,
        lida:            false,
        referencia_tipo: 'ocorrencia',
        referencia_id:   String(ocorrencia.id),
        remetente_nome:  funcionarioNome,
      });
    }

    // 4. Insere todas as notificações de uma vez
    if (notificacoes.length > 0) {
      const { error } = await supabase.from('notificacoes').insert(notificacoes);
      if (error) console.error('Erro ao enviar notificações:', error);
    }

    onFechar();
  };

  return (
    <>
      <div
        onClick={onFechar}
        style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)', zIndex:200 }}
      />

      <div style={{
        position:'fixed', top:0, right:0, width:520, height:'100%',
        background:'#fff', zIndex:201, overflowY:'auto', borderLeft:'1px solid #e2e8f0',
      }}>
        {/* HEADER */}
        <div style={{ padding:24, borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ display:'flex', gap:14 }}>
              <div className={`ms-card-icon-wrap ${categoria.class}`}>
                <span style={{ fontSize:18 }}>{categoria.icon}</span>
              </div>
              <div>
                <h2 style={{ margin:0, fontSize:20, color:'#0f172a' }}>{ocorrencia.titulo}</h2>
                <p style={{ marginTop:6, color:'#64748b', fontSize:13 }}>{categoria.label}</p>
              </div>
            </div>
            <button onClick={onFechar} style={{ width:36, height:36, borderRadius:12, border:'none', cursor:'pointer', background:'#f8fafc' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding:24 }}>
          {/* SOLICITANTE */}
          <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:16, padding:16, marginBottom:20 }}>
            <h4 style={{ fontSize:12, color:'#94a3b8', marginBottom:12 }}>SOLICITANTE</h4>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:46, height:46, borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <User size={20} color="#2563eb" />
              </div>
              <div>
                <h3 style={{ margin:0, fontSize:15, color:'#0f172a' }}>{ocorrencia.morador_nome}</h3>
                <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:13 }}>Morador solicitante</p>
              </div>
            </div>
          </div>

          {/* LOCAL + STATUS */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b', marginBottom:8 }}>
                <Building2 size={16} />
                <span style={{ fontSize:13 }}>Local</span>
              </div>
              <strong style={{ color:'#0f172a' }}>{ocorrencia.bloco || '—'}</strong>
              <p style={{ marginTop:4, color:'#64748b', fontSize:13 }}>{ocorrencia.apartamento || ''}</p>
            </div>

            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b', marginBottom:8 }}>
                <ShieldCheck size={16} />
                <span style={{ fontSize:13 }}>Status</span>
              </div>
              <span className={`ms-status ${getStatusMeta(ocorrencia.status).class}`}>
                {getStatusMeta(ocorrencia.status).label}
              </span>
            </div>
          </div>

          {/* DESCRIÇÃO */}
          <h4 style={{ fontSize:12, color:'#94a3b8', marginBottom:10 }}>DESCRIÇÃO</h4>
          <div style={{ background:'#f8fafc', padding:18, borderRadius:14, color:'#334155', lineHeight:1.7, fontSize:14 }}>
            {ocorrencia.descricao}
          </div>

          {/* EVIDÊNCIAS */}
          <h4 style={{ fontSize:12, color:'#94a3b8', marginTop:24, marginBottom:10 }}>EVIDÊNCIAS</h4>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border:'1.5px dashed #cbd5e1', borderRadius:16, padding:28, textAlign:'center', cursor:'pointer', background:'#fafafa' }}
          >
            <Camera size={24} color="#94a3b8" />
            <p style={{ marginTop:10, marginBottom:4, color:'#334155', fontWeight:600 }}>Clique para adicionar fotos</p>
            <span style={{ fontSize:12, color:'#94a3b8' }}>JPG ou PNG</span>
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*" style={{ display:'none' }} onChange={(e) => adicionarArquivos(e.target.files)} />

          {/* MINIATURAS DAS FOTOS ADICIONADAS */}
          {evidencias.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginTop:'0.75rem' }}>
              {evidencias.map((ev) => (
                <div key={ev.id} style={{ position:'relative' }}>
                  <img
                    src={ev.url}
                    alt={ev.nome}
                    style={{ width:80, height:80, objectFit:'cover', borderRadius:10, border:'1.5px solid #e2e8f0', display:'block' }}
                  />
                  <button
                    onClick={() => setEvidencias(prev => prev.filter(e => e.id !== ev.id))}
                    style={{
                      position:'absolute', top:-6, right:-6,
                      width:20, height:20, borderRadius:'50%',
                      background:'#ef4444', color:'white', border:'none',
                      cursor:'pointer', fontSize:12, fontWeight:700,
                      display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1,
                    }}
                    title="Remover foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* OBSERVAÇÃO */}
          <h4 style={{ fontSize:12, color:'#94a3b8', marginTop:24, marginBottom:10 }}>OBSERVAÇÃO</h4>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Descreva o que foi realizado..."
            style={{ width:'100%', minHeight:110, borderRadius:16, border:'1px solid #e2e8f0', padding:16, resize:'none', fontFamily:'inherit', outline:'none' }}
          />

          {/* AÇÕES */}
          <div style={{ display:'flex', gap:10, marginTop:24 }}>
            {ocorrencia.status === 'Aberta' && (
              <button onClick={iniciar} style={{ height:46, border:'none', borderRadius:14, padding:'0 18px', background:'#16a34a', color:'#fff', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                <Play size={16} /> Iniciar Atendimento
              </button>
            )}

            {(ocorrencia.status === 'Em Andamento' || ocorrencia.status === 'Em Análise') && (
              <button
                onClick={finalizar}
                disabled={!podeFinalizar}
                style={{ height:46, border:'none', borderRadius:14, padding:'0 18px', background: podeFinalizar ? '#16a34a' : '#94a3b8', color:'#fff', fontWeight:600, cursor: podeFinalizar ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:8 }}
              >
                <CheckCircle2 size={16} /> Finalizar
              </button>
            )}
          </div>

          {!podeFinalizar && (ocorrencia.status === 'Em Andamento' || ocorrencia.status === 'Em Análise') && (
            <p style={{ display:'flex', alignItems:'center', gap:6, color:'#d97706', fontSize:12, marginTop:12 }}>
              <AlertCircle size={14} /> Adicione pelo menos uma foto
            </p>
          )}
        </div>
      </div>
    </>
  );
};

// ======================================================
// PAGE
// ======================================================

const PainelFuncionario = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [busca,        setBusca]        = useState('');
  const [filtro,       setFiltro]       = useState('todas');
  const [ocorrencias,  setOcorrencias]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selecionada,  setSelecionada]  = useState(null);

  // ======================================================
  // BUSCA REAL — só as ocorrências atribuídas a este funcionário
  // ======================================================

  useEffect(() => {
    async function buscarTarefas() {
      if (!currentUser?.id) return;
      setLoading(true);

      const { data: occData, error: erroOcc } = await supabase
        .from('Ocorrencias')
        .select('id, titulo, descricao, categoria, status, created_at, updated_at, anexos, morador_id')
        .eq('atribuido_a', currentUser.id)
        .order('created_at', { ascending: false });

      if (erroOcc) console.error('Erro ao buscar tarefas atribuídas:', erroOcc);

      // Busca nome, bloco e apartamento dos moradores (batch, sem N+1)
      const idsMoradores = [...new Set((occData || []).map(o => o.morador_id).filter(Boolean))];
      let infoMoradores  = {};
      if (idsMoradores.length > 0) {
        const { data: moradores, error: erroMoradores } = await supabase
          .from('Moradores')
          .select('id, nome, bloco, apartamento')
          .in('id', idsMoradores);
        if (erroMoradores) console.error('Erro ao buscar moradores:', erroMoradores);
        infoMoradores = Object.fromEntries((moradores || []).map(m => [m.id, m]));
      }

      const lista = (occData || []).map(o => {
        const morador = infoMoradores[o.morador_id];
        return {
          id:           o.id,
          titulo:       o.titulo,
          descricao:    o.descricao,
          categoria:    o.categoria,
          status:       o.status || 'Aberta',
          created_at:   o.created_at,
          anexos:       Array.isArray(o.anexos) ? o.anexos : [],
          morador_id:   o.morador_id,   // necessário para notificar o morador ao finalizar
          morador_nome: morador?.nome        || 'Morador',
          bloco:        morador?.bloco       || '',
          apartamento:  morador?.apartamento || '',
          evidencias:   [],
        };
      });

      setOcorrencias(lista);
      setLoading(false);
    }
    buscarTarefas();
  }, [currentUser?.id]);

  // ======================================================
  // FILTRO LOCAL
  // ======================================================

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias
      .filter(o => filtro === 'todas' ? true : o.status === filtro)
      .filter(o => o.titulo.toLowerCase().includes(busca.toLowerCase()));
  }, [ocorrencias, filtro, busca]);

  // ======================================================
  // UPDATE — atualiza local + persiste status no banco
  // ======================================================

  const atualizar = async (id, changes) => {
    setOcorrencias(prev =>
      prev.map(o => o.id === id ? { ...o, ...changes } : o)
    );

    if (changes.status) {
      const { error } = await supabase
        .from('Ocorrencias')
        .update({ status: changes.status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) console.error('Erro ao atualizar status:', error);
    }
  };

  return (
    <div className="dashboard-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom:'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Minhas Tarefas</h2>
              <p className="header-date">Tarefas atribuídas a você</p>
            </div>
          </div>

          <div className="header-right">
            <NotificationMenu />
            <div
              onClick={() => navigate('/perfil')}
              style={{ display:'flex', alignItems:'center', gap:'0.75rem', borderLeft:'1px solid #e2e8f0', paddingLeft:'1rem', cursor:'pointer' }}
            >
              <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--role-primary-color)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                {currentUser?.name?.charAt(0) || 'F'}
              </div>
            </div>
          </div>
        </header>

        <ContextBanner />

        <div className="dashboard-content-scroll" style={{ backgroundColor:'#f8fafc' }}>
          <div className="ms-container">

            {/* SEARCH */}
            <div className="ms-header-actions">
              <div className="ms-search-wrapper">
                <Search size={18} className="ms-search-icon" />
                <input
                  type="text"
                  className="ms-search-input"
                  placeholder="Pesquisar tarefa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>

            {/* FILTROS */}
            <div className="ms-filters">
              {FILTROS.map(item => (
                <button
                  key={item.key}
                  className={`ms-filter-pill ${filtro === item.key ? 'active' : ''}`}
                  onClick={() => setFiltro(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* GRID */}
            {loading ? (
              <div className="ms-empty">
                <p style={{ color:'#94a3b8' }}>Carregando suas tarefas...</p>
              </div>
            ) : ocorrenciasFiltradas.length > 0 ? (
              <div className="ms-cards-grid">
                {ocorrenciasFiltradas.map(ocorrencia => (
                  <OcorrenciaCard
                    key={ocorrencia.id}
                    ocorrencia={ocorrencia}
                    onAbrir={setSelecionada}
                  />
                ))}
              </div>
            ) : (
              <div className="ms-empty">
                <CheckCircle2 size={48} className="ms-empty-icon" />
                <h4 className="ms-empty-title">Nenhuma tarefa encontrada</h4>
                <p className="ms-empty-desc">Você não tem tarefas atribuídas no momento ✨</p>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* DRAWER */}
      {selecionada && (
        <OcorrenciaDrawer
          ocorrencia={selecionada}
          onFechar={() => setSelecionada(null)}
          onAtualizar={atualizar}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default PainelFuncionario;