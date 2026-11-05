import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu, CalendarDays, Clock, Sun, ChevronLeft, ChevronRight, Loader2, CalendarCheck, Inbox, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import AvatarUsuario from '../components/AvatarUsuario';
import ErroCarregamento from '../components/ErroCarregamento';
import Janela from '../components/Janela';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import {
  DIAS_SEMANA, DIAS_RESERVA, resumoDependencia, horaCurta, isoLocal, dataLonga,
} from '../utils/dependencias';
import './Dashboard.css';
import './Reservas.css';

// Reservas das dependências do condomínio (morador e síndico).
// Aba "Dependências": escolhe o espaço, o dia (até 60 dias à frente) e, se for por horário,
// a faixa de horário. O que já foi reservado aparece bloqueado. Aba "Minhas reservas": as
// próprias reservas, com "Cancelar" nas que ainda não começaram.

const ABAS = [{ key: 'dependencias', label: 'Dependências' }, { key: 'minhas', label: 'Minhas reservas' }];
const NOMES_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const agoraHHMM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

// ---------------------------------------------------------------------------
// Janela de reserva: calendário do mês + horários do dia escolhido
// ---------------------------------------------------------------------------
const JanelaReserva = ({ dep, onFechar, onReservada, somenteVer = false }) => {
  const hoje = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const limite = useMemo(() => { const d = new Date(hoje); d.setDate(d.getDate() + DIAS_RESERVA); return d; }, [hoje]);
  const [mes, setMes] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [ocupados, setOcupados] = useState(null); // { 'aaaa-mm-dd': Set(['08:00' | 'dia']) }
  const [dia, setDia] = useState(null);
  const [horario, setHorario] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregarOcupacao = useCallback(async () => {
    const { data, error } = await supabase.rpc('ocupacao_dependencia', {
      p_dependencia: dep.id, p_de: isoLocal(hoje), p_ate: isoLocal(limite),
    });
    if (error) { console.error('Erro ao carregar ocupação:', error); setErro('Não foi possível ver os dias ocupados.'); return; }
    const mapa = {};
    (data || []).forEach(o => { (mapa[o.data] ||= new Set()).add(o.inicio ? horaCurta(o.inicio) : 'dia'); });
    setOcupados(mapa);
  }, [dep.id, hoje, limite]);

  useEffect(() => { carregarOcupacao(); }, [carregarOcupacao]);

  const hojeIso = isoLocal(hoje);
  const slotPassou = (iso, inicio) => iso === hojeIso && inicio <= agoraHHMM();
  const situacaoDia = (d) => {
    if (d < hoje || d > limite) return 'fora';
    if (!dep.dias_semana.includes(d.getDay())) return 'fechado';
    const iso = isoLocal(d);
    const usados = ocupados?.[iso];
    if (dep.tipo === 'dia') return usados ? 'lotado' : 'livre';
    const livres = dep.horarios.filter(h => !usados?.has(h.inicio) && !slotPassou(iso, h.inicio));
    return livres.length === 0 ? 'lotado' : 'livre';
  };

  // Células do mês (começa no domingo)
  const celulas = useMemo(() => {
    const primeiro = new Date(mes);
    const inicio = new Date(primeiro); inicio.setDate(1 - primeiro.getDay());
    const diasNoMes = new Date(primeiro.getFullYear(), primeiro.getMonth() + 1, 0).getDate();
    const total = Math.ceil((primeiro.getDay() + diasNoMes) / 7) * 7; // só as semanas do mês
    return Array.from({ length: total }, (_, i) => { const d = new Date(inicio); d.setDate(inicio.getDate() + i); return d; });
  }, [mes]);
  const podeVoltar = mes > new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const podeAvancar = new Date(mes.getFullYear(), mes.getMonth() + 1, 1) <= limite;

  const confirmar = async () => {
    if (!dia || (dep.tipo === 'horario' && !horario) || enviando) return;
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.rpc('reservar_dependencia', {
      p_dependencia: dep.id, p_data: dia, p_inicio: dep.tipo === 'horario' ? horario : null,
    });
    setEnviando(false);
    if (error) {
      setErro(error.hint ? error.message : 'Não foi possível fazer a reserva.');
      if (error.hint === 'ocupado') { setHorario(null); carregarOcupacao(); }
      return;
    }
    onReservada();
  };

  const usadosDia = dia ? ocupados?.[dia] : null;
  const prontoParaConfirmar = !!dia && (dep.tipo === 'dia' || !!horario);

  return (
    <Janela
      icone={CalendarDays}
      titulo={`Reservar ${dep.nome}`}
      subtitulo={resumoDependencia(dep)}
      largura="grande"
      bloqueada={enviando}
      onFechar={onFechar}
      rodape={somenteVer
        ? <button type="button" className="janela-btn janela-btn-sec" onClick={onFechar}>Fechar</button>
        : <>
          <button type="button" className="janela-btn janela-btn-sec btn-cancelar" onClick={onFechar} disabled={enviando}>Cancelar</button>
          <button type="button" className="janela-btn janela-btn-pri" onClick={confirmar} disabled={!prontoParaConfirmar || enviando}>
            {enviando ? <><Loader2 size={16} className="janela-girando" /> Reservando...</> : <><CalendarCheck size={16} /> Confirmar reserva</>}
          </button>
        </>}
    >
      {!ocupados && !erro ? (
        <p className="rv-carregando"><Loader2 size={16} className="janela-girando" /> Carregando a agenda...</p>
      ) : (
        <>
          <div className="rv-cal">
            <div className="rv-cal-topo">
              <button type="button" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} disabled={!podeVoltar} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
              <strong>{(() => { const t = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1); })()}</strong>
              <button type="button" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} disabled={!podeAvancar} aria-label="Próximo mês"><ChevronRight size={18} /></button>
            </div>
            <div className="rv-cal-grade">
              {NOMES_SEMANA.map(n => <span key={n} className="rv-cal-semana">{n}</span>)}
              {celulas.map(d => {
                const iso = isoLocal(d);
                const doMes = d.getMonth() === mes.getMonth();
                const sit = situacaoDia(d);
                const escolhido = dia === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    className={`rv-dia rv-dia-${sit}${doMes ? '' : ' rv-dia-outro'}${escolhido ? ' rv-dia-escolhido' : ''}`}
                    disabled={sit !== 'livre' || !doMes}
                    onClick={() => { setDia(iso); setHorario(null); setErro(null); }}
                    title={sit === 'fechado' ? 'Fechada neste dia da semana' : sit === 'lotado' ? 'Já reservado' : undefined}
                  >
                    {doMes ? d.getDate() : ''}
                  </button>
                );
              })}
            </div>
            <div className="rv-legenda">
              <span><i className="rv-leg-livre" />Disponível</span>
              <span><i className="rv-leg-lotado" />Reservado</span>
              <span><i className="rv-leg-fechado" />Fechada</span>
            </div>
          </div>

          {dia && (
            <div className="rv-escolha">
              <span className="rv-escolha-dia">{dataLonga(dia)}</span>
              {dep.tipo === 'dia' ? (
                <p className="rv-escolha-texto"><Sun size={15} /> Reserva do dia inteiro.</p>
              ) : (
                <div className="rv-horarios">
                  {dep.horarios.map(h => {
                    const ocupado = usadosDia?.has(h.inicio);
                    const passou = slotPassou(dia, h.inicio);
                    return (
                      <button
                        key={h.inicio}
                        type="button"
                        className={`rv-horario${horario === h.inicio ? ' ativo' : ''}`}
                        disabled={ocupado || passou}
                        onClick={() => setHorario(h.inicio)}
                      >
                        <Clock size={14} /> {h.inicio} às {h.fim}
                        {(ocupado || passou) && <small>{ocupado ? 'reservado' : 'já passou'}</small>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
      {erro && <p className="janela-erro" role="alert">{erro}</p>}
    </Janela>
  );
};

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
const Reservas = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const condominioId = currentUser?.condominio_id;
  const meuId = currentUser?.id;
  // O Master abre a tela para acompanhar (vê a agenda), mas quem reserva são moradores e síndico
  const ehMaster = currentUser?.role === 'MASTER';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aba, setAba] = useState('dependencias');
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);
  const [dependencias, setDependencias] = useState([]);
  const [minhas, setMinhas] = useState([]);
  const [reservando, setReservando] = useState(null);
  const [cancelando, setCancelando] = useState(null); // reserva a confirmar
  const [cancelandoEnvio, setCancelandoEnvio] = useState(false);
  const [aviso, setAviso] = useState(null);

  const carregar = useCallback(async () => {
    if (!condominioId || !meuId) return;
    const [{ data, error }, { data: res, error: erroRes }] = await Promise.all([
      supabase.from('dependencias').select('id, nome, tipo, dias_semana, horarios')
        .eq('condominio_id', condominioId).eq('ativa', true).order('nome'),
      supabase.from('reservas').select('id, dependencia_id, data, inicio, fim, status, created_at, dependencias(nome, tipo)')
        .eq('morador_id', meuId).order('data', { ascending: false }).order('inicio', { ascending: false }),
    ]);
    setErroCarga(!!(error || erroRes));
    if (error || erroRes) { console.error('Erro ao carregar reservas:', error || erroRes); setCarregando(false); return; }
    setDependencias(data || []);
    setMinhas(res || []);
    setCarregando(false);
  }, [condominioId, meuId]);

  useEffect(() => { carregar(); }, [carregar]);

  const hojeIso = isoLocal(new Date());
  const aindaVai = (r) => r.status === 'ativa' && (r.data > hojeIso || (r.data === hojeIso && (!r.inicio || horaCurta(r.inicio) > agoraHHMM())));
  const proximas = minhas.filter(aindaVai).sort((a, b) => (a.data + (a.inicio || '')).localeCompare(b.data + (b.inicio || '')));
  const historico = minhas.filter(r => !aindaVai(r));

  const cancelar = async () => {
    if (!cancelando || cancelandoEnvio) return;
    setCancelandoEnvio(true);
    const { error } = await supabase.rpc('cancelar_reserva', { p_reserva: cancelando.id });
    setCancelandoEnvio(false);
    if (error) {
      setAviso({ tipo: 'erro', titulo: 'Não foi possível cancelar', texto: error.hint ? error.message : 'Tente novamente.' });
    } else {
      setAviso({ tipo: 'sucesso', titulo: 'Reserva cancelada', texto: 'O dia/horário ficou livre para outros moradores.' });
    }
    setCancelando(null);
    carregar();
  };

  const linhaReserva = (r, podeCancelar) => (
    <li key={r.id} className={`rv-minha${r.status === 'cancelada' ? ' rv-minha-cancelada' : ''}`}>
      <span className="rv-minha-icone">{r.inicio ? <Clock size={16} /> : <Sun size={16} />}</span>
      <span className="rv-minha-texto">
        <strong>{r.dependencias?.nome || 'Dependência'}</strong>
        <small>{dataLonga(r.data)} · {r.inicio ? `${horaCurta(r.inicio)} às ${horaCurta(r.fim)}` : 'dia inteiro'}</small>
      </span>
      {r.status === 'cancelada'
        ? <span className="rv-selo rv-selo-cancelada">Cancelada</span>
        : podeCancelar
          ? <button type="button" className="sd-btn btn-cancelar rv-btn-cancelar" onClick={() => setCancelando(r)}><X size={14} /> Cancelar</button>
          : <span className="rv-selo">Concluída</span>}
    </li>
  );

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Reservas</h2>
              <p className="header-date">Reserve o salão, a churrasqueira e outras dependências do condomínio</p>
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

        <div className="dashboard-content-scroll">
          <div className="rv-container">
            <div className="ms-abas" role="tablist">
              {ABAS.map(a => (
                <button key={a.key} type="button" role="tab" aria-selected={aba === a.key} className={aba === a.key ? 'ativa' : ''} onClick={() => setAba(a.key)}>
                  {a.label} <span>{a.key === 'dependencias' ? dependencias.length : proximas.length}</span>
                </button>
              ))}
            </div>

            {ehMaster && (
              <p className="rv-aviso-master">
                Quem reserva são os moradores e o síndico. Aqui você vê a agenda de cada dependência; a lista de quem reservou fica em{' '}
                <button type="button" className="nc-link-botao" onClick={() => navigate('/dependencias')}>Dependências</button>.
              </p>
            )}

            {carregando ? (
              <p className="rv-carregando"><Loader2 size={18} className="janela-girando" /> Carregando...</p>
            ) : erroCarga ? (
              <ErroCarregamento onTentar={() => { setCarregando(true); carregar(); }} />
            ) : aba === 'dependencias' ? (
              dependencias.length === 0 ? (
                <div className="rv-vazio"><Inbox size={36} /><h4>Nenhuma dependência para reservar</h4><p>Quando a administração cadastrar o salão, a churrasqueira ou outros espaços, eles aparecem aqui.</p></div>
              ) : (
                <div className="rv-grade">
                  {dependencias.map(d => (
                    <article key={d.id} className="rv-dep">
                      <div className="rv-dep-topo">
                        <span className="rv-dep-icone">{d.tipo === 'dia' ? <Sun size={18} /> : <Clock size={18} />}</span>
                        <div className="rv-dep-textos">
                          <h3 title={d.nome}>{d.nome}</h3>
                          <p>{d.tipo === 'dia' ? 'Reserva do dia inteiro' : 'Reserva por horário'}</p>
                        </div>
                      </div>
                      <div className="rv-dep-dias">
                        {DIAS_SEMANA.map(s => <span key={s.n} className={d.dias_semana.includes(s.n) ? 'aberto' : ''} title={s.longo}>{s.curto}</span>)}
                      </div>
                      <p className="rv-dep-horarios">
                        {d.tipo === 'horario' ? d.horarios.map(h => `${h.inicio}–${h.fim}`).join(' · ') : 'Disponível o dia todo'}
                      </p>
                      <button type="button" className="btn-hab rv-dep-btn" onClick={() => setReservando(d)}>
                        <CalendarDays size={15} /> {ehMaster ? 'Ver agenda' : 'Reservar'}
                      </button>
                    </article>
                  ))}
                </div>
              )
            ) : (
              <div className="rv-minhas">
                <section className="rv-bloco">
                  <h3>Próximas</h3>
                  {proximas.length === 0
                    ? <p className="rv-vazio-texto">Você não tem reservas marcadas. Escolha uma dependência na aba "Dependências".</p>
                    : <ul>{proximas.map(r => linhaReserva(r, true))}</ul>}
                </section>
                {historico.length > 0 && (
                  <section className="rv-bloco">
                    <h3>Anteriores e canceladas</h3>
                    <ul>{historico.map(r => linhaReserva(r, false))}</ul>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {reservando && (
        <JanelaReserva
          dep={reservando}
          somenteVer={ehMaster}
          onFechar={() => setReservando(null)}
          onReservada={() => {
            setReservando(null);
            setAba('minhas');
            setAviso({ tipo: 'sucesso', titulo: 'Reserva feita', texto: `${reservando.nome} está reservado para você. Para desistir, cancele em "Minhas reservas".` });
            carregar();
          }}
        />
      )}

      {cancelando && (
        <Janela
          icone={X}
          tom="perigo"
          titulo="Cancelar reserva?"
          subtitulo={`${cancelando.dependencias?.nome || 'Dependência'} · ${dataLonga(cancelando.data)}${cancelando.inicio ? ` · ${horaCurta(cancelando.inicio)} às ${horaCurta(cancelando.fim)}` : ''}`}
          largura="pequena"
          bloqueada={cancelandoEnvio}
          onFechar={() => setCancelando(null)}
          rodape={<>
            <button type="button" className="janela-btn janela-btn-sec" onClick={() => setCancelando(null)} disabled={cancelandoEnvio}>Manter reserva</button>
            <button type="button" className="janela-btn janela-btn-perigo" onClick={cancelar} disabled={cancelandoEnvio}>
              {cancelandoEnvio ? <><Loader2 size={16} className="janela-girando" /> Cancelando...</> : 'Cancelar reserva'}
            </button>
          </>}
        >
          <p className="janela-texto">O dia/horário fica livre na hora para outros moradores reservarem.</p>
        </Janela>
      )}

      {aviso && (
        <Janela
          icone={aviso.tipo === 'erro' ? X : CalendarCheck}
          tom={aviso.tipo === 'erro' ? 'erro' : 'sucesso'}
          titulo={aviso.titulo}
          largura="pequena"
          onFechar={() => setAviso(null)}
          fecharAoClicarFora
          rodape={<button type="button" className="janela-btn janela-btn-sec" onClick={() => setAviso(null)}>Fechar</button>}
        >
          <p className="janela-texto">{aviso.texto}</p>
        </Janela>
      )}
    </div>
  );
};

export default Reservas;
