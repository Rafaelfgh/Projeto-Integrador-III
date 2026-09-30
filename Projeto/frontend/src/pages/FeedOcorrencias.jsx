import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Menu, Search, BellOff, Clock, FileEdit, Send, Trash2, MessageCircle, Loader2,
  RefreshCw, ChevronDown, ChevronUp, UserCog, CheckCircle2, Pin, Pencil
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationMenu from '../components/NotificationMenu';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { contemPalavrao, MSG_PALAVRAO } from '../utils/palavroes';
import { useCategorias } from '../hooks/useCategorias';
import { supabase } from '../backend/supabaseClient';
import { useVisualizadorImagem } from '../contexts/visualizadorImagem';
import AtualizacaoOcorrencia from '../components/AtualizacaoOcorrencia';
import GerenciarOcorrencia from '../components/GerenciarOcorrencia';
import { OCORRENCIA_CAMPOS, carregarNomes, assinarEvidencias } from '../services/ocorrenciaService';
import { protocoloOcorrencia } from '../utils/protocolo';
import './Dashboard.css';
import './FeedOcorrencias.css';

const STATUS_CONFIG = {
  'Aberta':       { class: 'f-status-red',    label: 'Aberta'       },
  'Em Análise':   { class: 'f-status-yellow', label: 'Em Análise'   },
  'Em Andamento': { class: 'f-status-yellow', label: 'Em Andamento' },
  'Resolvida':    { class: 'f-status-green',  label: 'Concluída'    },
};

// Concluídas ficam no mural dos moradores por 14 dias (o síndico mantém o histórico completo)
const DIAS_CONCLUIDAS = 14;

const PAPEL_LABEL = { SINDICO: 'Síndico', MASTER: 'Administração', FUNCIONARIO: 'Equipe' };

const COMENTARIO_CAMPOS = 'id, ocorrencia_id, autor_id, autor_nome, autor_papel, texto, created_at, editado_em';

const getStatusCfg = (status) => STATUS_CONFIG[status] || { class: 'f-status-yellow', label: status || '—' };

