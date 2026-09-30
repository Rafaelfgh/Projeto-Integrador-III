import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
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
  KeyRound,
  Home,
  Megaphone,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import AtualizacaoOcorrencia from '../components/AtualizacaoOcorrencia';
import ConversaOcorrencia from '../components/ConversaOcorrencia';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import { useVisualizadorImagem } from '../contexts/visualizadorImagem';
import { protocoloOcorrencia } from '../utils/protocolo';
import { contemPalavrao, garantirSemPalavrao, MSG_PALAVRAO } from '../utils/palavroes';
import {
  OCORRENCIA_CAMPOS, MIN_DESCRICAO, carregarNomes, assinarEvidencias, enviarEvidencias, mudarStatus,
} from '../services/ocorrenciaService';

import './Dashboard.css';
import './MinhasSolicitacoes.css';

// ======================================================
// METADADOS
// ======================================================

const CATEGORIA_META = {
  limpeza:       { label: 'Limpeza',        icon: '🧹', class: 'ms-icon-green'  },
  manutencao:    { label: 'Manutenção',      icon: '🔧', class: 'ms-icon-orange' },
  seguranca:     { label: 'Segurança',       icon: '🛡️', class: 'ms-icon-red'    },
  hidraulica:    { label: 'Hidráulica',      icon: '💧', class: 'ms-icon-blue'   },
  eletrica:      { label: 'Elétrica',        icon: '⚡', class: 'ms-icon-yellow' },
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
  'Resolvida':    { label: 'Concluída',    class: 'ms-status-green'  },
};

const STATUS_FALLBACK = { label: 'Aberta', class: 'ms-status-red' };

const getStatusMeta    = (s) => STATUS_META[s]    || STATUS_FALLBACK;
const getCategoriaMeta = (c) => CATEGORIA_META[c] || CATEGORIA_FALLBACK;

// Filtros da aba "Em aberto" (as concluídas ficam na aba própria)
const FILTROS = [
  { key: 'todas',        label: 'Todas'        },
  { key: 'Aberta',       label: 'Abertas'      },
  { key: 'Em Análise',   label: 'Em análise'   },
  { key: 'Em Andamento', label: 'Em andamento' },
];

const chip = (cor, fundo, borda) => ({
  fontSize: 11, fontWeight: 700, color: cor, background: fundo, border: `1px solid ${borda}`, borderRadius: 999, padding: '2px 8px',
});

// ======================================================
// CARD
// ======================================================

