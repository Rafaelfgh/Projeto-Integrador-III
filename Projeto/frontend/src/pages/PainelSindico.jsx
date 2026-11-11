import React, { useState } from 'react';
import { STATUS_COR, classeStatus } from '../utils/statusOcorrencia';
import { FaixaStatus, Pictograma } from '../components/Placa';
import { placaDaOcorrencia } from '../utils/placa';
import FiltroData, { FILTRO_DATA_VAZIO, temFiltroData, passaFiltroData, anosDe } from '../components/FiltroData';
import { lerReclamacao, unidadeTexto } from '../utils/reclamacao';
import DrawerReclamacao from '../components/DrawerReclamacao';
import ErroCarregamento from '../components/ErroCarregamento';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Menu, CheckCircle2, BarChart3, ShieldAlert, ChevronRight, Inbox, Users,
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

const iniciais = (nome = '') => nome.trim().split(/\s+/).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('') || '?';

const heatmapDays  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
// 6 faixas de 4 horas cobrindo o dia todo (antes: colunas de 2 em 2 horas que arredondavam o horário e só iam das 8h às 20h)
const heatmapTimes = ['0–4h','4–8h','8–12h','12–16h','16–20h','20–24h'];


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
  const m = Array.from({ length: 7 }, () => Array(heatmapTimes.length).fill(0));
  ocs.forEach(o => {
    const d = new Date(o.created_at);
    const dia = (d.getDay() + 6) % 7; // segunda = 0
    const faixa = Math.floor(d.getHours() / 4); // 0h–3h59 → 0, 4h–7h59 → 1, ...
    m[dia][faixa] += 1;
  });
  const max = Math.max(1, ...m.flat());
  return { contagem: m, nivel: m.map(l => l.map(v => (v ? Math.max(1, Math.ceil((v / max) * 4)) : 0))) };
};

// Abertas há mais de 2 dias: ninguém analisou nem começou a atender (mesma regra da aba "Abertas +2 dias")
const calcularAbertasParadas = (ocs) => ocs
  .filter(o => o.status === 'Aberta' && Date.now() - new Date(o.created_at).getTime() > 2 * DIA_MS)
  .map(o => ({
    id: o.id, titulo: o.titulo, categoria: o.categoria,
    dias: Math.floor((Date.now() - new Date(o.created_at).getTime()) / DIA_MS),
  }))
  .sort((a, b) => b.dias - a.dias);

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

// Ranking da equipe: bloco de altura fixa (lugar para 5 pessoas, mesmo com menos);
// "Ver todos" expande quando há mais de 5. Barra proporcional ao 1º colocado.
const RANKING_VISIVEIS = 5;
const RankingEquipe = ({ titulo, sub, itens, campo, cor }) => {
  const [todos, setTodos] = useState(false);
  const lista = itens.filter(i => i[campo] > 0).sort((a, b) => b[campo] - a[campo] || a.nome.localeCompare(b.nome));
  const visiveis = todos ? lista : lista.slice(0, RANKING_VISIVEIS);
  return (
    <Cartao
      className="sd-ranking-card"
      titulo={titulo}
      sub={sub}
      extra={<span className="sd-contador">{lista.length}</span>}
      pe={lista.length > RANKING_VISIVEIS && (
        <>
          <span className="sd-pe-info">{todos ? '' : `Mostrando ${RANKING_VISIVEIS} de ${lista.length}`}</span>
          <button type="button" className="sd-link" onClick={() => setTodos(v => !v)}>
            {todos ? 'Mostrar menos' : 'Ver todos'} <ChevronRight size={15} className={todos ? 'sd-sobe' : 'sd-desce'} />
          </button>
        </>
      )}
    >
      <ol className="sd-ranking">
        {visiveis.map((i, pos) => (
          <li key={i.funcionario_id}>
            <span className="sd-ranking-pos">{pos + 1}º</span>
            <span className="sd-ranking-nome" title={i.nome}>{i.nome}</span>
            <span className="sd-barra-trilho"><span className="sd-barra" style={{ width: `${(i[campo] / lista[0][campo]) * 100}%`, background: cor }} /></span>
            <span className="sd-barra-valor">{i[campo]}</span>
          </li>
        ))}
        {/* Posições ainda sem ninguém: só o número e a barra vazia, até completar 5 */}
        {Array.from({ length: Math.max(0, RANKING_VISIVEIS - visiveis.length) }, (_, k) => (
          <li key={`vaga-${k}`} className="sd-ranking-vaga" aria-hidden="true">
            <span className="sd-ranking-pos">{visiveis.length + k + 1}º</span>
            <span className="sd-ranking-nome">—</span>
            <span className="sd-barra-trilho" />
            <span className="sd-barra-valor">—</span>
          </li>
        ))}
      </ol>
    </Cartao>
  );
};

const LIMITE_LISTA = 5;   // linhas nos cartões de atenção (iguais nos dois, para alinhar)
const LIMITE_EQUIPE = 6;  // carga da equipe em 2 colunas: número par
const PASSO_REGISTROS = 8;