const formatarData = (data) => {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const formatarDia = (data) => (data ? new Date(data).toLocaleDateString('pt-BR') : '—');

const FeedOcorrencias = () => {
  const [ocorrencias,    setOcorrencias]    = useState([]);
  const [comentarios,    setComentarios]    = useState({});
  const [nomes,          setNomes]          = useState({});
  const [fotos,          setFotos]          = useState({});
  const [loading,        setLoading]        = useState(true);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [aba,            setAba]            = useState('abertas');
  const [searchTerm,     setSearchTerm]     = useState('');
  const [statusFilter,   setStatusFilter]   = useState('Todos');
  const [expandido,      setExpandido]      = useState({});
  const [novoComentario, setNovoComentario] = useState({});
  const [erroComentario, setErroComentario] = useState({});
  const [editandoPron,   setEditandoPron]   = useState({});
  const [salvandoPron,   setSalvandoPron]   = useState(null);
  const [erroPron,       setErroPron]       = useState({});
  const [comentando,     setComentando]     = useState(null);
  const [editandoCom,    setEditandoCom]    = useState(null); // { id, texto } do comentário em edição
  const travaComentario = useRef(false); // bloqueia cliques repetidos antes de a tela redesenhar
  const [gerenciando,    setGerenciando]    = useState(null);
  const navigate  = useNavigate();
  const { currentUser } = useAuth();
  const { rotulo } = useCategorias();
  const abrirImagem = useVisualizadorImagem();

  const isGestor = currentUser?.role === 'SINDICO' || currentUser?.role === 'MASTER';

  const fetchTudo = useCallback(async () => {
    if (!currentUser?.condominio_id) return;
    setLoading(true);

    // Mural = só ocorrências de área comum. As pessoais ficam com o síndico.
    // O RLS ainda limita as concluídas dos moradores a 14 dias.
    const { data: occData, error: erroOcc } = await supabase
      .from('Ocorrencias')
      .select(OCORRENCIA_CAMPOS)
      .eq('condominio_id', currentUser.condominio_id)
      .eq('privacidade', 'mural')
      .order('created_at', { ascending: false });
    if (erroOcc) console.error('Erro ao buscar ocorrências:', erroOcc);
    const lista = occData || [];
    const ids   = lista.map(o => o.id);

    const [mapaNomes, mapaFotos, coments] = await Promise.all([
      carregarNomes(lista.flatMap(o => [o.morador_id, o.atribuido_a, o.andamento_por, o.concluida_por])),
      assinarEvidencias(lista.flatMap(o => o.conclusao_evidencias || [])),
      ids.length
        ? supabase.from('ocorrencia_comentarios')
            .select(COMENTARIO_CAMPOS)
            .in('ocorrencia_id', ids)
            .order('created_at')
        : { data: [] },
    ]);
    if (coments.error) console.error('Erro ao carregar comentários:', coments.error);

    setNomes(mapaNomes);
    setFotos(mapaFotos);
    setOcorrencias(lista.map(o => ({
      ...o,
      status:          o.status || 'Aberta',
      anexos:          Array.isArray(o.anexos) ? o.anexos : [],
      moradorNome:     mapaNomes[o.morador_id] || 'Morador',
      funcionarioNome: o.atribuido_a ? (mapaNomes[o.atribuido_a] || null) : null,
      concluidaPor:    o.concluida_por ? (mapaNomes[o.concluida_por] || 'Administração') : null,
    })));

    const porOcorrencia = {};
    (coments.data || []).forEach(c => {
      (porOcorrencia[c.ocorrencia_id] ||= []).push(c);
    });
    setComentarios(porOcorrencia);
    setLoading(false);
  }, [currentUser?.condominio_id]);

  useEffect(() => { fetchTudo(); }, [fetchTudo]);

  const toggleExpandido = (id) => setExpandido(prev => ({ ...prev, [id]: !prev[id] }));

  const enviarComentario = async (ocorrenciaId) => {
    const texto = (novoComentario[ocorrenciaId] || '').trim();
    if (!texto || travaComentario.current) return;
    travaComentario.current = true;
    setComentando(ocorrenciaId);
    setErroComentario(prev => ({ ...prev, [ocorrenciaId]: null }));
    if (await contemPalavrao(texto)) {
      travaComentario.current = false;
      setComentando(null);
      setErroComentario(prev => ({ ...prev, [ocorrenciaId]: MSG_PALAVRAO }));
      return;
    }

    // Autor, nome e papel são preenchidos pelo banco
    const { data, error } = await supabase
      .from('ocorrencia_comentarios')
      .insert({ ocorrencia_id: ocorrenciaId, texto })
      .select(COMENTARIO_CAMPOS)
      .single();
    travaComentario.current = false;
    setComentando(null);
    if (error) {
      console.error('Erro ao comentar:', error);
      // hint 'palavrao' / 'um_comentario' = regra do banco, com mensagem pronta para o usuário
      const msg = error.hint ? error.message : 'Não foi possível enviar o comentário.';
      setErroComentario(prev => ({ ...prev, [ocorrenciaId]: msg }));
      return;
    }
    setComentarios(prev => ({ ...prev, [ocorrenciaId]: [...(prev[ocorrenciaId] || []), data] }));
    setNovoComentario(prev => ({ ...prev, [ocorrenciaId]: '' }));
  };

  // Só o autor edita (o banco confere), apenas o texto; o banco marca editado_em
  const salvarEdicaoComentario = async (ocorrenciaId) => {
    const texto = (editandoCom?.texto || '').trim();
    if (!texto || travaComentario.current) return;
    travaComentario.current = true;
    setComentando(ocorrenciaId);
    setErroComentario(prev => ({ ...prev, [ocorrenciaId]: null }));

    let erro = null;
    if (await contemPalavrao(texto)) {
      erro = MSG_PALAVRAO;
    } else {
      const { data, error } = await supabase
        .from('ocorrencia_comentarios')
        .update({ texto })
        .eq('id', editandoCom.id)
        .select(COMENTARIO_CAMPOS)
        .single();
      if (error) {
        console.error('Erro ao editar comentário:', error);
        erro = error.hint ? error.message : 'Não foi possível salvar a edição.';
      } else {
        setComentarios(prev => ({
          ...prev,
          [ocorrenciaId]: (prev[ocorrenciaId] || []).map(c => (c.id === data.id ? data : c)),
        }));
        setEditandoCom(null);
      }
    }
    travaComentario.current = false;
    setComentando(null);
    if (erro) setErroComentario(prev => ({ ...prev, [ocorrenciaId]: erro }));
  };

  const apagarComentario = async (ocorrenciaId, comentarioId) => {
    const { error } = await supabase.from('ocorrencia_comentarios').delete().eq('id', comentarioId);
    if (error) {
      console.error('Erro ao apagar comentário:', error);
      return;
    }
    setComentarios(prev => ({
      ...prev,
      [ocorrenciaId]: (prev[ocorrenciaId] || []).filter(c => c.id !== comentarioId),
    }));
  };

  const cancelarPronunciamento = (id) => setEditandoPron(prev => {
    const novo = { ...prev };
    delete novo[id];
    return novo;
  });

  const salvarPronunciamento = async (id) => {
    const texto = (editandoPron[id] || '').trim();
    setErroPron(prev => ({ ...prev, [id]: null }));
    if (await contemPalavrao(texto)) {
      setErroPron(prev => ({ ...prev, [id]: MSG_PALAVRAO }));
      return;
    }
    setSalvandoPron(id);
    const { data, error } = await supabase
      .from('Ocorrencias')
      .update({ pronunciamento: texto || null })
      .eq('id', id)
      .select('pronunciamento, pronunciamento_em')
      .single();
    setSalvandoPron(null);
    if (error) {
      setErroPron(prev => ({ ...prev, [id]: 'Não foi possível salvar o pronunciamento: ' + error.message }));
      return;
    }
    setOcorrencias(prev => prev.map(o => (o.id === id ? { ...o, ...data } : o)));
    cancelarPronunciamento(id);
  };

  const limiteConcluidas = Date.now() - DIAS_CONCLUIDAS * 24 * 60 * 60 * 1000;
  const abertas    = ocorrencias.filter(o => o.status !== 'Resolvida');
  const concluidas = ocorrencias.filter(o =>
    o.status === 'Resolvida' && o.concluida_em && new Date(o.concluida_em).getTime() >= limiteConcluidas
  );

  const termo = searchTerm.toLowerCase();
  const filtradas = (aba === 'abertas' ? abertas : concluidas).filter(o => {
    const matchSearch =
      o.titulo?.toLowerCase().includes(termo) ||
      o.descricao?.toLowerCase().includes(termo);
    const matchStatus = aba !== 'abertas' || statusFilter === 'Todos' || o.status === statusFilter;
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
              <h2 className="header-title">Mural de Ocorrências</h2>
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

            {/* Abas */}
            <div className="feed-abas" role="tablist">
              <button
                role="tab"
                aria-selected={aba === 'abertas'}
                className={`feed-aba${aba === 'abertas' ? ' ativa' : ''}`}
                onClick={() => setAba('abertas')}
              >
                Em aberto <span className="feed-aba-count">{abertas.length}</span>
              </button>
              <button
                role="tab"
                aria-selected={aba === 'concluidas'}
                className={`feed-aba${aba === 'concluidas' ? ' ativa' : ''}`}
                onClick={() => setAba('concluidas')}
              >
                Concluídas · últimos {DIAS_CONCLUIDAS} dias <span className="feed-aba-count">{concluidas.length}</span>
              </button>
            </div>

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
                {aba === 'abertas' && (
                  <div className="feed-filter-dropdowns">
                    <select className="feed-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="Todos">Todos os status</option>
                      <option value="Aberta">Aberta</option>
                      <option value="Em Análise">Em Análise</option>
                      <option value="Em Andamento">Em Andamento</option>
                    </select>
                  </div>
                )}
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
                  const statusCfg     = getStatusCfg(item.status);
                  const lista         = comentarios[item.id] || [];
                  const estaExpandido = !!expandido[item.id];
                  const isResolvida   = item.status === 'Resolvida';
                  const editando      = editandoPron[item.id] !== undefined;
                  const ehMinha       = item.morador_id === currentUser?.id;

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
                            <span className="feed-user-name">
                              {item.moradorNome}{ehMinha && ' (você)'}
                            </span>
                            <span className="feed-post-time">
                              <Clock size={12} /> {formatarData(item.created_at)}
                            </span>
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', justifyContent:'flex-end' }}>
                          <div className={`feed-ticket-status ${statusCfg.class}`}>
                            <div className="status-dot"></div>
                            {statusCfg.label}
                          </div>
                        </div>
                      </div>

                      {/* Corpo */}
                      <div className="feed-ticket-body">
                        <h4 className={`feed-ticket-title${isResolvida ? ' feed-ticket-title-resolvida' : ''}`}>
                          {item.titulo}
                        </h4>
                        <p className="feed-ticket-desc">{item.descricao}</p>
                        {isResolvida && item.concluidaPor ? (
                          <p className="feed-atribuicao">
                            <UserCog size={13} /> Resolvida por <strong>{item.concluidaPor}</strong>
                          </p>
                        ) : item.funcionarioNome && !isResolvida ? (
                          <p className="feed-atribuicao">
                            <UserCog size={13} /> Atribuída a <strong>{item.funcionarioNome}</strong>
                          </p>
                        ) : null}

                        {item.anexos.length > 0 && (
                          <div className="feed-anexos">
                            {item.anexos.map((url, idx) => (
                              <button key={idx} type="button" className="img-zoom" title="Ampliar foto" onClick={() => abrirImagem(item.anexos, idx)}>
                                <img
                                  src={url}
                                  alt={`Anexo ${idx + 1}`}
                                  className="feed-anexo-thumb"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Andamento / conclusão (descrição e foto da prova) */}
                      <AtualizacaoOcorrencia ocorrencia={item} nomes={nomes} fotos={fotos} />

                      {/* Pronunciamento do síndico: espaço fixo, sempre visível */}
                      <div className={`feed-pronunciamento${item.pronunciamento ? ' tem-texto' : ''}`}>
                        <div className="feed-pron-header">
                          <span className="feed-pron-label"><Pin size={13} /> Pronunciamento do síndico</span>
                          {isGestor && !editando && (
                            <button
                              className="feed-pron-edit"
                              onClick={() => setEditandoPron(prev => ({ ...prev, [item.id]: item.pronunciamento || '' }))}
                            >
                              <Pencil size={12} /> {item.pronunciamento ? 'Editar' : 'Pronunciar-se'}
                            </button>
                          )}
                        </div>

                        {editando ? (
                          <div className="feed-pron-form">
                            <textarea
                              maxLength={2000}
                              autoFocus
                              value={editandoPron[item.id]}
                              onChange={(e) => setEditandoPron(prev => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="Escreva um posicionamento oficial sobre esta ocorrência..."
                            />
                            <div className="feed-pron-actions">
                              <button className="feed-pron-cancel" onClick={() => cancelarPronunciamento(item.id)}>Cancelar</button>
                              <button
                                className="feed-pron-save"
                                disabled={salvandoPron === item.id}
                                onClick={() => salvarPronunciamento(item.id)}
                              >
                                {salvandoPron === item.id ? 'Salvando...' : 'Publicar'}
                              </button>
                            </div>
                            {erroPron[item.id] && <p className="feed-comment-erro">{erroPron[item.id]}</p>}
                          </div>
                        ) : item.pronunciamento ? (
                          <>
                            <p className="feed-pron-texto">{item.pronunciamento}</p>
                            <span className="feed-pron-data">{formatarData(item.pronunciamento_em)}</span>
                          </>
                        ) : (
                          <p className="feed-pron-vazio">O síndico ainda não se pronunciou sobre esta ocorrência.</p>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="feed-ticket-footer">
                        <div className="feed-tags">
                          <span className="feed-tag">{protocoloOcorrencia(item.id, item.created_at)}</span>
                          <span className="feed-tag">{rotulo(item.categoria)}</span>
                          {isResolvida && (
                            <span className="feed-tag feed-tag-resolvida">Concluída em {formatarDia(item.concluida_em)}</span>
                          )}
                        </div>
                        {isGestor && !isResolvida && (
                          <button className="feed-gerenciar" onClick={() => setGerenciando(item.id)}>
                            Gerenciar
                          </button>
                        )}
                        <button
                          className="feed-comments-toggle"
                          aria-expanded={estaExpandido}
                          onClick={() => toggleExpandido(item.id)}
                        >
                          <MessageCircle size={14} />
                          {lista.length} {lista.length === 1 ? 'comentário' : 'comentários'}
                          {estaExpandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {/* Comentários: aba expansível para manter o card com tamanho padrão */}
                      {estaExpandido && (
                        <div className="feed-comments">
                          {lista.map(c => (
                            <div key={c.id} className="feed-comment">
                              <div className="feed-comment-avatar">{c.autor_nome?.charAt(0) || 'M'}</div>
                              <div className="feed-comment-body">
                                <span className="feed-comment-author">
                                  {c.autor_nome}
                                  {PAPEL_LABEL[c.autor_papel] && (
                                    <span className="feed-comment-papel">{PAPEL_LABEL[c.autor_papel]}</span>
                                  )}
                                </span>
                                {editandoCom?.id === c.id ? (
                                  <div className="feed-comment-edit">
                                    <input
                                      type="text"
                                      className="feed-comment-input"
                                      maxLength={1000}
                                      autoFocus
                                      value={editandoCom.texto}
                                      onChange={(e) => setEditandoCom(prev => ({ ...prev, texto: e.target.value }))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) salvarEdicaoComentario(item.id);
                                        if (e.key === 'Escape') setEditandoCom(null);
                                      }}
                                    />
                                    <div className="feed-comment-edit-actions">
                                      <button className="feed-pron-cancel" onClick={() => setEditandoCom(null)} disabled={comentando === item.id}>Cancelar</button>
                                      <button
                                        className="feed-pron-save"
                                        onClick={() => salvarEdicaoComentario(item.id)}
                                        disabled={!editandoCom.texto.trim() || comentando === item.id}
                                      >
                                        {comentando === item.id ? 'Salvando...' : 'Salvar'}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="feed-comment-text">{c.texto}</span>
                                )}
                                <span className="feed-comment-time">
                                  {formatarData(c.created_at)}{c.editado_em && ' · editado'}
                                </span>
                              </div>
                              {c.autor_id === currentUser?.id && !isResolvida && editandoCom?.id !== c.id && (
                                <button className="feed-comment-delete feed-comment-editar" title="Editar comentário" onClick={() => setEditandoCom({ id: c.id, texto: c.texto })}>
                                  <Pencil size={14} />
                                </button>
                              )}
                              {(c.autor_id === currentUser?.id || isGestor) && (
                                <button className="feed-comment-delete" title="Apagar comentário" onClick={() => apagarComentario(item.id, c.id)}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}

                          {lista.length === 0 && !isResolvida && (
                            <p className="feed-comments-empty">
                              <MessageCircle size={14} /> Nenhum comentário ainda. Seja o primeiro a comentar.
                            </p>
                          )}

                          {isResolvida ? (
                            <p className="feed-comments-empty">
                              <CheckCircle2 size={14} /> Ocorrência encerrada — comentários fechados.
                            </p>
                          ) : lista.some(c => c.autor_id === currentUser?.id) ? (
                            <p className="feed-comments-empty">
                              <MessageCircle size={14} /> Você já comentou nesta ocorrência. Para editar, use o lápis no seu comentário.
                            </p>
                          ) : (
                            <>
                              <div className="feed-comment-input-row">
                                <input
                                  type="text"
                                  className="feed-comment-input"
                                  maxLength={1000}
                                  placeholder="Acrescente uma informação..."
                                  value={novoComentario[item.id] || ''}
                                  onChange={(e) => setNovoComentario(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter') enviarComentario(item.id); }}
                                />
                                <button
                                  className="feed-comment-send"
                                  onClick={() => enviarComentario(item.id)}
                                  disabled={!(novoComentario[item.id] || '').trim() || comentando === item.id}
                                >
                                  {comentando === item.id ? <Loader2 size={16} className="feed-girando" /> : <Send size={16} />}
                                </button>
                              </div>
                            </>
                          )}
                          {!isResolvida && erroComentario[item.id] && (
                            <p className="feed-comment-erro">{erroComentario[item.id]}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="feed-empty">
                <BellOff size={48} color="#cbd5e1" style={{ marginBottom:'1rem' }} />
                <h4 style={{ fontSize:'1.125rem', color:'#475569', marginBottom:'0.5rem' }}>
                  {aba === 'abertas' ? 'Nenhuma ocorrência em aberto' : 'Nenhuma ocorrência concluída recentemente'}
                </h4>
                <p style={{ color:'#94a3b8', fontSize:'0.875rem' }}>
                  {aba === 'abertas' ? 'Tente alterar os filtros de busca.' : `Aqui aparecem as concluídas nos últimos ${DIAS_CONCLUIDAS} dias.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {gerenciando && (
        <GerenciarOcorrencia
          ocorrenciaId={gerenciando}
          onFechar={() => setGerenciando(null)}
          onAtualizada={fetchTudo}
        />
      )}
    </div>
  );
};

export default FeedOcorrencias;
