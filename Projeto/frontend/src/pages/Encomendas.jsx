import React, { useState, useEffect, useCallback, useRef } from 'react';
import BotaoCamera from '../components/CameraFoto';
import {
  Menu, RefreshCw, Package, CalendarDays, UserCheck, PenLine, Search, Plus, Image as ImageIcon,
  Loader2, Check, PackageCheck, ShieldCheck,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import ErroCarregamento from '../components/ErroCarregamento';
import Janela from '../components/Janela';
import SeletorUnidade from '../components/SeletorUnidade';
import { Pictograma } from '../components/Placa';
import { useAuth } from '../contexts/AuthContext';
import { useVisualizadorImagem } from '../contexts/visualizadorImagem';
import { supabase } from '../backend/supabaseClient';
import { EVENTO_CONTADORES } from '../hooks/useContadoresGestao';
import { reduzirImagem } from '../utils/imagem';
import { combinaBusca } from '../utils/busca';
import { protocoloEncomenda } from '../utils/protocolo';
import { unidadeTexto } from '../utils/reclamacao';
import { VAZIO_UNIDADE, apartamentoEscolhido } from '../utils/unidades';
import './Dashboard.css';
import './OcorrenciasConcluidas.css';
import './GestaoFuncionarios.css';
import './Encomendas.css';

// Livro de encomendas da portaria.
// modo "livro": porteiro registra; porteiro, síndico e master consultam tudo (casos de perda).
// modo "minhas": o morador vê as do próprio apartamento e confirma a retirada (assinatura eletrônica).

const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
// valor do <input type="datetime-local"> no horário local
const agoraLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const FORM_VAZIO = { unidade: VAZIO_UNIDADE, destinatario: '', chegou: '', foto: null, observacao: '' };

const Encomendas = ({ modo }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const abrirImagem = useVisualizadorImagem();
  const [params] = useSearchParams();
  const livro = modo === 'livro';
  const ehPorteiro = currentUser?.role === 'FUNCIONARIO' && currentUser?.porteiro;
  const semAcesso = livro && currentUser?.role === 'FUNCIONARIO' && !ehPorteiro;
  const condominioId = currentUser?.condominio_id;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [erro,     setErro]     = useState(false);
  const [itens,    setItens]    = useState([]);
  const [fotos,    setFotos]    = useState({});
  const [aba,      setAba]      = useState('pendentes');
  const [busca,    setBusca]    = useState('');
  const [confirmar, setConfirmar] = useState(null); // encomenda a confirmar retirada
  const [registrando, setRegistrando] = useState(false);
  const [form,     setForm]     = useState(FORM_VAZIO);
  const [blocos,   setBlocos]   = useState(null);
  const [ocupado,  setOcupado]  = useState(false);
  const [erroAcao, setErroAcao] = useState(null);
  const galeriaRef = useRef(null);

  const carregar = useCallback(async () => {
    if (!condominioId || semAcesso) { setLoading(false); return; }
    let q = supabase.from('encomendas').select('*').eq('condominio_id', condominioId).order('chegou_em', { ascending: false });
    // O síndico também mora no prédio: em "minhas" só entra o apartamento dele
    if (!livro) q = q.ilike('bloco', (currentUser.bloco || '').trim()).ilike('apartamento', (currentUser.apartamento || '').trim());
    const { data, error } = await q;
    if (error) {
      console.error('Erro ao carregar encomendas:', error);
      setErro(true);
      setLoading(false);
      return;
    }
    setErro(false);
    setItens(data || []);
    setLoading(false);
    const caminhos = [...new Set((data || []).map(e => e.foto).filter(Boolean))];
    if (caminhos.length) {
      const { data: urls } = await supabase.storage.from('encomendas').createSignedUrls(caminhos, 3600);
      setFotos(Object.fromEntries((urls || []).filter(u => u.signedUrl).map(u => [u.path, u.signedUrl])));
    }
  }, [condominioId, livro, semAcesso, currentUser?.bloco, currentUser?.apartamento]);

  useEffect(() => { carregar(); }, [carregar]);

  // Link da notificação (?encomenda=id): abre a subtela certa e rola até o cartão
  const idDoLink = params.get('encomenda');
  useEffect(() => {
    if (!idDoLink || !itens.length) return;
    const alvo = itens.find(e => String(e.id) === idDoLink);
    if (!alvo) return;
    setAba(alvo.retirada_em ? 'retiradas' : 'pendentes');
    setTimeout(() => document.getElementById(`enc-${alvo.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }, [idDoLink, itens]);

  const pendentes = itens.filter(e => !e.retirada_em);
  const retiradas = itens.filter(e => e.retirada_em).sort((a, b) => new Date(b.retirada_em) - new Date(a.retirada_em));
  const visiveis = (aba === 'pendentes' ? pendentes : retiradas).filter(e => combinaBusca(busca, [
    unidadeTexto(e.bloco, e.apartamento), e.apartamento, e.destinatario, e.registrada_por_nome, e.retirada_por_nome, e.observacao,
    protocoloEncomenda(e.id, e.registrada_em),
  ]));

  // ---------- Registrar (porteiro) ----------
  const abrirRegistro = () => {
    setForm({ ...FORM_VAZIO, chegou: agoraLocal() });
    setErroAcao(null);
    setRegistrando(true);
    if (blocos === null) {
      supabase.rpc('blocos_do_condominio', { p_condominio_id: condominioId })
        .then(({ data }) => setBlocos(data || []));
    }
  };
  const escolherFoto = (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (arquivo) setForm(prev => ({ ...prev, foto: arquivo, previa: URL.createObjectURL(arquivo) }));
  };
  const semBlocos = blocos !== null && blocos.length === 0;
  const bloco = form.unidade.bloco;
  const apartamento = apartamentoEscolhido(form.unidade);

  const registrar = async (e) => {
    e.preventDefault();
    if (ocupado || semBlocos) return;
    if (!apartamento) return setErroAcao('Escolha o bloco, o andar e o apartamento.');
    if (!form.destinatario.trim()) return setErroAcao('Informe para quem é a encomenda.');
    if (!form.foto) return setErroAcao('Tire ou escolha a foto do pacote.');
    setOcupado(true);
    setErroAcao(null);
    try {
      const arquivo = await reduzirImagem(form.foto);
      const caminho = `${condominioId}/${crypto.randomUUID()}.${arquivo.name.split('.').pop()?.toLowerCase() || 'jpg'}`;
      const { error: erroFoto } = await supabase.storage.from('encomendas').upload(caminho, arquivo);
      if (erroFoto) throw new Error(`Falha ao enviar a foto: ${erroFoto.message}`);
      const { error } = await supabase.rpc('registrar_encomenda', {
        p_bloco: bloco, p_apartamento: apartamento, p_destinatario: form.destinatario.trim(),
        p_chegou_em: new Date(form.chegou).toISOString(), p_foto: caminho, p_observacao: form.observacao.trim() || null,
      });
      if (error) throw error;
      setRegistrando(false);
      setAba('pendentes');
      carregar();
    } catch (err) {
      setErroAcao(err.message || 'Não foi possível registrar. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  };

  // ---------- Confirmar retirada (morador) ----------
  const confirmarRetirada = async () => {
    if (!confirmar || ocupado) return;
    setOcupado(true);
    setErroAcao(null);
    const { error } = await supabase.rpc('confirmar_retirada_encomenda', { p_encomenda_id: confirmar.id });
    setOcupado(false);
    if (error) return setErroAcao(error.message);
    setConfirmar(null);
    window.dispatchEvent(new Event(EVENTO_CONTADORES)); // atualiza a bolinha do menu
    carregar();
  };

  const titulo = livro ? 'Livro de Encomendas' : 'Minhas Encomendas';
  const descricao = livro
    ? (ehPorteiro ? 'Registre cada pacote que chega; o apartamento inteiro é avisado' : 'Tudo o que chegou na portaria e quem retirou')
    : 'Pacotes do seu apartamento. Retire na portaria e confirme aqui';

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">{titulo}</h2>
              <p className="header-date">{descricao}</p>
            </div>
          </div>
          <div className="header-right">
            <NotificationMenu />
            <div onClick={() => navigate('/perfil')} style={{ display:'flex', alignItems:'center', gap:'0.75rem', borderLeft:'1px solid #e2e8f0', paddingLeft:'1rem', cursor:'pointer' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--hab-laranja)', color:'var(--hab-tinta)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        <ContextBanner />

        <div className="dashboard-content-scroll">
          <div className="oc-container">
            {semAcesso ? (
              <div className="oc-vazio"><ShieldCheck size={40} /><h4>Só o porteiro acessa o livro de encomendas</h4></div>
            ) : (<>
            <div className="gf-barra">
              {livro && (
                <div className="gf-busca">
                  <Search size={16} />
                  <input type="text" placeholder="Buscar por apartamento, nome ou protocolo..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
              )}
              {ehPorteiro && (
                <button className="gf-btn-pri" onClick={abrirRegistro}><Plus size={16} /> Registrar encomenda</button>
              )}
            </div>

            <div className="oc-abas" role="tablist">
              {[['pendentes', livro ? 'Aguardando retirada' : 'Para retirar', pendentes.length], ['retiradas', 'Retiradas', retiradas.length]].map(([k, rotulo, n]) => (
                <button key={k} role="tab" aria-selected={aba === k} className={aba === k ? 'ativa' : ''} onClick={() => setAba(k)}>
                  {rotulo} <span>{n}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="oc-vazio"><RefreshCw size={32} className="oc-spin" /><p>Carregando...</p></div>
            ) : erro ? (
              <ErroCarregamento onTentar={carregar} />
            ) : visiveis.length === 0 ? (
              <div className="oc-vazio">
                <Package size={40} />
                <h4>{busca ? 'Nenhuma encomenda encontrada'
                  : aba === 'pendentes' ? (livro ? 'Nenhuma encomenda esperando retirada' : 'Nenhuma encomenda para retirar')
                  : 'Nenhuma encomenda retirada ainda'}</h4>
              </div>
            ) : (
              <div className="placas-grade">
                {visiveis.map(e => (
                  <article key={e.id} id={`enc-${e.id}`} className={`placa placa-entra enc-placa${String(e.id) === idDoLink ? ' enc-destaque' : ''}`}>
                    <div className="placa-cabeca">
                      <div className="placa-local">
                        <span className="placa-rotulo">Unidade</span>
                        <span className="placa-valor placa-valor-longo">{unidadeTexto(e.bloco, e.apartamento)}</span>
                      </div>
                      <Pictograma categoria="encomenda" titulo="Encomenda" />
                    </div>

                    <div className="placa-corpo enc-corpo">
                      {e.foto && fotos[e.foto] ? (
                        <button type="button" className="enc-foto" onClick={() => abrirImagem([fotos[e.foto]], 0)} aria-label="Ver foto do pacote">
                          <img src={fotos[e.foto]} alt="Foto do pacote" loading="lazy" />
                        </button>
                      ) : (
                        <span className="enc-foto enc-foto-vazia"><Package size={26} /></span>
                      )}
                      <div className="enc-info">
                        <h3 className="placa-titulo">Para {e.destinatario}</h3>
                        <div className="placa-meta enc-meta">
                          <span><CalendarDays size={13} /> Chegou {dataHora(e.chegou_em)}</span>
                          <span title="Assinatura eletrônica do porteiro"><PenLine size={13} /> Recebida por {e.registrada_por_nome}</span>
                        </div>
                        {e.observacao && <p className="placa-texto enc-obs" title={e.observacao}>{e.observacao}</p>}
                      </div>
                    </div>

                    {e.retirada_em && (
                      <p className="enc-assinatura" title="Assinatura eletrônica de quem retirou">
                        <UserCheck size={15} />
                        <span>Retirada por <strong>{e.retirada_por_nome}</strong> em {dataHora(e.retirada_em)}</span>
                      </p>
                    )}

                    {!livro && !e.retirada_em && (
                      <div className="placa-acoes enc-acoes">
                        <button type="button" className="btn-hab" onClick={() => { setErroAcao(null); setConfirmar(e); }}>
                          <PackageCheck size={16} /> Confirmar retirada
                        </button>
                      </div>
                    )}

                    <div className={`placa-faixa ${e.retirada_em ? 'st-resolvida' : 'st-aberta'}`}>
                      <span className="placa-faixa-status">{e.retirada_em ? 'Retirada' : 'Na portaria'}</span>
                      <span className="placa-faixa-protocolo">{protocoloEncomenda(e.id, e.registrada_em)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
            </>)}
          </div>
        </div>
      </main>

      {registrando && (
        <Janela
          as="form"
          onSubmit={registrar}
          icone={Package}
          titulo="Registrar encomenda"
          subtitulo="Todos os moradores do apartamento são avisados."
          largura="grande"
          bloqueada={ocupado}
          onFechar={() => setRegistrando(false)}
          rodape={<>
            <button type="button" className="janela-btn janela-btn-sec btn-cancelar" onClick={() => setRegistrando(false)} disabled={ocupado}>Cancelar</button>
            <button type="submit" className="janela-btn janela-btn-pri" disabled={ocupado}>
              {ocupado ? <><Loader2 size={16} className="janela-girando" /> Registrando...</> : <><Check size={16} /> Registrar e avisar</>}
            </button>
          </>}
        >
          {semBlocos ? (
            <p className="janela-erro" role="alert">O condomínio ainda não tem blocos cadastrados. Peça ao Master para cadastrar em "Blocos do Condomínio".</p>
          ) : (
            <div className="janela-grade">
              <SeletorUnidade
                blocos={blocos || []}
                valor={form.unidade}
                onChange={(unidade) => setForm(prev => ({ ...prev, unidade }))}
                idBase="enc"
                desativado={ocupado}
                carregando={blocos === null}
                classes={{ grupo: 'janela-campo', select: 'janela-input' }}
              />
            </div>
          )}

          <div className="janela-grade">
            <div className="janela-campo">
              <label htmlFor="enc-dest">Para quem é (nome no pacote)</label>
              <input id="enc-dest" className="janela-input" maxLength={120} value={form.destinatario} onChange={(ev) => setForm(prev => ({ ...prev, destinatario: ev.target.value }))} />
            </div>
            <div className="janela-campo">
              <label htmlFor="enc-chegou">Data e horário de chegada</label>
              <input id="enc-chegou" type="datetime-local" className="janela-input" max={agoraLocal()} value={form.chegou} onChange={(ev) => setForm(prev => ({ ...prev, chegou: ev.target.value }))} />
            </div>
          </div>

          <div className="janela-campo">
            <span className="enc-rotulo">Foto do pacote</span>
            <input ref={galeriaRef} type="file" accept="image/*" onChange={escolherFoto} hidden />
            <div className="enc-foto-escolha">
              {form.previa && <img src={form.previa} alt="Prévia da foto do pacote" />}
              <div className="enc-foto-botoes">
                <BotaoCamera className="enc-botao" disabled={ocupado} onFoto={(f) => setForm(prev => ({ ...prev, foto: f, previa: URL.createObjectURL(f) }))} />
                <button type="button" className="enc-botao" onClick={() => galeriaRef.current.click()} disabled={ocupado}><ImageIcon size={16} /> Galeria</button>
              </div>
            </div>
          </div>

          <div className="janela-campo">
            <label htmlFor="enc-obs">Observação (opcional)</label>
            <input id="enc-obs" className="janela-input" maxLength={300} placeholder="Ex.: Correios, caixa média, frágil" value={form.observacao} onChange={(ev) => setForm(prev => ({ ...prev, observacao: ev.target.value }))} />
          </div>

          <p className="janela-texto enc-aviso"><PenLine size={14} /> Ao registrar, fica gravado que <strong>{currentUser?.name}</strong> recebeu esta encomenda, com data e hora (assinatura eletrônica).</p>
          {erroAcao && <p className="janela-erro" role="alert">{erroAcao}</p>}
        </Janela>
      )}

      {confirmar && (
        <Janela
          icone={PackageCheck}
          titulo="Confirmar retirada?"
          largura="pequena"
          bloqueada={ocupado}
          onFechar={() => setConfirmar(null)}
          rodape={<>
            <button type="button" className="janela-btn janela-btn-sec btn-cancelar" onClick={() => setConfirmar(null)} disabled={ocupado}>Cancelar</button>
            <button type="button" className="janela-btn janela-btn-pri" onClick={confirmarRetirada} disabled={ocupado}>
              {ocupado ? <><Loader2 size={16} className="janela-girando" /> Confirmando...</> : <><Check size={16} /> Confirmo que retirei</>}
            </button>
          </>}
        >
          <p className="janela-texto">
            Confirme só depois de pegar o pacote para <strong>{confirmar.destinatario}</strong> na portaria
            ({protocoloEncomenda(confirmar.id, confirmar.registrada_em)}).
          </p>
          <p className="janela-texto enc-aviso">
            <PenLine size={14} /> Fica registrado que <strong>{currentUser?.name}</strong> retirou esta encomenda agora. Isso vale como
            sua assinatura eletrônica e não pode ser desfeito.
          </p>
          {erroAcao && <p className="janela-erro" role="alert">{erroAcao}</p>}
        </Janela>
      )}
    </div>
  );
};

export default Encomendas;
