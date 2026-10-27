import React, { useState } from 'react';
import { STATUS_COR, classeStatus } from '../utils/statusOcorrencia';
import { FaixaStatus, Pictograma } from '../components/Placa';
import { placaDaOcorrencia } from '../utils/placa';
import ErroCarregamento from '../components/ErroCarregamento';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Menu, CheckCircle2, BarChart3, X, Send, ShieldAlert,
  MapPin, FileText, User, ChevronRight, Inbox, Users,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
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

const CATEGORIA_LABEL = {
  'hidraulica':   'Hidráulica',
  'manutencao':   'Manutenção',
  'limpeza':      'Limpeza',
  'jardinagem':   'Jardinagem',
  'seguranca':    'Segurança',
  'areas_comuns': 'Áreas Comuns',
  'estrutural':   'Estrutural',
  'barulho':      'Barulho/Perturbação',
  'garagem':      'Garagem/Estacionamento',
};

// Tipos de reclamação (mesmos valores da tela Nova Reclamação)
const TIPO_RECLAMACAO = {
  barulho: 'Barulho fora do horário',
  lixo: 'Descarte irregular de lixo',
  estacionamento: 'Uso indevido de vaga',
  pets: 'Problemas com pets',
  outro: 'Outro tipo',
};

// A reclamação é gravada como texto: "Tipo de Violação: x\nData: aaaa-mm-dd\nHora: hh:mm\n\nDescrição do Morador: ..."
const lerReclamacao = (txt = '') => {
  const pega = (rotulo) => (String(txt).match(new RegExp(`${rotulo}:[ \\t]*(.*)`))?.[1] || '').trim();
  const tipo = pega('Tipo de Violação');
  const [a, m, d] = pega('Data').split('-');
  const hora = pega('Hora');
  return {
    tipo: TIPO_RECLAMACAO[tipo] || (tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'Reclamação'),
    quando: d ? `${d}/${m}/${a}${hora ? ` · ${hora}` : ''}` : '',
    texto: (String(txt).split('Descrição do Morador:')[1] ?? txt).trim(),
  };
};

const iniciais = (nome = '') => nome.trim().split(/\s+/).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('') || '?';

const heatmapDays  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const heatmapTimes = ['08h','10h','12h','14h','16h','18h','20h'];


// ── Indicadores calculados das ocorrências reais (pendência 16) ──
const DIA_MS = 864e5;
const RAMPA_LARANJA = ['#f47920', '#f6924a', '#f8ab73', '#fbc49d', '#fddcc6', '#fdeadb'];

// Aberturas e conclusões por semana, nas últimas 8 semanas
const calcularEvolucao = (ocs) => {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(hoje.getTime() - 7 * 7 * DIA_MS - hoje.getDay() * DIA_MS);
  return Array.from({ length: 8 }, (_, i) => {
    const de = inicio.getTime() + i * 7 * DIA_MS, ate = de + 7 * DIA_MS;
    const dentro = (d) => d && new Date(d).getTime() >= de && new Date(d).getTime() < ate;
    return {
      name: new Date(de).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      abertas: ocs.filter(o => dentro(o.created_at)).length,
      resolvidas: ocs.filter(o => dentro(o.concluida_em)).length,
    };
  });
};

// Total por categoria (as 5 maiores + "Outras")
const calcularCategorias = (ocs) => {
  const cont = {};
  ocs.forEach(o => { cont[o.categoria] = (cont[o.categoria] || 0) + 1; });
  const ord = Object.entries(cont).sort((a, b) => b[1] - a[1]);
  const top = ord.slice(0, 5).map(([slug, value]) => ({ name: CATEGORIA_LABEL[slug] || slug || 'Outras', value }));
  const resto = ord.slice(5).reduce((t, [, v]) => t + v, 0);
  if (resto) top.push({ name: 'Outras', value: resto });
  return top.map((c, i) => ({ ...c, fill: RAMPA_LARANJA[i] }));
};

