import React, { useState, useEffect, useCallback } from 'react';
import ErroCarregamento from '../components/ErroCarregamento';
import { Menu, Mail, Plus, Users, UserCheck, Trash2, Loader2, MessageSquareReply, Send, Inbox } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import Janela from '../components/Janela';
import AvatarUsuario from '../components/AvatarUsuario';
import RespostasRecado from '../components/RespostasRecado';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import { contemPalavrao, MSG_PALAVRAO } from '../utils/palavroes';
import { useRecadosNaoLidos, marcarRecadoLido } from '../hooks/useRecadosNaoLidos';
import './Dashboard.css';
import './Recados.css';

// Recados: comunicação formal e esporádica da gestão (síndico/master) com os funcionários.
// A gestão cria (para todos ou para escolhidos); funcionários só respondem.

const COR_FUNCIONARIO = '#16a34a';
const FORM_VAZIO = { titulo: '', texto: '', paraTodos: true, escolhidos: [] };

const formatarData = (d) => new Date(d).toLocaleDateString('pt-BR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const Recados = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const ehGestao = currentUser?.role === 'SINDICO' || currentUser?.role === 'MASTER';
  const condominioId = currentUser?.condominio_id;
  const { porRecado: naoLidos } = useRecadosNaoLidos(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);
  const [recados, setRecados] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]); // nomes de quem recebeu (e lista para escolher)
  const [aberto, setAberto] = useState(null);
  const [params, setParams] = useSearchParams();

  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erroForm, setErroForm] = useState(null);

  const [apagar, setApagar] = useState(null);
  const [apagando, setApagando] = useState(false);
  const [erroApagar, setErroApagar] = useState(null);

  const carregar = useCallback(async () => {
    if (!condominioId) return;
    setCarregando(true);
    setErroCarga(false);
    const [{ data, error }, funcs] = await Promise.all([
      supabase
        .from('recados')
        .select('id, titulo, texto, para_todos, autor_nome, created_at, recado_destinatarios(funcionario_id), recado_respostas(count)')
        .order('created_at', { ascending: false }),
      supabase.from('Funcionarios').select('id, nome, foto, status').eq('condominio_id', condominioId).order('nome'),
    ]);
    if (error) {
      console.error('Erro ao carregar recados:', error);
      setErroCarga(true);
      setCarregando(false);
      return;
    }
    setRecados((data || []).map(r => ({
      ...r,
      destinatarios: (r.recado_destinatarios || []).map(d => d.funcionario_id),
      respostas: r.recado_respostas?.[0]?.count ?? 0,
    })));
    setFuncionarios(funcs.data || []);
    setCarregando(false);
  }, [condominioId]);

  useEffect(() => { carregar(); }, [carregar]);

  const ativos = funcionarios.filter(f => f.status === 'ATIVO');
  const nomePor = Object.fromEntries(funcionarios.map(f => [f.id, f.nome]));
  // Todos os envolvidos aparecem para todo mundo; o próprio nome vira "Você"
  const paraQuem = (r) => {
    if (r.para_todos) return 'Todos os funcionários';
    const nomes = r.destinatarios
      .map(id => (id === currentUser?.id ? 'Você' : nomePor[id] || 'Ex-funcionário'))
      .sort((a, b) => (a === 'Você' ? -1 : b === 'Você' ? 1 : a.localeCompare(b)));
    return nomes.join(', ');
  };

  // ---------- Novo recado ----------
  const abrirNovo = () => {
    setForm(FORM_VAZIO);
    setErroForm(null);
    setCriando(true);
  };

  const alternarEscolhido = (id) => setForm(prev => ({
    ...prev,
    escolhidos: prev.escolhidos.includes(id) ? prev.escolhidos.filter(x => x !== id) : [...prev.escolhidos, id],
  }));

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    if (!form.paraTodos && form.escolhidos.length === 0) {
      setErroForm('Escolha pelo menos um funcionário.');
      return;
    }
    setErroForm(null);
    setEnviando(true);
    try {
      if (await contemPalavrao(form.titulo, form.texto)) throw new Error(MSG_PALAVRAO);
      const { error } = await supabase.rpc('enviar_recado', {
        p_titulo: form.titulo.trim(),
        p_texto: form.texto.trim(),
        p_para_todos: form.paraTodos,
        p_funcionarios: form.paraTodos ? [] : form.escolhidos,
      });
      if (error) throw new Error(error.hint ? error.message : `Não foi possível enviar o recado: ${error.message}`);
      setCriando(false);
      carregar();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setEnviando(false);
    }
  };

  // ---------- Apagar (gestão) ----------
  const confirmarApagar = async () => {
    if (!apagar || apagando) return;
    setApagando(true);
    setErroApagar(null);
    const { error } = await supabase.from('recados').delete().eq('id', apagar.id);
    setApagando(false);
    if (error) {
      setErroApagar('Não foi possível apagar o recado.');
      return;
    }
    setRecados(prev => prev.filter(r => r.id !== apagar.id));
    setApagar(null);
  };

  // Abre também pelo link da notificação (?recado=<id>); fechar tira o parâmetro
  const recadoDoLink = params.get('recado');
  const abertoAtual = aberto || recados.find(r => String(r.id) === recadoDoLink) || null;
  const fecharRecado = () => {
    setAberto(null);
    if (recadoDoLink) {
      const novos = new URLSearchParams(params);
      novos.delete('recado');
      setParams(novos, { replace: true });
    }
  };

  const contarResposta = (id) => setRecados(prev => prev.map(r => (r.id === id ? { ...r, respostas: r.respostas + 1 } : r)));

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Recados</h2>
              <p className="header-date">{ehGestao ? 'Comunicados da gestão para a equipe' : 'Comunicados da gestão para você'}</p>
            </div>
          </div>
          <div className="header-right">
            <NotificationMenu />
            <div onClick={() => navigate('/perfil')} style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem', cursor: 'pointer' }}>
              <AvatarUsuario nome={currentUser?.name} foto={currentUser?.foto} tamanho={36} />
            </div>
          </div>
        </header>

        <ContextBanner />

        <div className="dashboard-content-scroll" style={{ backgroundColor: '#f8fafc' }}>
          <div className="rc-container">
            {ehGestao && (
              <div className="rc-barra">
                <button className="rc-btn-pri" onClick={abrirNovo}><Plus size={16} /> Novo recado</button>
              </div>
            )}

            {carregando ? (
              <p className="rc-vazio"><Loader2 size={18} className="janela-girando" /> Carregando...</p>
            ) : erroCarga ? (
              <ErroCarregamento onTentar={carregar} />
            ) : recados.length === 0 ? (
              <div className="rc-vazio">
                <Inbox size={36} />
                <p>{ehGestao ? 'Nenhum recado enviado ainda.' : 'Você ainda não recebeu recados.'}</p>
              </div>
            ) : (
              <div className="rc-lista">
                {recados.map(r => (
                  <article key={r.id} className={`rc-card${naoLidos[r.id] ? ' rc-card-novo' : ''}`} onClick={() => setAberto(r)} role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setAberto(r); }}>
                    <div className="rc-card-topo">
                      <span className="rc-icone"><Mail size={18} /></span>
                      <div className="rc-card-titulos">
                        <h3>
                          {r.titulo}
                          {naoLidos[r.id] > 0 && (
                            <span className="rc-novas">{naoLidos[r.id]} {naoLidos[r.id] === 1 ? 'nova' : 'novas'}</span>
                          )}
                        </h3>
                        <p>{r.autor_nome} · {formatarData(r.created_at)}</p>
                      </div>
                      {ehGestao && (
                        <button type="button" className="rc-apagar" title="Apagar recado"
                          onClick={(e) => { e.stopPropagation(); setErroApagar(null); setApagar(r); }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    <p className="rc-trecho">{r.texto}</p>
                    <div className="rc-card-rodape">
                      <span className="rc-para">{r.para_todos ? <Users size={13} /> : <UserCheck size={13} />} <span>Para: {paraQuem(r)}</span></span>
                      <span className={r.respostas > 0 ? 'rc-respostas rc-respostas-tem' : 'rc-respostas'}>
                        <MessageSquareReply size={13} /> {r.respostas} {r.respostas === 1 ? 'resposta' : 'respostas'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {abertoAtual && (
        <Janela
          icone={Mail}
          titulo={abertoAtual.titulo}
          subtitulo={`${abertoAtual.autor_nome} · ${formatarData(abertoAtual.created_at)} · Para: ${paraQuem(abertoAtual)}`}
          largura="grande"
          onFechar={fecharRecado}
          fecharAoClicarFora
          rodape={<button type="button" className="janela-btn janela-btn-sec" onClick={fecharRecado}>Fechar</button>}
        >
          <p className="janela-texto" style={{ whiteSpace: 'pre-wrap' }}>{abertoAtual.texto}</p>
          <RespostasRecado
            recadoId={abertoAtual.id}
            onRespondido={() => contarResposta(abertoAtual.id)}
            onCarregado={() => marcarRecadoLido(abertoAtual.id)}
          />
        </Janela>
      )}

      {criando && (
        <Janela
          as="form"
          onSubmit={enviar}
          icone={Send}
          titulo="Novo recado"
          subtitulo="Os funcionários escolhidos são avisados e podem responder."
          largura="grande"
          bloqueada={enviando}
          onFechar={() => setCriando(false)}
          rodape={<>
            <button type="button" className="janela-btn janela-btn-sec" onClick={() => setCriando(false)} disabled={enviando}>Cancelar</button>
            <button type="submit" className="janela-btn janela-btn-pri" disabled={enviando}>
              {enviando ? <><Loader2 size={16} className="janela-girando" /> Enviando...</> : <><Send size={16} /> Enviar recado</>}
            </button>
          </>}
        >
          <div className="janela-campo">
            <label htmlFor="rc-titulo">Assunto</label>
            <input
              id="rc-titulo"
              className="janela-input"
              required
              maxLength={150}
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex.: Reunião da equipe na sexta"
              disabled={enviando}
            />
          </div>

          <div className="janela-campo">
            <label htmlFor="rc-texto">Recado</label>
            <textarea
              id="rc-texto"
              className="janela-input"
              required
              maxLength={3000}
              value={form.texto}
              onChange={(e) => setForm({ ...form, texto: e.target.value })}
              placeholder="Escreva o recado."
              disabled={enviando}
            />
          </div>

          <div className="janela-campo">
            <span className="janela-rotulo">Para quem</span>
            <div className="rc-destino" role="radiogroup" aria-label="Para quem">
              <label className={form.paraTodos ? 'ativo' : ''}>
                <input type="radio" name="rc-destino" checked={form.paraTodos} onChange={() => setForm({ ...form, paraTodos: true })} disabled={enviando} />
                <Users size={15} /> Todos os funcionários
              </label>
              <label className={!form.paraTodos ? 'ativo' : ''}>
                <input type="radio" name="rc-destino" checked={!form.paraTodos} onChange={() => setForm({ ...form, paraTodos: false })} disabled={enviando} />
                <UserCheck size={15} /> Escolher funcionários
              </label>
            </div>

            {!form.paraTodos && (
              <div className="rc-escolha">
                {ativos.length === 0 ? (
                  <p className="janela-ajuda">Nenhum funcionário ativo.</p>
                ) : ativos.map(f => (
                  <label key={f.id} className={`rc-pessoa${form.escolhidos.includes(f.id) ? ' marcado' : ''}`}>
                    <input type="checkbox" checked={form.escolhidos.includes(f.id)} onChange={() => alternarEscolhido(f.id)} disabled={enviando} />
                    <AvatarUsuario nome={f.nome} foto={f.foto} tamanho={30} cor={COR_FUNCIONARIO} />
                    <span>{f.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {erroForm && <p className="janela-erro" role="alert">{erroForm}</p>}
        </Janela>
      )}

      {apagar && (
        <Janela
          icone={Trash2}
          tom="perigo"
          titulo="Apagar recado"
          subtitulo="O recado e todas as respostas somem para todos."
          largura="pequena"
          bloqueada={apagando}
          onFechar={() => setApagar(null)}
          rodape={<>
            <button type="button" className="janela-btn janela-btn-sec" onClick={() => setApagar(null)} disabled={apagando}>Cancelar</button>
            <button type="button" className="janela-btn janela-btn-perigo" onClick={confirmarApagar} disabled={apagando}>
              {apagando ? <><Loader2 size={16} className="janela-girando" /> Apagando...</> : <><Trash2 size={16} /> Apagar</>}
            </button>
          </>}
        >
          <p className="janela-texto">Apagar <strong>{apagar.titulo}</strong>?</p>
          {erroApagar && <p className="janela-erro" role="alert">{erroApagar}</p>}
        </Janela>
      )}
    </div>
  );
};

export default Recados;
