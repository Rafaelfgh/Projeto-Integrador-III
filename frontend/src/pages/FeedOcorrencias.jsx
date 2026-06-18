import React, { useState, useEffect } from 'react';
import {
  Menu, Search, BellOff, Clock, FileEdit, Send, Trash2, MessageCircle,
  RefreshCw, ChevronDown, ChevronUp, UserCog, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationMenu from '../components/NotificationMenu';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import './Dashboard.css';
import './FeedOcorrencias.css';

const STATUS_CONFIG = {
  'Aberta':       { class: 'f-status-red',    label: 'Aberta'       },
  'Em Análise':   { class: 'f-status-yellow', label: 'Em Análise'   },
  'Em Andamento': { class: 'f-status-yellow', label: 'Em Andamento' },
  'Resolvida':    { class: 'f-status-green',  label: 'Resolvida'    },
};

const CATEGORIA_LABEL = {
  'hidraulica':   '💧 Hidráulica',
  'manutencao':   '🔧 Manutenção',
  'limpeza':      '🧹 Limpeza',
  'jardinagem':   '🌿 Jardinagem',
  'seguranca':    '🛡️ Segurança',
  'areas_comuns': '🏢 Áreas Comuns',
  'estrutural':   '🏗️ Estrutural',
  'barulho':      '🔊 Barulho',
  'garagem':      '🅿️ Garagem',
};

const PALAVRAS_BLOQUEADAS = [
  'porra','caralho','merda','puta','foda','fodase','fdp',
  'arrombado','cacete','cuzao','cuzão','viado','corno','bosta',
];

const contemPalavraoBasico = (texto) => {
  const normalizado = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return PALAVRAS_BLOQUEADAS.some(p => normalizado.includes(p));
};

const getStatusCfg = (status) => STATUS_CONFIG[status] || { class: 'f-status-yellow', label: status || '—' };

const formatarData = (data) => {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const FeedOcorrencias = () => {
  const [ocorrencias,             setOcorrencias]             = useState([]);
  const [comentariosPorOcorrencia,setComentariosPorOcorrencia]= useState({});
  const [loading,                 setLoading]                 = useState(true);
  const [sidebarOpen,             setSidebarOpen]             = useState(false);
  const [searchTerm,              setSearchTerm]              = useState('');
  const [statusFilter,            setStatusFilter]            = useState('Todos');
  const [expandido,               setExpandido]               = useState({});
  const [novoComentario,          setNovoComentario]          = useState({});
  const [erroComentario,          setErroComentario]          = useState({});
  const navigate  = useNavigate();
  const { currentUser } = useAuth();

  const isSindico = currentUser?.role === 'sindico' || currentUser?.tipo === 'sindico';

  useEffect(() => {
    async function fetchTudo() {
      if (!currentUser?.condominio_id) return;
      setLoading(true);

      const { data: occData, error: erroOcc } = await supabase
        .from('Ocorrencias')
        .select('id, titulo, descricao, categoria, status, created_at, updated_at, anexos, atribuido_a, morador_id')
        .eq('condominio_id', currentUser.condominio_id)
        .order('created_at', { ascending: false });
      if (erroOcc) console.error('Erro ao buscar ocorrências:', erroOcc);

      const idsMoradores = [...new Set((occData || []).map(o => o.morador_id).filter(Boolean))];
      let nomesMoradores = {};
      if (idsMoradores.length > 0) {
        const { data: moradores, error: erroMoradores } = await supabase
          .from('Moradores').select('id, nome').in('id', idsMoradores);
        if (erroMoradores) console.error('Erro ao buscar moradores:', erroMoradores);
        nomesMoradores = Object.fromEntries((moradores || []).map(m => [m.id, m.nome]));
      }

      const idsAtribuidos = [...new Set((occData || []).map(o => o.atribuido_a).filter(Boolean))];
      let nomesFuncionarios = {};
      if (idsAtribuidos.length > 0) {
        const { data: funcionarios, error: erroFunc } = await supabase
          .from('Funcionarios').select('id, nome').in('id', idsAtribuidos);
        if (erroFunc) console.error('Erro ao buscar funcionários:', erroFunc);
        nomesFuncionarios = Object.fromEntries((funcionarios || []).map(f => [f.id, f.nome]));
      }

      const lista = (occData || []).map(o => ({
        id:              o.id,
        titulo:          o.titulo,
        descricao:       o.descricao,
        categoriaChave:  o.categoria,
        categoria:       CATEGORIA_LABEL[o.categoria] || o.categoria || 'Outros',
        status:          o.status || 'Aberta',
        data:            o.updated_at || o.created_at,
        anexos:          Array.isArray(o.anexos) ? o.anexos : [],
        moradorNome:     nomesMoradores[o.morador_id]     || 'Morador',
        funcionarioNome: o.atribuido_a ? (nomesFuncionarios[o.atribuido_a] || null) : null,
      }));

      setOcorrencias(lista);
      setLoading(false);
    }
    fetchTudo();
  }, [currentUser?.condominio_id]);

  const toggleExpandido = (id) => setExpandido(prev => ({ ...prev, [id]: !prev[id] }));

  const enviarComentario = (ocorrenciaId) => {
    const texto = (novoComentario[ocorrenciaId] || '').trim();
    if (!texto) return;
    if (contemPalavraoBasico(texto)) {
      setErroComentario(prev => ({ ...prev, [ocorrenciaId]: 'Comentário contém linguagem inadequada.' }));
      return;
    }
    setErroComentario(prev => ({ ...prev, [ocorrenciaId]: null }));
    const novoItem = {
      id:        `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      texto,
      data:      new Date().toISOString(),
      autorId:   currentUser?.id,
      autorNome: currentUser?.name || 'Você',
    };
    setComentariosPorOcorrencia(prev => ({
      ...prev,
      [ocorrenciaId]: [...(prev[ocorrenciaId] || []), novoItem],
    }));
    setNovoComentario(prev => ({ ...prev, [ocorrenciaId]: '' }));
  };

  const apagarComentario = (ocorrenciaId, comentarioId) => {
    setComentariosPorOcorrencia(prev => ({
      ...prev,
      [ocorrenciaId]: (prev[ocorrenciaId] || []).filter(c => c.id !== comentarioId),
    }));
  };

  const filtradas = ocorrencias.filter(o => {
    const matchSearch =
      o.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'Todos' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Painel de Acompanhamento</h2>
              <p className="header-date">Ocorrências do condomínio — comente e ajude seus vizinhos</p>
            </div>
          </div>
          <div className="header-right">
            <NotificationMenu />
            <div onClick={() => navigate('/perfil')} style={{ display:'flex', alignItems:'center', gap:'0.75rem', borderLeft:'1px solid #e2e8f0', paddingLeft:'1rem', cursor:'pointer' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--role-primary-color)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                {currentUser?.name?.charAt(0) || 'M'}
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content-scroll" style={{ backgroundColor: '#f8fafc' }}>
          <div className="feed-container">

            {/* Filtros */}
            <div className="feed-filter-box">
              <div className="feed-filter-top">
                <div className="feed-search-wrapper">
                  <Search size={18} className="feed-search-icon" />
                  <input
                    type="text"
                    className="feed-search-input"
                    placeholder="Pesquisar ocorrências..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="feed-filter-dropdowns">
                  <select className="feed-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="Todos">Todos os status</option>
                    <option value="Aberta">Aberta</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Resolvida">Resolvida</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Feed */}
            {loading ? (
              <div className="feed-empty">
                <RefreshCw size={36} className="feed-spin" style={{ marginBottom:'1rem', color:'#cbd5e1' }} />
                <p style={{ color:'#94a3b8' }}>Carregando...</p>
              </div>
            ) : filtradas.length > 0 ? (
              <div className="feed-ticket-list">
                {filtradas.map(item => {
                  const statusCfg        = getStatusCfg(item.status);
                  const comentarios      = comentariosPorOcorrencia[item.id] || [];
                  const estaExpandido    = !!expandido[item.id];
                  const comentariosVisiveis = estaExpandido ? comentarios : comentarios.slice(-2);
                  const isResolvida      = item.status === 'Resolvida';

                  return (
                    <div
                      key={item.id}
                      className={`feed-ticket${isResolvida ? ' feed-ticket-resolvida' : ''}`}
                    >
                      {/* Header */}
                      <div className="feed-ticket-header">
                        <div className="feed-user-info">
                          <div className="feed-user-avatar">
                            {isResolvida
                              ? <CheckCircle2 size={20} color="white" />
                              : (item.moradorNome?.charAt(0) || <FileEdit size={16} />)
                            }
                          </div>
                          <div className="feed-user-meta">
                            <span className="feed-user-name">{item.moradorNome}</span>
                            <span className="feed-post-time">
                              <Clock size={12} /> {formatarData(item.data)}
                            </span>
                          </div>
                        </div>
                        <div className={`feed-ticket-status ${statusCfg.class}`}>
                          <div className="status-dot"></div>
                          {statusCfg.label}
                        </div>
                      </div>

                      {/* Corpo */}
                      <div className="feed-ticket-body">
                        <h4 className={`feed-ticket-title${isResolvida ? ' feed-ticket-title-resolvida' : ''}`}>
                          {isResolvida && '✅ '}{item.titulo}
                        </h4>
                        <p className="feed-ticket-desc">{item.descricao}</p>
                        {item.funcionarioNome && (
                          <p style={{ fontSize:'0.8rem', color: isResolvida ? '#16a34a' : '#64748b', marginTop:'0.35rem' }}>
                            <UserCog size={13} style={{ verticalAlign:'text-bottom', marginRight:4 }} />
                            {isResolvida ? 'Resolvida por' : 'Atribuída a'} <strong>{item.funcionarioNome}</strong>
                          </p>
                        )}

                        {item.anexos.length > 0 && (
                          <div className="feed-anexos">
                            {item.anexos.map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" title="Abrir foto em tamanho completo">
                                <img
                                  src={url}
                                  alt={`Anexo ${idx + 1}`}
                                  className="feed-anexo-thumb"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="feed-ticket-footer">
                        <div className="feed-tags">
                          <span className="feed-tag">{item.categoria}</span>
                          {isResolvida && (
                            <span className="feed-tag feed-tag-resolvida">Concluída</span>
                          )}
                        </div>
                      </div>

                      {/* Comentários — bloqueados em ocorrências resolvidas */}
                      <div className="feed-comments">
                        {comentarios.length > 2 && !estaExpandido && (
                          <button className="feed-comments-toggle" onClick={() => toggleExpandido(item.id)}>
                            <ChevronDown size={14} /> Ver todos os {comentarios.length} comentários
                          </button>
                        )}
                        {estaExpandido && comentarios.length > 2 && (
                          <button className="feed-comments-toggle" onClick={() => toggleExpandido(item.id)}>
                            <ChevronUp size={14} /> Mostrar menos
                          </button>
                        )}

                        {comentariosVisiveis.map(c => (
                          <div key={c.id} className="feed-comment">
                            <div className="feed-comment-avatar">{c.autorNome?.charAt(0) || 'M'}</div>
                            <div className="feed-comment-body">
                              <span className="feed-comment-author">{c.autorNome}</span>
                              <span className="feed-comment-text">{c.texto}</span>
                              <span className="feed-comment-time">{formatarData(c.data)}</span>
                            </div>
                            {(c.autorId === currentUser?.id || isSindico) && (
                              <button className="feed-comment-delete" title="Apagar comentário" onClick={() => apagarComentario(item.id, c.id)}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}

                        {comentarios.length === 0 && !isResolvida && (
                          <p className="feed-comments-empty">
                            <MessageCircle size={14} /> Nenhum comentário ainda. Seja o primeiro a comentar.
                          </p>
                        )}

                        {comentarios.length === 0 && isResolvida && (
                          <p className="feed-comments-empty">
                            <CheckCircle2 size={14} /> Ocorrência encerrada.
                          </p>
                        )}

                        {/* Input de comentário — desabilitado se resolvida */}
                        {!isResolvida && (
                          <>
                            <div className="feed-comment-input-row">
                              <input
                                type="text"
                                className="feed-comment-input"
                                placeholder="Escreva um comentário..."
                                value={novoComentario[item.id] || ''}
                                onChange={(e) => setNovoComentario(prev => ({ ...prev, [item.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') enviarComentario(item.id); }}
                              />
                              <button
                                className="feed-comment-send"
                                onClick={() => enviarComentario(item.id)}
                                disabled={!(novoComentario[item.id] || '').trim()}
                              >
                                <Send size={16} />
                              </button>
                            </div>
                            {erroComentario[item.id] && (
                              <p className="feed-comment-erro">{erroComentario[item.id]}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="feed-empty">
                <BellOff size={48} color="#cbd5e1" style={{ marginBottom:'1rem' }} />
                <h4 style={{ fontSize:'1.125rem', color:'#475569', marginBottom:'0.5rem' }}>Nenhuma ocorrência encontrada</h4>
                <p style={{ color:'#94a3b8', fontSize:'0.875rem' }}>Tente alterar os filtros de busca.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FeedOcorrencias;