// ---------------------------------------------------------------------------
// Registros recentes — ocorrências e reclamações em abas, linhas em colunas fixas
// ---------------------------------------------------------------------------
const RegistrosRecentes = ({ ocorrencias, reclamacoes, onGerenciar, onAbrirReclamacao, respondidas, onVerMural, ehMaster = false }) => {
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
      sub={aba === 'ocorrencias' ? 'Do mural e pessoais, das mais novas para as mais antigas' : ehMaster ? 'Visíveis apenas para o síndico' : 'Só você vê. Abra para ler e responder a quem reclamou.'}
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
        reclamacoes.length === 0 ? (
          ehMaster
            ? <Vazio icone={ShieldAlert} titulo="Reclamações são só do síndico" texto="Por decisão do condomínio, apenas o síndico vê e responde as reclamações dos moradores." />
            : <Vazio icone={ShieldAlert} titulo="Nenhuma reclamação recebida" />
        ) : (
          <div className="sd-tabela sd-tabela-rec" role="table">
            <div className="sd-tr sd-th" role="row">
              <span role="columnheader">Reclamação</span>
              <span role="columnheader">Unidade denunciada</span>
              <span role="columnheader">Ocorrido em</span>
              <span role="columnheader" className="sd-sr">Ação</span>
            </div>
            {visiveis.map(r => {
              const info = lerReclamacao(r.descricao);
              const unidade = unidadeTexto(r.bloco_denunciado, r.apartamento_denunciado);
              return (
                <div key={r.id} className="sd-tr" role="row">
                  <div className="sd-td sd-td-oc" role="cell">
                    <Pictograma categoria="reclamacao" tamanho={16} titulo="Reclamação" />
                    <div className="sd-texto">
                      <span className="sd-nome-linha">
                        <span className="sd-nome" title={info.tipo}>{info.tipo}</span>
                        {(r.respondida_em || respondidas.has(r.rawId)) && <span className="sd-tag sd-tag-ok">Respondida</span>}
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
  const [ranking,         setRanking]         = useState([]); // desempenho da equipe (RPC ranking_funcionarios)
  const [gerenciando,     setGerenciando]     = useState(null);
  const [equipeToda,      setEquipeToda]      = useState(false);

  const [carga, setCarga] = useState('carregando'); // 'carregando' | 'ok' | 'erro'
  const evolucao        = React.useMemo(() => calcularEvolucao(ocsReais), [ocsReais]);
  // Filtro por data (veio da Visão Geral, 29/10): vale para placas, registros recentes,
  // "Por categoria" e mapa de calor. "Precisa de atenção", carga e evolução mostram a situação atual.
  const [filtroData, setFiltroData] = useState(FILTRO_DATA_VAZIO);
  const temFiltro = temFiltroData(filtroData);
  const ocsFiltradas = React.useMemo(() => ocsReais.filter(o => passaFiltroData(o.created_at, filtroData)), [ocsReais, filtroData]);
  const categoriasReais = React.useMemo(() => calcularCategorias(ocsFiltradas), [ocsFiltradas]);
  const mapaCalor       = React.useMemo(() => calcularMapaCalor(ocsFiltradas), [ocsFiltradas]);
  const paradas         = React.useMemo(() => calcularParadas(ocsReais), [ocsReais]);
  const emAndamento     = ocsReais.filter(o => o.status === 'Em Andamento').length;
  const abertasParadas  = React.useMemo(() => calcularAbertasParadas(ocsReais), [ocsReais]);
  const abertas         = ocsReais.filter(o => o.status === 'Aberta').length;

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
      supabase.rpc('ranking_funcionarios', { p_condominio: currentUser.condominio_id }),
    ]);
    const falha = resultados.find(res => res.error);
    if (falha) {
      console.error('Erro ao carregar o painel do síndico:', falha.error);
      setCarga('erro');
      return;
    }
    const [{ data: funcs }, { data: esp }, { data: occ }, { data: rec }, { data: rank }] = resultados;
    setOcsReais(occ || []);
    setRanking(rank || []);

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
      criado_em:     o.created_at,
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
      created_at:             r.created_at,
      resposta:               r.resposta,
      respondida_em:          r.respondida_em,
      respondida_por_nome:    r.respondida_por_nome,
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
              <div className="sd-secao-topo">
                <h3 className="sd-secao-titulo">Ocorrências do condomínio</h3>
                <FiltroData valor={filtroData} onChange={setFiltroData} anos={anosDe(ocsReais.map(o => o.created_at))} />
              </div>
              <div className="painel-placas sd-placas">
                {['Aberta', 'Em Análise', 'Em Andamento', 'Resolvida'].map(st => (
                  <div key={st} className="placa placa-status">
                    <span className="placa-status-numero">{ocsFiltradas.filter(o => o.status === st).length}</span>
                    <span className="placa-status-sub">de {ocsFiltradas.length} ocorrências{temFiltro ? ' no período' : ''}</span>
                    <FaixaStatus status={st} />
                  </div>
                ))}
              </div>
            </section>

            {/* 2. O que precisa do síndico agora: as duas filas paradas lado a lado (linhas alinhadas)
                 e a carga da equipe embaixo, em largura inteira */}
            <section className="sd-secao">
              <h3 className="sd-secao-titulo">Precisa de atenção</h3>
              <div className="sd-duas">
                <Cartao
                  titulo="Abertas há mais de 2 dias"
                  sub="Ninguém analisou nem começou a atender"
                  extra={<span className={`sd-contador${abertasParadas.length ? ' sd-contador-alerta' : ''}`}>{abertasParadas.length}</span>}
                  pe={abertasParadas.length > 0 && (
                    <>
                      <span className="sd-pe-info">{abertasParadas.length > LIMITE_LISTA ? `Mostrando ${LIMITE_LISTA} de ${abertasParadas.length}` : ''}</span>
                      <button type="button" className="sd-link" onClick={() => navigate('/abertas-prolongadas')}>Ver todas <ChevronRight size={15} /></button>
                    </>
                  )}
                >
                  {abertasParadas.length === 0 ? (
                    <Vazio icone={CheckCircle2} titulo="Nada esperando" texto="Nenhuma ocorrência aberta há mais de 2 dias sem atendimento." />
                  ) : (
                    <ul className="sd-lista">
                      {abertasParadas.slice(0, LIMITE_LISTA).map(p => (
                        <li key={p.id}>
                          <button type="button" className="sd-linha sd-linha-botao" onClick={() => setGerenciando(p.id)}>
                            <Pictograma categoria={p.categoria} tamanho={16} titulo={CATEGORIA_LABEL[p.categoria] || 'Outros'} />
                            <span className="sd-texto">
                              <span className="sd-nome" title={p.titulo}>{p.titulo}</span>
                              <span className="sd-detalhe">Sem análise nem atendimento · {CATEGORIA_LABEL[p.categoria] || 'Outros'}</span>
                            </span>
                            <span className={`sd-dias${p.dias >= 5 ? ' sd-dias-grave' : ''}`}>{p.dias} dias</span>
                          </button>
                        </li>
                      ))}
                      {abertasParadas.length < LIMITE_LISTA && (
                        <li className="sd-nota">
                          {abertas - abertasParadas.length > 0
                            ? `As outras ${abertas - abertasParadas.length} abertas estão dentro do prazo.`
                            : 'Não há outras ocorrências abertas.'}
                        </li>
                      )}
                    </ul>
                  )}
                </Cartao>

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
              </div>

              <div className="sd-carga-larga">
                <Cartao
                  titulo="Carga da equipe"
                  sub="Tarefas em aberto atribuídas a cada funcionário"
                  extra={<span className="sd-contador">{funcionarios.length}</span>}
                  pe={funcionarios.length > LIMITE_EQUIPE && (
                    <>
                      <span className="sd-pe-info">{equipeToda ? '' : `Mostrando ${LIMITE_EQUIPE} de ${funcionarios.length}`}</span>
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
                        .slice(0, equipeToda ? undefined : LIMITE_EQUIPE)
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
                ocorrencias={ocorrenciasLista.filter(o => passaFiltroData(o.criado_em, filtroData))}
                reclamacoes={todasReclamacoes.filter(r => passaFiltroData(r.created_at, filtroData))}
                onGerenciar={setGerenciando}
                onAbrirReclamacao={setReclamacaoAberta}
                respondidas={respondidas}
                onVerMural={() => navigate('/feed')}
                ehMaster={currentUser?.role === 'MASTER'}
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

            {/* 5. Rankings da equipe: quem mais põe em andamento, quem mais conclui e quem começa e não termina */}
            <section className="sd-secao">
              <h3 className="sd-secao-titulo">Rankings de Funcionários</h3>
              <div className="sd-rankings">
                <RankingEquipe
                  titulo="Mais deram andamento"
                  sub="Vezes que o próprio funcionário pôs uma ocorrência em andamento"
                  itens={ranking} campo="andamentos" cor={STATUS_COR['Em Andamento']}
                />
                <RankingEquipe
                  titulo="Mais concluíram"
                  sub="Ocorrências concluídas por cada funcionário"
                  itens={ranking} campo="conclusoes" cor={STATUS_COR['Resolvida']}
                />
                <RankingEquipe
                  titulo="Deram andamento e não concluíram"
                  sub="Puseram em andamento e não terminaram (ainda abertas ou concluídas por outra pessoa)"
                  itens={ranking} campo="sem_concluir" cor={STATUS_COR['Aberta']}
                />
              </div>
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
          onRespondida={(id) => { setRespondidas(prev => new Set([...prev, id])); fetchDados(); }}
        />
      )}
    </div>
  );
};

export default PainelSindico;