// Dia da semana × faixa de horário em que as ocorrências foram abertas (nível 0–4)
const calcularMapaCalor = (ocs) => {
  const m = Array.from({ length: 7 }, () => Array(7).fill(0));
  ocs.forEach(o => {
    const d = new Date(o.created_at);
    const dia = (d.getDay() + 6) % 7; // segunda = 0
    const faixa = Math.min(6, Math.max(0, Math.round((d.getHours() - 8) / 2)));
    m[dia][faixa] += 1;
  });
  const max = Math.max(1, ...m.flat());
  return { contagem: m, nivel: m.map(l => l.map(v => (v ? Math.max(1, Math.ceil((v / max) * 4)) : 0))) };
};

// Em andamento há mais de 2 dias (no lugar do "SLA" de exemplo)
const calcularParadas = (ocs) => ocs
  .filter(o => o.status === 'Em Andamento' && o.andamento_em && Date.now() - new Date(o.andamento_em).getTime() > 2 * DIA_MS)
  .map(o => ({
    id: o.id, titulo: o.titulo, categoria: o.categoria,
    responsavel: o.Funcionarios?.nome || o.andamento_por_nome || '',
    dias: Math.floor((Date.now() - new Date(o.andamento_em).getTime()) / DIA_MS),
  }))
  .sort((a, b) => b.dias - a.dias);

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

// ---------------------------------------------------------------------------
// Cartão do painel: cabeçalho, corpo e pé alinhados entre os cartões vizinhos
// ---------------------------------------------------------------------------
const Cartao = ({ titulo, sub, extra, children, pe, className = '' }) => (
  <section className={`sd-card ${className}`}>
    <header className="sd-card-cabeca">
      <div className="sd-card-cabeca-textos">
        <h3 className="sd-card-titulo">{titulo}</h3>
        {sub && <p className="sd-card-sub">{sub}</p>}
      </div>
      {extra}
    </header>
    <div className="sd-card-corpo">{children}</div>
    {pe && <footer className="sd-card-pe">{pe}</footer>}
  </section>
);

const Vazio = ({ icone, titulo, texto }) => {
  const Icone = icone;
  return (
  <div className="sd-vazio">
    <Icone size={22} strokeWidth={1.8} />
    <strong>{titulo}</strong>
    {texto && <span>{texto}</span>}
  </div>
  );
};

const LIMITE_LISTA = 5;   // linhas nos cartões de atenção (iguais nos dois, para alinhar)
const PASSO_REGISTROS = 8;

