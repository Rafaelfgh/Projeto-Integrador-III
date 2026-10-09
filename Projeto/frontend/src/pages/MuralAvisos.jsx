import React, { useState, useEffect, useCallback, useRef } from 'react';
import ErroCarregamento from '../components/ErroCarregamento';
import {
  Menu, Megaphone, CalendarDays, Clock, Plus, X, ImagePlus, Trash2, TimerOff, RefreshCw, Inbox, Loader2,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import { useVisualizadorImagem } from '../contexts/visualizadorImagem';
import { garantirSemPalavrao } from '../utils/palavroes';
import { reduzirImagem } from '../utils/imagem';
import Janela from '../components/Janela';
import AvatarUsuario from '../components/AvatarUsuario';
import './Dashboard.css';
import './MuralAvisos.css';

const MAX_IMAGENS = 3;
const MAX_TEXTO = 3000;

const formatar = (d) => (d
  ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—');

// Valor para <input type="datetime-local"> no fuso do navegador
const paraInputData = (data) => {
  const d = new Date(data);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const FORM_VAZIO = () => ({
  tipo: 'aviso',
  titulo: '',
  conteudo: '',
  dataEvento: '',
  expiraEm: paraInputData(Date.now() + 7 * 864e5),
  expiraTocado: false,
});

// ---------------------------------------------------------------------------
// Formulário de publicação (síndico / master)
// ---------------------------------------------------------------------------
const NovoAviso = ({ condominioId, onPublicado, onCancelar }) => {
  const fileRef = useRef();
  const [form, setForm]         = useState(FORM_VAZIO);
  const [imagens, setImagens]   = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro]         = useState(null);

  const alterar = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  const alterarDataEvento = (valor) => {
    setForm(prev => ({
      ...prev,
      dataEvento: valor,
      // Sugere expirar um dia depois do evento, se o prazo ainda não foi mexido
      expiraEm: !prev.expiraTocado && valor ? paraInputData(new Date(valor).getTime() + 864e5) : prev.expiraEm,
    }));
  };

  const adicionarImagens = (arquivos) => {
    const novas = Array.from(arquivos)
      .slice(0, MAX_IMAGENS - imagens.length)
      .map(file => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
    setImagens(prev => [...prev, ...novas]);
  };

  const publicar = async (e) => {
    e.preventDefault();
    setErro(null);
    if (form.tipo === 'evento' && !form.dataEvento) {
      setErro('Informe a data do evento.');
      return;
    }
    if (new Date(form.expiraEm) <= new Date()) {
      setErro('O prazo de expiração precisa ser uma data futura.');
      return;
    }

    setEnviando(true);
    const caminhos = [];
    try {
      await garantirSemPalavrao(form.titulo, form.conteudo);
      for (const img of imagens) {
        const arquivo = await reduzirImagem(img.file);
        const ext = arquivo.name.split('.').pop()?.toLowerCase() || 'jpg';
        const caminho = `${condominioId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('avisos').upload(caminho, arquivo);
        if (error) throw new Error(`Falha ao enviar a imagem ${img.file.name}: ${error.message}`);
        caminhos.push(caminho);
      }

      const { error } = await supabase.from('avisos').insert({
        condominio_id: condominioId,
        tipo:          form.tipo,
        titulo:        form.titulo.trim(),
        conteudo:      form.conteudo.trim(),
        data_evento:   form.tipo === 'evento' ? new Date(form.dataEvento).toISOString() : null,
        expira_em:     new Date(form.expiraEm).toISOString(),
        imagens:       caminhos,
      });
      if (error) throw new Error(error.message);

      onPublicado();
    } catch (err) {
      // Não deixa imagens soltas no armazenamento se a publicação falhar
      if (caminhos.length > 0) await supabase.storage.from('avisos').remove(caminhos);
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Janela
      as="form"
      onSubmit={publicar}
      icone={form.tipo === 'evento' ? CalendarDays : Megaphone}
      titulo="Novo no mural"
      subtitulo="Todos os moradores são avisados quando você publicar."
      largura="grande"
      bloqueada={enviando}
      onFechar={onCancelar}
      rodape={<>
        <button type="button" className="janela-btn janela-btn-sec" onClick={onCancelar} disabled={enviando}>Cancelar</button>
        <button type="submit" className="janela-btn janela-btn-pri" disabled={enviando}>
          {enviando ? <><Loader2 size={16} className="janela-girando" /> Publicando...</> : <><Megaphone size={16} /> Publicar no mural</>}
        </button>
      </>}
    >
      <div className="av-tipos" role="radiogroup" aria-label="Tipo">
        {[{ v: 'aviso', r: 'Aviso' }, { v: 'evento', r: 'Evento' }].map(({ v, r }) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={form.tipo === v}
            className={form.tipo === v ? 'ativo' : ''}
            onClick={() => alterar('tipo', v)}
          >
            {v === 'evento' ? <CalendarDays size={15} /> : <Megaphone size={15} />} {r}
          </button>
        ))}
      </div>

      <div className="janela-campo">
        <label htmlFor="av-titulo">Título</label>
        <input
          id="av-titulo"
          className="janela-input"
          required
          maxLength={150}
          value={form.titulo}
          onChange={(e) => alterar('titulo', e.target.value)}
          placeholder={form.tipo === 'evento' ? 'Ex.: Festa junina no salão de festas' : 'Ex.: Garagem do Bloco B será lavada'}
        />
      </div>

      <div className="janela-campo">
        <label htmlFor="av-conteudo">Texto</label>
        <textarea
          id="av-conteudo"
          className="janela-input"
          required
          maxLength={MAX_TEXTO}
          value={form.conteudo}
          onChange={(e) => alterar('conteudo', e.target.value)}
          placeholder="Escreva o aviso do jeito que preferir."
        />
        <span className="janela-ajuda" style={{ textAlign: 'right' }}>{form.conteudo.length}/{MAX_TEXTO}</span>
      </div>

      <div className="janela-grade">
        {form.tipo === 'evento' && (
          <div className="janela-campo">
            <label htmlFor="av-evento">Data do evento</label>
            <input id="av-evento" className="janela-input" type="datetime-local" required value={form.dataEvento} onChange={(e) => alterarDataEvento(e.target.value)} />
          </div>
        )}
        <div className="janela-campo">
          <label htmlFor="av-expira">Sai do mural em</label>
          <input
            id="av-expira"
            className="janela-input"
            type="datetime-local"
            required
            value={form.expiraEm}
            onChange={(e) => setForm(prev => ({ ...prev, expiraEm: e.target.value, expiraTocado: true }))}
          />
        </div>
      </div>

      <div className="janela-campo">
        <span className="janela-rotulo">Imagens <span>(até {MAX_IMAGENS})</span></span>
        <div className="av-imagens-form">
          {imagens.map(img => (
            <div key={img.id} className="av-thumb">
              <img src={img.url} alt="" />
              <button type="button" onClick={() => setImagens(prev => prev.filter(i => i.id !== img.id))} aria-label="Remover imagem" disabled={enviando}>
                <X size={12} />
              </button>
            </div>
          ))}
          {imagens.length < MAX_IMAGENS && (
            <button type="button" className="av-add-imagem" onClick={() => fileRef.current?.click()} disabled={enviando}>
              <ImagePlus size={20} />
              <span>Adicionar</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { adicionarImagens(e.target.files); e.target.value = ''; }} />
        </div>
      </div>

      {erro && <p className="janela-erro" role="alert">{erro}</p>}
    </Janela>
  );
};

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
const MuralAvisos = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isGestor = currentUser?.role === 'SINDICO' || currentUser?.role === 'MASTER';
  const abrirImagem = useVisualizadorImagem();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [erroCarga,   setErroCarga]   = useState(false);
  const [avisos,      setAvisos]      = useState([]);
  const [fotos,       setFotos]       = useState({});
  const [aba,         setAba]         = useState('ativos');
  // Atalho da Visão Geral (?novo=1) já abre o formulário de novo aviso
  const [criando,     setCriando]     = useState(() => isGestor && new URLSearchParams(window.location.search).get('novo') === '1');
  const [confirmar,   setConfirmar]   = useState(null);
  const [agora,       setAgora]       = useState(() => Date.now());

  // Link da notificação (?aviso=<id>): rola até o aviso e destaca
  const [params] = useSearchParams();
  const avisoDoLink = params.get('aviso');
  useEffect(() => {
    if (!avisoDoLink || avisos.length === 0) return;
    document.getElementById(`aviso-${avisoDoLink}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [avisoDoLink, avisos]);

  const carregar = useCallback(async () => {
    if (!currentUser?.condominio_id) return;
    setLoading(true);
    setErroCarga(false);
    // O RLS esconde os expirados de quem não é da gestão
    const { data, error } = await supabase
      .from('avisos')
      .select('*')
      .eq('condominio_id', currentUser.condominio_id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar avisos:', error);
      setErroCarga(true);
      setLoading(false);
      return;
    }
    const lista = data || [];

    const caminhos = lista.flatMap(a => a.imagens || []);
    if (caminhos.length > 0) {
      const { data: assinadas } = await supabase.storage.from('avisos').createSignedUrls(caminhos, 3600);
      setFotos(Object.fromEntries((assinadas || []).filter(a => a.signedUrl).map(a => [a.path, a.signedUrl])));
    }
    setAgora(Date.now());
    setAvisos(lista);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { carregar(); }, [carregar]);

  const ativos    = avisos.filter(a => new Date(a.expira_em).getTime() > agora);
  const expirados = avisos.filter(a => new Date(a.expira_em).getTime() <= agora);
  const lista     = aba === 'ativos' ? ativos : expirados;

  const encerrar = async (aviso) => {
    const { error } = await supabase.from('avisos').update({ expira_em: new Date().toISOString() }).eq('id', aviso.id);
    if (error) { alert('Não foi possível encerrar: ' + error.message); return; }
    carregar();
  };

  const excluir = async (aviso) => {
    const { error } = await supabase.from('avisos').delete().eq('id', aviso.id);
    if (error) { alert('Não foi possível excluir: ' + error.message); return; }
    if (aviso.imagens?.length) await supabase.storage.from('avisos').remove(aviso.imagens);
    setConfirmar(null);
    carregar();
  };

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Mural de Avisos</h2>
              <p className="header-date">Avisos e eventos do condomínio</p>
            </div>
          </div>
          <div className="header-right">
            <NotificationMenu />
            <div onClick={() => navigate('/perfil')} style={{ display:'flex', alignItems:'center', gap:'0.75rem', borderLeft:'1px solid #e2e8f0', paddingLeft:'1rem', cursor:'pointer' }}>
              <AvatarUsuario nome={currentUser?.name} foto={currentUser?.foto} tamanho={36} />
            </div>
          </div>
        </header>

        <ContextBanner />

        <div className="dashboard-content-scroll" style={{ backgroundColor: '#f8fafc' }}>
          <div className="av-container">

            <div className="av-barra">
              {isGestor ? (
                <div className="av-abas" role="tablist">
                  <button role="tab" aria-selected={aba === 'ativos'} className={aba === 'ativos' ? 'ativa' : ''} onClick={() => setAba('ativos')}>
                    No mural <span>{ativos.length}</span>
                  </button>
                  <button role="tab" aria-selected={aba === 'expirados'} className={aba === 'expirados' ? 'ativa' : ''} onClick={() => setAba('expirados')}>
                    Expirados <span>{expirados.length}</span>
                  </button>
                </div>
              ) : <span />}
              {isGestor && !criando && (
                <button className="av-btn av-btn-pri" onClick={() => setCriando(true)}>
                  <Plus size={16} /> Novo aviso ou evento
                </button>
              )}
            </div>

            {criando && (
              <NovoAviso
                condominioId={currentUser.condominio_id}
                onCancelar={() => setCriando(false)}
                onPublicado={() => { setCriando(false); setAba('ativos'); carregar(); }}
              />
            )}

            {loading ? (
              <div className="av-vazio"><RefreshCw size={30} className="av-girar" /><p>Carregando...</p></div>
            ) : erroCarga ? (
              <ErroCarregamento onTentar={carregar} />
            ) : lista.length === 0 ? (
              <div className="av-vazio">
                <Inbox size={40} />
                <h4>{aba === 'ativos' ? 'Nenhum aviso no mural agora' : 'Nenhum aviso expirado'}</h4>
                {aba === 'ativos' && isGestor && <p>Use "Novo aviso ou evento" para publicar.</p>}
              </div>
            ) : (
              <div className="av-lista">
                {lista.map(aviso => {
                  const evento = aviso.tipo === 'evento';
                  return (
                    <article
                      key={aviso.id}
                      id={`aviso-${aviso.id}`}
                      className={`av-card${evento ? ' av-card-evento' : ''}${String(aviso.id) === avisoDoLink ? ' av-destaque' : ''}`}
                    >
                      <header className="av-card-topo">
                        <span className={`av-tipo${evento ? ' av-tipo-evento' : ''}`}>
                          {evento ? <CalendarDays size={13} /> : <Megaphone size={13} />} {evento ? 'Evento' : 'Aviso'}
                        </span>
                        <span className="av-meta">{aviso.autor_nome} · {formatar(aviso.created_at)}</span>
                      </header>

                      <h3>{aviso.titulo}</h3>

                      {evento && aviso.data_evento && (
                        <div className="av-quando"><CalendarDays size={15} /> {formatar(aviso.data_evento)}</div>
                      )}

                      <p className="av-texto">{aviso.conteudo}</p>

                      {aviso.imagens?.length > 0 && (
                        <div className={`av-galeria av-galeria-${aviso.imagens.length}`}>
                          {aviso.imagens.map(caminho => (
                            fotos[caminho]
                              ? (
                                <button key={caminho} type="button" className="img-zoom" onClick={() => {
                                  const urls = aviso.imagens.map(c => fotos[c]).filter(Boolean);
                                  abrirImagem(urls, urls.indexOf(fotos[caminho]));
                                }}>
                                  <img src={fotos[caminho]} alt="" />
                                </button>
                              )
                              : <span key={caminho} className="av-foto-carregando" />
                          ))}
                        </div>
                      )}

                      <footer className="av-rodape">
                        <span className="av-expira"><Clock size={13} /> {aba === 'ativos' ? 'Sai do mural em' : 'Expirou em'} {formatar(aviso.expira_em)}</span>
                        {isGestor && (
                          <div className="av-acoes">
                            {aba === 'ativos' && (
                              <button className="av-link" onClick={() => encerrar(aviso)}><TimerOff size={14} /> Encerrar agora</button>
                            )}
                            {confirmar === aviso.id ? (
                              <>
                                <button className="av-link" onClick={() => setConfirmar(null)}>Cancelar</button>
                                <button className="av-link av-link-perigo" onClick={() => excluir(aviso)}>Confirmar exclusão</button>
                              </>
                            ) : (
                              <button className="av-link av-link-perigo" onClick={() => setConfirmar(aviso.id)}><Trash2 size={14} /> Excluir</button>
                            )}
                          </div>
                        )}
                      </footer>
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

export default MuralAvisos;