const OcorrenciaCard = ({ ocorrencia, onAbrir }) => {
  const categoria = getCategoriaMeta(ocorrencia.categoria);
  const status    = getStatusMeta(ocorrencia.status);
  const protocolo = protocoloOcorrencia(ocorrencia.id, ocorrencia.created_at);

  return (
    <div className="ms-premium-card">
      <div className="ms-card-header">
        <span className={`ms-status ${status.class}`}>{status.label}</span>
        <div className={`ms-card-icon-wrap ${categoria.class}`}>
          <span style={{ fontSize: 18 }}>{categoria.icon}</span>
        </div>
      </div>

      <div className="ms-card-body">
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
          <span className="ms-protocol-tag">{protocolo}</span>
          {ocorrencia.origem === 'atribuida'
            ? <span style={chip('#c2410c', '#fff7ed', '#fed7aa')}>Atribuída pelo síndico</span>
            : ocorrencia.status !== 'Resolvida' && <span style={chip('#1d4ed8', '#eff6ff', '#bfdbfe')}>Sua especialidade · disponível</span>}
          {ocorrencia.privacidade === 'pessoal' && (
            <span style={chip('#6d28d9', '#f5f3ff', '#ddd6fe')}>Pessoal · {ocorrencia.unidade}</span>
          )}
        </div>
        <h4 className="ms-card-title">{ocorrencia.titulo}</h4>
      </div>

      <div className="ms-card-divider"></div>

      <div className="ms-card-footer">
        <div className="ms-card-date">
          <CalendarDays size={14} />
          {ocorrencia.status === 'Resolvida' && ocorrencia.concluida_em
            ? `Concluída em ${new Date(ocorrencia.concluida_em).toLocaleDateString('pt-BR')}`
            : new Date(ocorrencia.created_at).toLocaleDateString('pt-BR')}
        </div>
        <button className="ms-card-action" onClick={() => onAbrir(ocorrencia)}>
          Gerenciar <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ======================================================
// DRAWER
// ======================================================

const rotuloSecao = { fontSize:12, color:'#94a3b8', marginTop:24, marginBottom:10 };
const botao = (ativo, cor) => ({
  height:46, border:'none', borderRadius:14, padding:'0 18px', background: ativo ? cor : '#94a3b8', color:'#fff',
  fontWeight:600, cursor: ativo ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:8,
});

const OcorrenciaDrawer = ({ ocorrencia, onFechar, onAtualizada, currentUser, nomes, fotos }) => {
  const abrirImagem = useVisualizadorImagem();
  const fileRef = useRef();
  const [descricao,  setDescricao]  = useState('');
  const [evidencias, setEvidencias] = useState([]);
  const [enviando,   setEnviando]   = useState(false);
  const [erro,       setErro]       = useState(null);
  const [convocar,   setConvocar]   = useState(false);
  const [mensagem,   setMensagem]   = useState('');

  const categoria     = getCategoriaMeta(ocorrencia.categoria);
  const atribuidaAMim = ocorrencia.atribuido_a === currentUser.id;
  const livre         = !ocorrencia.atribuido_a;
  const concluida     = ocorrencia.status === 'Resolvida';
  const emAnalise     = ocorrencia.status === 'Em Análise';

  // Regras (o banco também valida):
  //  - atribuída a mim: só concluir;
  //  - livre: colocar em andamento (se Aberta) e/ou concluir.
  const podeAndamento = livre && ocorrencia.status === 'Aberta';
  //  - em análise: só o síndico muda o status.
  const podeConcluir  = !concluida && !emAnalise && (atribuidaAMim || (livre && ['Aberta', 'Em Andamento'].includes(ocorrencia.status)));
  const descricaoOk   = descricao.trim().length >= MIN_DESCRICAO;

  const adicionarArquivos = (files) => {
    const novos = Array.from(files).map(file => ({
      id:   Date.now() + Math.random(),
      nome: file.name,
      url:  URL.createObjectURL(file),
      file,
    }));
    setEvidencias(prev => [...prev, ...novos]);
  };

  const executar = async (acao) => {
    setEnviando(true);
    setErro(null);
    try {
      await acao();
      onAtualizada();
      onFechar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const iniciar = () => executar(async () => {
    await garantirSemPalavrao(descricao);
    await mudarStatus(ocorrencia.id, 'Em Andamento', descricao.trim());
  });

  const concluir = () => executar(async () => {
    await garantirSemPalavrao(descricao);
    const caminhos = await enviarEvidencias(currentUser.condominio_id, ocorrencia.id, evidencias.map(e => e.file));
    await mudarStatus(ocorrencia.id, 'Resolvida', descricao.trim(), caminhos);
  });

  const chamarSindico = async () => {
    setErro(null);
    if (await contemPalavrao(mensagem)) {
      setErro(MSG_PALAVRAO);
      return;
    }
    setEnviando(true);
    const { error } = await supabase.rpc('convocar_sindico', {
      p_ocorrencia_id: ocorrencia.id,
      p_mensagem: mensagem.trim() || null,
    });
    setEnviando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    // A ocorrência foi para "Em análise": só o síndico decide o próximo passo
    onAtualizada();
    onFechar();
  };

  return (
    <>
      <div
        onClick={onFechar}
        style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)', zIndex:200 }}
      />

      <div style={{
        position:'fixed', top:0, right:0, width:'min(520px, 100vw)', height:'100%',
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
                <span className="ms-protocol-tag">{protocoloOcorrencia(ocorrencia.id, ocorrencia.created_at)}</span>
                <h2 style={{ margin:'6px 0 0', fontSize:20, color:'#0f172a' }}>{ocorrencia.titulo}</h2>
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
          {ocorrencia.privacidade === 'pessoal' && (
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f5f3ff', border:'1px solid #ddd6fe', borderRadius:14, padding:'12px 14px', marginBottom:20, color:'#5b21b6', fontSize:14 }}>
              <Home size={18} />
              <span><strong>Ocorrência pessoal</strong> — o serviço é dentro do apartamento: <strong>{ocorrencia.unidade}</strong>.</span>
            </div>
          )}

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
                <span style={{ fontSize:13 }}>Unidade do morador</span>
              </div>
              <strong style={{ color:'#0f172a' }}>{ocorrencia.unidade || '—'}</strong>
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

          {ocorrencia.anexos.length > 0 && (
            <>
              <h4 style={rotuloSecao}>FOTOS DO MORADOR</h4>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                {ocorrencia.anexos.map((url, idx) => (
                  <button key={idx} type="button" className="img-zoom" onClick={() => abrirImagem(ocorrencia.anexos, idx)}>
                    <img src={url} alt={`Anexo ${idx + 1}`} style={{ width:80, height:80, objectFit:'cover', borderRadius:10, border:'1.5px solid #e2e8f0', display:'block' }} />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ANDAMENTO / CONCLUSÃO JÁ REGISTRADOS */}
          {(ocorrencia.andamento_descricao || concluida) && (
            <div style={{ marginTop:24 }}>
              <AtualizacaoOcorrencia ocorrencia={ocorrencia} nomes={nomes} fotos={fotos} />
            </div>
          )}

          {ocorrencia.privacidade === 'pessoal' && <ConversaOcorrencia ocorrencia={ocorrencia} />}

          {emAnalise && (
            <p style={{ display:'flex', alignItems:'center', gap:6, color:'#0369a1', fontSize:13, marginTop:20 }}>
              <AlertCircle size={15} /> Em análise pelo síndico. Aguarde o encaminhamento.
            </p>
          )}

          {(podeAndamento || podeConcluir) && (
            <>
              <h4 style={rotuloSecao}>{podeAndamento ? 'DESCRIÇÃO (O QUE SERÁ OU FOI FEITO)' : 'DESCRIÇÃO DO QUE FOI FEITO'}</h4>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                maxLength={2000}
                placeholder={podeAndamento
                  ? 'Ex.: Vou trocar o reparo da torneira amanhã às 9h.'
                  : 'Ex.: Reparo trocado e vazamento testado.'}
                style={{ width:'100%', minHeight:110, borderRadius:16, border:'1px solid #e2e8f0', padding:16, resize:'none', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
              />

              {podeConcluir && (
                <>
                  <h4 style={rotuloSecao}>FOTOS DA CONCLUSÃO (OBRIGATÓRIO PARA CONCLUIR)</h4>
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{ border:'1.5px dashed #cbd5e1', borderRadius:16, padding:24, textAlign:'center', cursor:'pointer', background:'#fafafa' }}
                  >
                    <Camera size={24} color="#94a3b8" />
                    <p style={{ marginTop:10, marginBottom:4, color:'#334155', fontWeight:600 }}>Clique para adicionar fotos</p>
                    <span style={{ fontSize:12, color:'#94a3b8' }}>JPG ou PNG</span>
                  </div>
                  <input ref={fileRef} type="file" multiple accept="image/*" style={{ display:'none' }} onChange={(e) => adicionarArquivos(e.target.files)} />

                  {evidencias.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginTop:'0.75rem' }}>
                      {evidencias.map((ev) => (
                        <div key={ev.id} style={{ position:'relative' }}>
                          <img src={ev.url} alt={ev.nome} style={{ width:80, height:80, objectFit:'cover', borderRadius:10, border:'1.5px solid #e2e8f0', display:'block' }} />
                          <button
                            onClick={() => setEvidencias(prev => prev.filter(e => e.id !== ev.id))}
                            style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#ef4444', color:'white', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}
                            title="Remover foto"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div style={{ display:'flex', gap:10, marginTop:24, flexWrap:'wrap' }}>
                {podeAndamento && (
                  <button onClick={iniciar} disabled={enviando || !descricaoOk} style={botao(!enviando && descricaoOk, '#d97706')}>
                    <Play size={16} /> Colocar em andamento
                  </button>
                )}
                {podeConcluir && (
                  <button onClick={concluir} disabled={enviando || !descricaoOk || evidencias.length === 0} style={botao(!enviando && descricaoOk && evidencias.length > 0, '#16a34a')}>
                    <CheckCircle2 size={16} /> {enviando ? 'Enviando...' : 'Concluir'}
                  </button>
                )}
              </div>

              {!descricaoOk && (
                <p style={{ display:'flex', alignItems:'center', gap:6, color:'#d97706', fontSize:12, marginTop:12 }}>
                  <AlertCircle size={14} /> Descreva o que está sendo ou foi feito (mínimo de {MIN_DESCRICAO} caracteres).
                </p>
              )}
            </>
          )}

          {/* CHAMAR O SÍNDICO: a ocorrência vai para "Em análise" */}
          {(podeAndamento || podeConcluir) && (
            <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid #f1f5f9' }}>
              {convocar ? (
                <>
                  <p style={{ margin:'0 0 8px', fontSize:12, color:'#0369a1' }}>
                    A ocorrência vai para <strong>"Em análise"</strong> e só o síndico poderá mudar o status depois disso.
                  </p>
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    maxLength={500}
                    placeholder="Opcional: explique por que precisa da análise do síndico."
                    style={{ width:'100%', minHeight:70, borderRadius:12, border:'1px solid #e2e8f0', padding:12, resize:'none', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                  />
                  <div style={{ display:'flex', gap:8, marginTop:8 }}>
                    <button onClick={() => setConvocar(false)} style={{ height:38, border:'none', borderRadius:10, padding:'0 14px', background:'#f1f5f9', color:'#475569', fontWeight:600, cursor:'pointer' }}>Cancelar</button>
                    <button onClick={chamarSindico} disabled={enviando} style={{ height:38, border:'none', borderRadius:10, padding:'0 14px', background:'#0369a1', color:'#fff', fontWeight:600, cursor:'pointer' }}>Enviar ao síndico</button>
                  </div>
                </>
              ) : (
                <button onClick={() => setConvocar(true)} style={{ display:'flex', alignItems:'center', gap:8, height:40, border:'1px solid #bae6fd', borderRadius:12, padding:'0 14px', background:'#f0f9ff', color:'#0369a1', fontWeight:600, cursor:'pointer' }}>
                  <Megaphone size={16} /> Chamar síndico para análise
                </button>
              )}
            </div>
          )}

          {erro && (
            <p style={{ display:'flex', alignItems:'center', gap:6, color:'#dc2626', fontSize:13, marginTop:12 }}>
              <AlertCircle size={14} /> {erro}
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
  const [aba,          setAba]          = useState('tarefas');
  const [filtro,       setFiltro]       = useState('todas');
  const [ocorrencias,  setOcorrencias]  = useState([]);
  const [nomes,        setNomes]        = useState({});
  const [fotos,        setFotos]        = useState({});
  const [loading,      setLoading]      = useState(true);
  const [selecionada,  setSelecionada]  = useState(null);

  // Atribuídas a mim (inclusive pessoais) + do mural da minha especialidade sem responsável
  const buscarTarefas = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);

    const { data: esp } = await supabase
      .from('funcionario_especialidades')
      .select('categoria')
      .eq('funcionario_id', currentUser.id);
    const especialidades = (esp || []).map(e => e.categoria);

    let consulta = supabase
      .from('Ocorrencias')
      .select(OCORRENCIA_CAMPOS)
      .eq('condominio_id', currentUser.condominio_id)
      .order('created_at', { ascending: false });
    consulta = especialidades.length > 0
      ? consulta.or(`atribuido_a.eq.${currentUser.id},and(atribuido_a.is.null,privacidade.eq.mural,categoria.in.(${especialidades.join(',')}))`)
      : consulta.eq('atribuido_a', currentUser.id);

    const { data: occData, error: erroOcc } = await consulta;
    if (erroOcc) console.error('Erro ao buscar tarefas:', erroOcc);
    const lista = occData || [];

    // Nome, bloco e apartamento dos moradores (batch, sem N+1)
    const idsMoradores = [...new Set(lista.map(o => o.morador_id).filter(Boolean))];
    let infoMoradores  = {};
    if (idsMoradores.length > 0) {
      const { data: moradores, error: erroMoradores } = await supabase
        .from('Moradores')
        .select('id, nome, bloco, apartamento')
        .in('id', idsMoradores);
      if (erroMoradores) console.error('Erro ao buscar moradores:', erroMoradores);
      infoMoradores = Object.fromEntries((moradores || []).map(m => [m.id, m]));
    }

    const [mapaNomes, mapaFotos] = await Promise.all([
      carregarNomes(lista.flatMap(o => [o.andamento_por, o.concluida_por])),
      assinarEvidencias(lista.flatMap(o => o.conclusao_evidencias || [])),
    ]);

    const tarefas = lista.map(o => {
      const morador = infoMoradores[o.morador_id];
      return {
        ...o,
        status:       o.status || 'Aberta',
        anexos:       Array.isArray(o.anexos) ? o.anexos : [],
        morador_nome: morador?.nome || 'Morador',
        unidade:      morador ? `Bloco ${morador.bloco}, Apt ${morador.apartamento}` : '',
        origem:       o.atribuido_a === currentUser.id ? 'atribuida' : 'especialidade',
      };
    });

    // Atribuídas a mim primeiro
    tarefas.sort((a, b) => (a.origem === b.origem ? 0 : a.origem === 'atribuida' ? -1 : 1));

    setNomes(mapaNomes);
    setFotos(mapaFotos);
    setOcorrencias(tarefas);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { buscarTarefas(); }, [buscarTarefas]);

  // Em aberto = tudo que não foi concluído. Concluídas = as que eu concluí ou que eram minhas.
  const tarefas    = useMemo(() => ocorrencias.filter(o => o.status !== 'Resolvida'), [ocorrencias]);
  const concluidas = useMemo(
    () => ocorrencias
      .filter(o => o.status === 'Resolvida' && (o.concluida_por === currentUser?.id || o.atribuido_a === currentUser?.id))
      .sort((a, b) => new Date(b.concluida_em || 0) - new Date(a.concluida_em || 0)),
    [ocorrencias, currentUser?.id]
  );

  const ocorrenciasFiltradas = useMemo(() => {
    const base = aba === 'tarefas'
      ? tarefas.filter(o => filtro === 'todas' ? true : o.status === filtro)
      : concluidas;
    return base.filter(o => o.titulo.toLowerCase().includes(busca.toLowerCase()));
  }, [aba, tarefas, concluidas, filtro, busca]);

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
              <p className="header-date">Tarefas atribuídas a você e ocorrências da sua especialidade</p>
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

            {/* SENHA PROVISÓRIA */}
            {currentUser?.precisaTrocarSenha && (
              <div role="alert" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap', background:'#fffbeb', border:'1px solid #fde68a', borderLeft:'4px solid #f59e0b', borderRadius:14, padding:'14px 18px', marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <KeyRound size={20} color="#b45309" />
                  <div>
                    <strong style={{ display:'block', color:'#92400e', fontSize:14 }}>Você está usando uma senha provisória</strong>
                    <span style={{ color:'#a16207', fontSize:13 }}>Ela foi definida pelo Master. Troque agora para proteger sua conta.</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/primeiro-acesso')}
                  style={{ height:40, border:'none', borderRadius:10, padding:'0 16px', background:'#f59e0b', color:'#fff', fontWeight:600, cursor:'pointer' }}
                >
                  Trocar senha
                </button>
              </div>
            )}

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

            {/* ABAS */}
            <div className="ms-abas" role="tablist">
              <button role="tab" aria-selected={aba === 'tarefas'} className={aba === 'tarefas' ? 'ativa' : ''} onClick={() => setAba('tarefas')}>
                Em aberto <span>{tarefas.length}</span>
              </button>
              <button role="tab" aria-selected={aba === 'concluidas'} className={aba === 'concluidas' ? 'ativa' : ''} onClick={() => setAba('concluidas')}>
                Concluídas <span>{concluidas.length}</span>
              </button>
            </div>

            {/* FILTROS */}
            {aba === 'tarefas' && (
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
            )}

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
                <h4 className="ms-empty-title">{aba === 'tarefas' ? 'Nenhuma tarefa encontrada' : 'Nenhuma ocorrência concluída ainda'}</h4>
                <p className="ms-empty-desc">
                  {aba === 'tarefas'
                    ? 'Nenhuma tarefa atribuída ou ocorrência da sua especialidade no momento.'
                    : 'As ocorrências que você concluir aparecem aqui.'}
                </p>
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
          onAtualizada={buscarTarefas}
          currentUser={currentUser}
          nomes={nomes}
          fotos={fotos}
        />
      )}
    </div>
  );
};

export default PainelFuncionario;
