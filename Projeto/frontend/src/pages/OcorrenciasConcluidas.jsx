import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Menu, Search, CheckCircle2, Clock, UserCog, User, CalendarDays, Timer,
  ChevronDown, ChevronUp, Lock, Pin, RefreshCw, Image as ImageIcon, Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import { useAuth } from '../contexts/AuthContext';
import { useCategorias } from '../hooks/useCategorias';
import { supabase } from '../backend/supabaseClient';
import { useVisualizadorImagem } from '../contexts/visualizadorImagem';
import { protocoloOcorrencia } from '../utils/protocolo';
import { OCORRENCIA_CAMPOS, carregarNomes, assinarEvidencias } from '../services/ocorrenciaService';
import './Dashboard.css';
import './OcorrenciasConcluidas.css';

const PERIODOS = [
  { key: '30',    label: 'Últimos 30 dias' },
  { key: '90',    label: 'Últimos 90 dias' },
  { key: '365',   label: 'Último ano' },
  { key: 'todas', label: 'Todo o período' },
];

const PAPEL_LABEL = { MASTER: 'Master', SINDICO: 'Síndico', FUNCIONARIO: 'Funcionário', MORADOR: 'Morador', SISTEMA: 'Sistema' };

const formatarData = (d) => (d
  ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—');

const formatarDuracao = (ms) => {
  if (ms == null || ms < 0) return '—';
  const horas = ms / 36e5;
  if (horas < 1) return `${Math.max(1, Math.round(ms / 6e4))} min`;
  if (horas < 48) return `${Math.round(horas)} h`;
  return `${Math.round(horas / 24)} dias`;
};

const OcorrenciasConcluidas = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { categorias, rotulo } = useCategorias();
  const abrirImagem = useVisualizadorImagem();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [itens,       setItens]       = useState([]);
  const [fotos,       setFotos]       = useState({});
  const [aberto,      setAberto]      = useState({});
  const [busca,       setBusca]       = useState('');
  const [categoria,   setCategoria]   = useState('todas');
  const [funcionario, setFuncionario] = useState('todos');
  const [periodo,     setPeriodo]     = useState('todas');

  const carregar = useCallback(async () => {
    if (!currentUser?.condominio_id) return;
    setLoading(true);

    const { data: occ, error } = await supabase
      .from('Ocorrencias')
      .select(`${OCORRENCIA_CAMPOS}, Moradores(nome, bloco, apartamento)`)
      .eq('condominio_id', currentUser.condominio_id)
      .eq('status', 'Resolvida')
      .order('concluida_em', { ascending: false, nullsFirst: false });
    if (error) console.error('Erro ao buscar concluídas:', error);
    const lista = occ || [];

    // Histórico (andamento e resolução, com provas): visível só para gestão e equipe
    let historico = [];
    if (lista.length > 0) {
      const { data: hist, error: erroHist } = await supabase
        .from('ocorrencia_historico')
        .select('id, ocorrencia_id, autor_nome, autor_papel, status_anterior, status_novo, descricao, evidencias, created_at')
        .in('ocorrencia_id', lista.map(o => o.id))
        .order('created_at');
      if (erroHist) console.error('Erro ao buscar histórico:', erroHist);
      historico = hist || [];
    }

    const histPorOcorrencia = {};
    historico.forEach(h => { (histPorOcorrencia[h.ocorrencia_id] ||= []).push(h); });

    // Crédito da conclusão = quem mudou o status para Concluída
    const [mapaNomes, mapaFotos] = await Promise.all([
      carregarNomes(lista.map(o => o.concluida_por)),
      assinarEvidencias(lista.flatMap(o => o.conclusao_evidencias || [])),
    ]);

    setItens(lista.map(o => ({
      ...o,
      passos:          histPorOcorrencia[o.id] || [],
      resolucao:       (o.conclusao_descricao || o.conclusao_evidencias?.length)
        ? { descricao: o.conclusao_descricao, evidencias: o.conclusao_evidencias || [] }
        : null,
      anexos:          Array.isArray(o.anexos) ? o.anexos : [],
      moradorNome:     o.Moradores?.nome || 'Morador',
      unidade:         o.Moradores ? `Bloco ${o.Moradores.bloco} · Apt ${o.Moradores.apartamento}` : '',
      funcionarioNome: o.concluida_por ? (mapaNomes[o.concluida_por] || 'Administração') : null,
      duracaoMs:       o.concluida_em ? new Date(o.concluida_em) - new Date(o.created_at) : null,
    })));
    setFotos(mapaFotos);

    setLoading(false);
  }, [currentUser?.condominio_id]);

  useEffect(() => { carregar(); }, [carregar]);

  const funcionarios = useMemo(
    () => [...new Set(itens.map(i => i.funcionarioNome).filter(Boolean))].sort(),
    [itens]
  );

  const filtrados = useMemo(() => {
    const termo  = busca.toLowerCase();
    const limite = periodo === 'todas' ? null : Date.now() - Number(periodo) * 864e5;
    return itens.filter(i =>
      (!termo || i.titulo?.toLowerCase().includes(termo) || i.descricao?.toLowerCase().includes(termo) || i.moradorNome.toLowerCase().includes(termo)) &&
      (categoria === 'todas' || i.categoria === categoria) &&
      (funcionario === 'todos' || i.funcionarioNome === funcionario) &&
      (!limite || (i.concluida_em && new Date(i.concluida_em).getTime() >= limite))
    );
  }, [itens, busca, categoria, funcionario, periodo]);

  // Indicadores do período filtrado
  const indicadores = useMemo(() => {
    const duracoes = filtrados.map(i => i.duracaoMs).filter(d => d != null);
    const media    = duracoes.length ? duracoes.reduce((a, b) => a + b, 0) / duracoes.length : null;
    const porFunc  = {};
    filtrados.forEach(i => { if (i.funcionarioNome) porFunc[i.funcionarioNome] = (porFunc[i.funcionarioNome] || 0) + 1; });
    const destaque = Object.entries(porFunc).sort((a, b) => b[1] - a[1])[0];
    const comProva = filtrados.filter(i => i.resolucao && (i.resolucao.evidencias?.length || i.resolucao.descricao)).length;
    return { total: filtrados.length, media, destaque, comProva };
  }, [filtrados]);

  const toggle = (id) => setAberto(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Ocorrências Concluídas</h2>
              <p className="header-date">Histórico completo das ocorrências e do trabalho da equipe</p>
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

        <div className="dashboard-content-scroll" style={{ backgroundColor: '#f8fafc' }}>
          <div className="oc-container">

            {/* Indicadores */}
            <section className="oc-kpis">
              <div className="oc-kpi">
                <span className="oc-kpi-icon oc-kpi-green"><CheckCircle2 size={18} /></span>
                <div><strong>{indicadores.total}</strong><span>concluídas no período</span></div>
              </div>
              <div className="oc-kpi">
                <span className="oc-kpi-icon oc-kpi-blue"><Timer size={18} /></span>
                <div><strong>{formatarDuracao(indicadores.media)}</strong><span>tempo médio de resolução</span></div>
              </div>
              <div className="oc-kpi">
                <span className="oc-kpi-icon oc-kpi-violet"><ImageIcon size={18} /></span>
                <div><strong>{indicadores.comProva}</strong><span>com provas registradas</span></div>
              </div>
              <div className="oc-kpi">
                <span className="oc-kpi-icon oc-kpi-amber"><Trophy size={18} /></span>
                <div>
                  <strong>{indicadores.destaque ? indicadores.destaque[0] : '—'}</strong>
                  <span>{indicadores.destaque ? `${indicadores.destaque[1]} conclusões` : 'mais conclusões'}</span>
                </div>
              </div>
            </section>

            {/* Filtros */}
            <section className="oc-filtros">
              <div className="oc-busca">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar por título, descrição ou morador..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="todas">Todas as categorias</option>
                {categorias.map(c => <option key={c.slug} value={c.slug}>{c.icone} {c.nome}</option>)}
              </select>
              <select value={funcionario} onChange={(e) => setFuncionario(e.target.value)}>
                <option value="todos">Todos os funcionários</option>
                {funcionarios.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                {PERIODOS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </section>

            {/* Lista */}
            {loading ? (
              <div className="oc-vazio">
                <RefreshCw size={32} className="oc-spin" />
                <p>Carregando...</p>
              </div>
            ) : filtrados.length === 0 ? (
              <div className="oc-vazio">
                <CheckCircle2 size={40} />
                <h4>Nenhuma ocorrência concluída encontrada</h4>
                <p>Ajuste os filtros ou o período.</p>
              </div>
            ) : (
              <div className="oc-lista">
                {filtrados.map(item => {
                  const expandido = !!aberto[item.id];
                  const provas    = item.resolucao?.evidencias || [];
                  return (
                    <article key={item.id} className="oc-card">
                      <header className="oc-card-topo">
                        <div className="oc-card-titulo">
                          <span className="oc-protocolo">{protocoloOcorrencia(item.id, item.created_at)}</span>
                          <h3>{item.titulo}</h3>
                          <div className="oc-tags">
                            <span className="oc-tag">{rotulo(item.categoria)}</span>
                            {item.privacidade === 'pessoal' && <span className="oc-tag oc-tag-privada"><Lock size={11} /> Pessoal</span>}
                          </div>
                        </div>
                        <span className="oc-status"><CheckCircle2 size={14} /> Concluída</span>
                      </header>

                      <div className="oc-meta">
                        <span><User size={14} /> {item.moradorNome}{item.unidade && ` · ${item.unidade}`}</span>
                        <span><UserCog size={14} /> Concluída por {item.funcionarioNome || 'não registrado'}</span>
                        <span><CalendarDays size={14} /> Aberta {formatarData(item.created_at)}</span>
                        <span><Clock size={14} /> Concluída {formatarData(item.concluida_em)}</span>
                        <span className="oc-duracao"><Timer size={14} /> {formatarDuracao(item.duracaoMs)}</span>
                      </div>

                      <div className="oc-colunas">
                        <div className="oc-bloco">
                          <h4>Ocorrência</h4>
                          <p>{item.descricao}</p>
                          {item.anexos.length > 0 && (
                            <div className="oc-fotos">
                              {item.anexos.map((url, i) => (
                                <button key={i} type="button" className="img-zoom" onClick={() => abrirImagem(item.anexos, i)}>
                                  <img src={url} alt={`Anexo ${i + 1}`} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="oc-bloco oc-bloco-resolucao">
                          <h4>Resolução</h4>
                          {!item.resolucao
                            ? <p className="oc-sem-info">Concluída antes do registro de resolução.</p>
                            : item.resolucao.descricao
                              ? <p>{item.resolucao.descricao}</p>
                              : <p className="oc-sem-info">Sem descrição registrada.</p>}
                          {provas.length > 0 ? (
                            <div className="oc-fotos">
                              {provas.map(caminho => (
                                fotos[caminho]
                                  ? (
                                    <button key={caminho} type="button" className="img-zoom" onClick={() => {
                                      const urls = provas.map(c => fotos[c]).filter(Boolean);
                                      abrirImagem(urls, urls.indexOf(fotos[caminho]));
                                    }}>
                                      <img src={fotos[caminho]} alt="Prova da conclusão" />
                                    </button>
                                  )
                                  : <span key={caminho} className="oc-foto-indisponivel">foto indisponível</span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {item.pronunciamento && (
                        <div className="oc-pronunciamento">
                          <span><Pin size={13} /> Pronunciamento do síndico · {formatarData(item.pronunciamento_em)}</span>
                          <p>{item.pronunciamento}</p>
                        </div>
                      )}

                      {item.passos.length > 0 && (
                        <>
                          <button className="oc-toggle" onClick={() => toggle(item.id)} aria-expanded={expandido}>
                            {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            Histórico ({item.passos.length} {item.passos.length === 1 ? 'etapa' : 'etapas'})
                          </button>
                          {expandido && (
                            <ol className="oc-timeline">
                              {item.passos.map(p => (
                                <li key={p.id}>
                                  <div className="oc-timeline-linha">
                                    <strong>{p.status_anterior ? `${p.status_anterior} → ${p.status_novo}` : p.status_novo}</strong>
                                    <span>{p.autor_nome || '—'} ({PAPEL_LABEL[p.autor_papel] || p.autor_papel || '—'}) · {formatarData(p.created_at)}</span>
                                  </div>
                                  {p.descricao && <p>{p.descricao}</p>}
                                </li>
                              ))}
                            </ol>
                          )}
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OcorrenciasConcluidas;