// ---------------------------------------------------------------------------
// Registros recentes — ocorrências e reclamações em abas, linhas em colunas fixas
// ---------------------------------------------------------------------------
const RegistrosRecentes = ({ ocorrencias, reclamacoes, onGerenciar, onAbrirReclamacao, respondidas, onVerMural }) => {
  const [aba, setAba] = useState('ocorrencias');
  const [mostrar, setMostrar] = useState(PASSO_REGISTROS);
  const lista = aba === 'ocorrencias' ? ocorrencias : reclamacoes;
  const visiveis = lista.slice(0, mostrar);
  const restantes = lista.length - visiveis.length;
  const trocarAba = (k) => { setAba(k); setMostrar(PASSO_REGISTROS); };

  const abas = (
    <div className="ms-abas sd-abas" role="tablist">
      {[['ocorrencias', 'Ocorrências', ocorrencias.length], ['reclamacoes', 'Reclamações', reclamacoes.length]].map(([k, rot, n]) => (
        <button key={k} type="button" role="tab" aria-selected={aba === k} className={aba === k ? 'ativa' : ''} onClick={() => trocarAba(k)}>
          {rot} <span>{n}</span>
        </button>
      ))}
    </div>
  );

  const pe = (restantes > 0 || aba === 'ocorrencias') && (
    <>
      {restantes > 0
        ? <button type="button" className="sd-link" onClick={() => setMostrar(m => m + PASSO_REGISTROS)}>Mostrar mais ({restantes})</button>
        : <span />}
      {aba === 'ocorrencias' && <button type="button" className="sd-link" onClick={onVerMural}>Abrir o Mural de Ocorrências <ChevronRight size={15} /></button>}
    </>
  );

  return (
    <Cartao
      className="sd-registros"
      titulo={aba === 'ocorrencias' ? 'Ocorrências mais recentes' : 'Reclamações recebidas'}
      sub={aba === 'ocorrencias' ? 'Do mural e pessoais, das mais novas para as mais antigas' : 'Só você vê. Abra para ler e responder ao morador.'}
      extra={abas}
      pe={pe}
    >
      {aba === 'ocorrencias' ? (
        ocorrencias.length === 0 ? <Vazio icone={Inbox} titulo="Nenhuma ocorrência registrada" /> : (
          <div className="sd-tabela sd-tabela-oc" role="table">
            <div className="sd-tr sd-th" role="row">
              <span role="columnheader">Ocorrência</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Aberta em</span>
              <span role="columnheader">Responsável</span>
              <span role="columnheader" className="sd-sr">Ação</span>
            </div>
            {visiveis.map(o => (
              <div key={o.id} className="sd-tr" role="row">
                <div className="sd-td sd-td-oc" role="cell">
                  <Pictograma categoria={o.category} tamanho={16} titulo={o.categoryLabel} />
                  <div className="sd-texto">
                    <span className="sd-nome-linha">
                      <span className="sd-nome" title={o.title}>{o.title}</span>
                      {o.pessoal && <span className="sd-tag">Pessoal</span>}
                    </span>
                    <span className="sd-detalhe" title={`${o.local} · ${o.categoryLabel}`}>
                      {o.local} · {o.categoryLabel}<span className="sd-so-celular"> · {o.data}</span>
                    </span>
                  </div>
                </div>
                <div className="sd-td sd-td-status" role="cell">
                  <span className={`badge-pill sd-pill ${classeStatus(o.status)}`}>{o.status === 'Resolvida' ? 'Concluída' : o.status}</span>
                </div>
                <div className="sd-td sd-td-data" role="cell">{o.data}</div>
                <div className="sd-td sd-td-resp" role="cell">
                  {o.responsible
                    ? <><span className="sd-avatar sd-avatar-p" aria-hidden="true">{iniciais(o.responsible)}</span><span className="sd-resp-nome" title={o.responsible}>{o.responsible}</span></>
                    : <span className="sd-sem">Sem responsável</span>}
                </div>
                <div className="sd-td sd-td-acao" role="cell">
                  <button type="button" className="sd-btn" onClick={() => onGerenciar(o.id)}>Gerenciar</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        reclamacoes.length === 0 ? <Vazio icone={ShieldAlert} titulo="Nenhuma reclamação recebida" /> : (
          <div className="sd-tabela sd-tabela-rec" role="table">
            <div className="sd-tr sd-th" role="row">
              <span role="columnheader">Reclamação</span>
              <span role="columnheader">Unidade denunciada</span>
              <span role="columnheader">Ocorrido em</span>
              <span role="columnheader" className="sd-sr">Ação</span>
            </div>
            {visiveis.map(r => {
              const info = lerReclamacao(r.descricao);
              const blocoValido = r.bloco_denunciado && r.bloco_denunciado !== 'Ver unidade';
              const apto = String(r.apartamento_denunciado || '—').replace(/^ap(to|t)?\.?\s*/i, ''); // registros antigos: "AP 802"
              const unidade = `${blocoValido ? `Bloco ${String(r.bloco_denunciado).toUpperCase()} · ` : ''}Apto ${apto}`;
              return (
                <div key={r.id} className="sd-tr" role="row">
                  <div className="sd-td sd-td-oc" role="cell">
                    <Pictograma categoria="reclamacao" tamanho={16} titulo="Reclamação" />
                    <div className="sd-texto">
                      <span className="sd-nome-linha">
                        <span className="sd-nome" title={info.tipo}>{info.tipo}</span>
                        {respondidas.has(r.rawId) && <span className="sd-tag sd-tag-ok">Respondida</span>}
                      </span>
                      <span className="sd-detalhe" title={info.texto}>{info.texto || 'Sem descrição'}</span>
                    </div>
                  </div>
                  <div className="sd-td sd-td-unidade" role="cell">{unidade}</div>
                  <div className="sd-td sd-td-data" role="cell">{info.quando || r.data}</div>
                  <div className="sd-td sd-td-acao" role="cell">
                    <button type="button" className="sd-btn" onClick={() => onAbrirReclamacao(r)}>Responder</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </Cartao>
  );
};

// ---------------------------------------------------------------------------
// DrawerReclamacao — só a gestão vê reclamações: mostra quem registrou e o local denunciado
// (o denunciado e os demais moradores nunca veem).
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
                  Confidencial — visível só para a gestão
                </p>
              </div>
            </div>
            <button onClick={onFechar} style={{ width:36, height:36, borderRadius:12, border:'none', cursor:'pointer', background:'white' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding:24, flex:1, display:'flex', flexDirection:'column', gap:20 }}>

          {/* Quem registrou (decisão do dono, 20/10: o síndico vê o nome) */}
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b', marginBottom:10 }}>
              <User size={15} />
              <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Registrada por</span>
            </div>
            <p style={{ margin:0, fontSize:15, fontWeight:700, color:'#0f172a' }}>{reclamacao.Moradores?.nome || 'Morador'}</p>
            {reclamacao.Moradores?.bloco && (
              <p style={{ margin:'2px 0 0', fontSize:13, color:'#64748b' }}>
                Bloco {reclamacao.Moradores.bloco}, Apt {reclamacao.Moradores.apartamento}
              </p>
            )}
          </div>

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
              <User size={16} />
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
  const [todasReclamacoes, setTodasReclamacoes] = useState([]); // para abrir pelo link da notificação
  const [params, setParams] = useSearchParams();
  const [respondidas,      setRespondidas]       = useState(new Set());
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [ocorrenciasLista, setOcorrenciasLista] = useState([]);
  const [funcionarios,    setFuncionarios]    = useState([]);
  const [ocsReais,        setOcsReais]        = useState([]);
  const [gerenciando,     setGerenciando]     = useState(null);
  const [equipeToda,      setEquipeToda]      = useState(false);

  const [carga, setCarga] = useState('carregando'); // 'carregando' | 'ok' | 'erro'
  const evolucao        = React.useMemo(() => calcularEvolucao(ocsReais), [ocsReais]);
  const categoriasReais = React.useMemo(() => calcularCategorias(ocsReais), [ocsReais]);
  const mapaCalor       = React.useMemo(() => calcularMapaCalor(ocsReais), [ocsReais]);
  const paradas         = React.useMemo(() => calcularParadas(ocsReais), [ocsReais]);
  const emAndamento     = ocsReais.filter(o => o.status === 'Em Andamento').length;

  const fetchDados = React.useCallback(async () => {
    if (!currentUser?.condominio_id) return;
    setCarga(c => (c === 'ok' ? 'ok' : 'carregando'));

    // Tudo ao mesmo tempo (antes as ocorrências e reclamações esperavam uma pela outra)
    const resultados = await Promise.all([
      supabase.from('Funcionarios').select('id, nome').eq('condominio_id', currentUser.condominio_id).eq('status', 'ATIVO'),
      supabase.from('funcionario_especialidades').select('funcionario_id, categoria'),
      supabase.from('Ocorrencias')
        .select('*, Moradores(nome, bloco, apartamento), Funcionarios(nome)')
        .eq('condominio_id', currentUser.condominio_id)
        .order('created_at', { ascending: false }),
      supabase.from('Reclamacoes')
        .select('*, Moradores(nome, bloco, apartamento)')
        .eq('condominio_id', currentUser.condominio_id)
        .order('created_at', { ascending: false }),
    ]);
    const falha = resultados.find(res => res.error);
    if (falha) {
      console.error('Erro ao carregar o painel do síndico:', falha.error);
      setCarga('erro');
      return;
    }
    const [{ data: funcs }, { data: esp }, { data: occ }, { data: rec }] = resultados;
    setOcsReais(occ || []);

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

    const dataBR = (d) => new Date(d).toLocaleDateString('pt-BR');
    setOcorrenciasLista((occ || []).map(o => ({
      id:            o.id,
      title:         o.titulo,
      local:         placaDaOcorrencia(o, o.Moradores).valor,
      category:      o.categoria,
      categoryLabel: CATEGORIA_LABEL[o.categoria] || o.categoria || 'Outros',
      status:        o.status || 'Aberta',
      pessoal:       o.privacidade === 'pessoal',
      data:          dataBR(o.created_at),
      responsible:   o.Funcionarios?.nome || null,
    })));

    // Reclamações: o drawer usa morador_id para enviar a resposta ao morador
    setTodasReclamacoes((rec || []).map(r => ({
      id:                     `r-${r.id}`,
      rawId:                  r.id,
      isReclamacao:           true,
      data:                   dataBR(r.created_at),
      timeOpen:               dataBR(r.created_at),
      morador_id:             r.morador_id,
      Moradores:              r.Moradores, // quem registrou (só o síndico vê)
      descricao:              r.descricao,
      bloco_denunciado:       r.bloco_denunciado,
      apartamento_denunciado: r.apartamento_denunciada || r.apartamento_denunciado,
    })));
    setCarga('ok');
  }, [currentUser?.condominio_id]);

  React.useEffect(() => { fetchDados(); }, [fetchDados]);

  const reclamacaoDoLink = params.get('reclamacao');
  const reclamacaoMostrada = reclamacaoAberta
    || todasReclamacoes.find(r => String(r.rawId) === reclamacaoDoLink)
    || null;
  const fecharReclamacao = () => {
    setReclamacaoAberta(null);
    if (reclamacaoDoLink) {
      const novos = new URLSearchParams(params);
      novos.delete('reclamacao');
      setParams(novos, { replace: true });
    }
  };

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Dashboard Síndico</h2>
              <p className="header-date">{currentUser?.condominio_nome || 'Condomínio'}</p>
            </div>
          </div>
          <div className="header-right">
            <NotificationMenu />
            <div onClick={() => navigate('/perfil')} style={{ display:'flex', alignItems:'center', gap:'0.75rem', borderLeft:'1px solid #e2e8f0', paddingLeft:'1rem', cursor:'pointer' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--hab-laranja)', color:'var(--hab-tinta)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                {currentUser?.name?.charAt(0) || 'S'}
              </div>
            </div>
          </div>
        </header>

        <ContextBanner />

        <div className="dashboard-content-scroll">
          {carga === 'erro' ? (
            <ErroCarregamento onTentar={fetchDados} />
          ) : carga === 'carregando' ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>
          ) : (
          <div className="dashboard-content-inner sd-pagina">

            {/* 1. Situação geral: as 4 etapas, como na Visão Geral */}
            <section className="sd-secao">
              <h3 className="sd-secao-titulo">Ocorrências do condomínio</h3>
              <div className="painel-placas sd-placas">
                {['Aberta', 'Em Análise', 'Em Andamento', 'Resolvida'].map(st => (
                  <div key={st} className="placa placa-status">
                    <span className="placa-status-numero">{ocsReais.filter(o => o.status === st).length}</span>
                    <span className="placa-status-sub">de {ocsReais.length} ocorrências</span>
                    <FaixaStatus status={st} />
                  </div>
                ))}
              </div>
            </section>

            {/* 2. O que precisa do síndico agora: dois cartões de mesma altura, linhas alinhadas */}
            <section className="sd-secao">
              <h3 className="sd-secao-titulo">Precisa de atenção</h3>
              <div className="sd-duas">
                <Cartao
                  titulo="Em andamento há mais de 2 dias"
                  sub="Começaram e ainda não foram concluídas"
                  extra={<span className={`sd-contador${paradas.length ? ' sd-contador-alerta' : ''}`}>{paradas.length}</span>}
                  pe={paradas.length > 0 && (
                    <>
                      <span className="sd-pe-info">{paradas.length > LIMITE_LISTA ? `Mostrando ${LIMITE_LISTA} de ${paradas.length}` : ''}</span>
                      <button type="button" className="sd-link" onClick={() => navigate('/andamento-prolongado')}>Ver todas <ChevronRight size={15} /></button>
                    </>
                  )}
                >
                  {paradas.length === 0 ? (
                    <Vazio icone={CheckCircle2} titulo="Nada parado" texto="Nenhuma ocorrência em andamento há mais de 2 dias." />
                  ) : (
                    <ul className="sd-lista">
                      {paradas.slice(0, LIMITE_LISTA).map(p => (
                        <li key={p.id}>
                          <button type="button" className="sd-linha sd-linha-botao" onClick={() => setGerenciando(p.id)}>
                            <Pictograma categoria={p.categoria} tamanho={16} titulo={CATEGORIA_LABEL[p.categoria] || 'Outros'} />
                            <span className="sd-texto">
                              <span className="sd-nome" title={p.titulo}>{p.titulo}</span>
                              <span className="sd-detalhe" title={p.responsavel}>
                                {p.responsavel ? `Com ${p.responsavel}` : 'Sem responsável'} · {CATEGORIA_LABEL[p.categoria] || 'Outros'}
                              </span>
                            </span>
                            <span className={`sd-dias${p.dias >= 5 ? ' sd-dias-grave' : ''}`}>{p.dias} dias</span>
                          </button>
                        </li>
                      ))}
                      {paradas.length < LIMITE_LISTA && (
                        <li className="sd-nota">
                          {emAndamento - paradas.length > 0
                            ? `As outras ${emAndamento - paradas.length} em andamento estão dentro do prazo.`
                            : 'Não há outras ocorrências em andamento.'}
                        </li>
                      )}
                    </ul>
                  )}
                </Cartao>

                <Cartao
                  titulo="Carga da equipe"
                  sub="Tarefas em aberto atribuídas a cada funcionário"
                  extra={<span className="sd-contador">{funcionarios.length}</span>}
                  pe={funcionarios.length > LIMITE_LISTA && (
                    <>
                      <span className="sd-pe-info">{equipeToda ? '' : `Mostrando ${LIMITE_LISTA} de ${funcionarios.length}`}</span>
                      <button type="button" className="sd-link" onClick={() => setEquipeToda(v => !v)}>
                        {equipeToda ? 'Mostrar menos' : 'Ver equipe toda'} <ChevronRight size={15} className={equipeToda ? 'sd-sobe' : 'sd-desce'} />
                      </button>
                    </>
                  )}
                >
                  {funcionarios.length === 0 ? (
                    <Vazio icone={Users} titulo="Nenhum funcionário ativo" texto="O Master cadastra a equipe em Funcionários." />
                  ) : (
                    <ul className="sd-lista">
                      {[...funcionarios]
                        .sort((a, b) => b.abertas - a.abertas || a.nome.localeCompare(b.nome))
                        .slice(0, equipeToda ? undefined : LIMITE_LISTA)
                        .map(emp => {
                          const esp = emp.especialidades.length ? emp.especialidades.map(c => CATEGORIA_LABEL[c] || c).join(' · ') : 'Sem especialidade';
                          return (
                            <li key={emp.id} className="sd-linha">
                              <span className="sd-avatar" aria-hidden="true">{iniciais(emp.nome)}</span>
                              <span className="sd-texto">
                                <span className="sd-nome" title={emp.nome}>{emp.nome}</span>
                                <span className="sd-detalhe" title={esp}>{esp}</span>
                              </span>
                              <span className={`sd-carga${emp.abertas === 0 ? ' sd-carga-zero' : ''}`}>
                                <strong>{emp.abertas}</strong>
                                <small>{emp.abertas === 1 ? 'tarefa' : 'tarefas'}</small>
                              </span>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </Cartao>
              </div>
            </section>

            {/* 3. Registros recentes em largura inteira */}
            <section className="sd-secao">
              <h3 className="sd-secao-titulo">Registros recentes</h3>
              <RegistrosRecentes
                ocorrencias={ocorrenciasLista}
                reclamacoes={todasReclamacoes}
                onGerenciar={setGerenciando}
                onAbrirReclamacao={setReclamacaoAberta}
                respondidas={respondidas}
                onVerMural={() => navigate('/feed')}
              />
            </section>

            {/* 4. Indicadores (a distribuição por status já está nas placas do topo) */}
            <section className="sd-secao">
              <h3 className="sd-secao-titulo">Indicadores</h3>
              <div className="sd-duas">
                <Cartao
                  titulo="Evolução por semana"
                  sub="Ocorrências abertas e concluídas nas últimas 8 semanas"
                >
                  <span className="sd-legenda">
                    <span><i style={{ background: STATUS_COR['Aberta'] }} />Abertas</span>
                    <span><i style={{ background: STATUS_COR['Resolvida'] }} />Concluídas</span>
                  </span>
                  <div className="sd-grafico">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={evolucao} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7079' }} tickLine={false} axisLine={false} dy={8} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7079' }} tickLine={false} axisLine={false} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="abertas" name="Abertas" stroke={STATUS_COR['Aberta']} strokeWidth={2} fillOpacity={0.06} fill={STATUS_COR['Aberta']} activeDot={{ r: 4, strokeWidth: 0 }} />
                        <Area type="monotone" dataKey="resolvidas" name="Concluídas" stroke={STATUS_COR['Resolvida']} strokeWidth={2} fillOpacity={0.06} fill={STATUS_COR['Resolvida']} activeDot={{ r: 4, strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Cartao>

                <Cartao titulo="Por categoria" sub="Total de ocorrências por tipo">
                  {categoriasReais.length === 0 ? <Vazio icone={BarChart3} titulo="Sem ocorrências ainda" /> : (
                    <ul className="sd-barras">
                      {categoriasReais.map(c => (
                        <li key={c.name}>
                          <span className="sd-barra-nome" title={c.name}>{c.name}</span>
                          <span className="sd-barra-trilho"><span className="sd-barra" style={{ width: `${(c.value / categoriasReais[0].value) * 100}%` }} /></span>
                          <span className="sd-barra-valor">{c.value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Cartao>
              </div>

              <Cartao className="sd-calor" titulo="Mapa de calor da semana" sub="Dias e horários em que as ocorrências costumam ser abertas"
                extra={(
                  <span className="sd-escala" aria-hidden="true">
                    Menos {[0, 1, 2, 3, 4].map(n => <i key={n} className={`hm-lvl-${n}`} />)} Mais
                  </span>
                )}
              >
                <div className="sd-calor-rolagem">
                  <div className="sd-calor-grade">
                    <span />
                    {heatmapTimes.map(t => <span key={t} className="sd-calor-hora">{t}</span>)}
                    {heatmapDays.map((day, dIdx) => (
                      <React.Fragment key={day}>
                        <span className="sd-calor-dia">{day}</span>
                        {mapaCalor.nivel[dIdx].map((val, tIdx) => (
                          <span key={tIdx} className={`sd-calor-celula hm-lvl-${val}`} title={`${day}, ${heatmapTimes[tIdx]}: ${mapaCalor.contagem[dIdx][tIdx]} ocorrência(s)`} />
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </Cartao>
            </section>
          </div>
          )}
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

      {/* Drawer de reclamação (também abre pelo link da notificação: ?reclamacao=<id>) */}
      {reclamacaoMostrada && (
        <DrawerReclamacao
          key={reclamacaoMostrada.id}
          reclamacao={reclamacaoMostrada}
          onFechar={fecharReclamacao}
          currentUser={currentUser}
          onRespondida={(id) => setRespondidas(prev => new Set([...prev, id]))}
        />
      )}
    </div>
  );
};

export default PainelSindico;