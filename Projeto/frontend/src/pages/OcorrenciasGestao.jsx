import React, { useState, useEffect, useCallback } from 'react';
import { PlacaLocal, FaixaStatus } from '../components/Placa';
import { separarLocal } from '../utils/placa';
import ErroCarregamento from '../components/ErroCarregamento';
import { Menu, Home, User, UserCog, CalendarDays, Hourglass, RefreshCw, Inbox, ScanSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import AtualizacaoOcorrencia from '../components/AtualizacaoOcorrencia';
import GerenciarOcorrencia from '../components/GerenciarOcorrencia';
import { useAuth } from '../contexts/AuthContext';
import { useCategorias } from '../hooks/useCategorias';
import { supabase } from '../backend/supabaseClient';
import { EVENTO_CONTADORES } from '../hooks/useContadoresGestao';
import { protocoloOcorrencia } from '../utils/protocolo';
import { OCORRENCIA_CAMPOS, carregarNomes, assinarEvidencias } from '../services/ocorrenciaService';
import './Dashboard.css';
import './OcorrenciasConcluidas.css';

const DIAS_PROLONGADO = 2;

const MODOS = {
  analise: {
    titulo: 'Ocorrências em análise',
    subtitulo: 'Ocorrências do mural (área comum) que aguardam a sua decisão. As pessoais em análise ficam em "Ocorrências Pessoais"',
    vazio: 'Nenhuma ocorrência aguardando análise',
  },
  pessoais: {
    titulo: 'Ocorrências Pessoais',
    subtitulo: 'Problemas dentro dos apartamentos: só você vê e encaminha a um funcionário',
    vazio: 'Nenhuma ocorrência pessoal por aqui',
  },
  prolongadas: {
    titulo: `Em andamento +${DIAS_PROLONGADO} dias`,
    subtitulo: 'Para você acompanhar. Não quer dizer que estejam atrasadas',
    vazio: `Nenhuma ocorrência em andamento há mais de ${DIAS_PROLONGADO} dias`,
  },
};


const formatarData = (d) => (d
  ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—');

const diasDesde = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 864e5);

// Listas de acompanhamento do síndico/master: pessoais e em andamento prolongado
const OcorrenciasGestao = ({ modo }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { porSlug } = useCategorias();
  const config = MODOS[modo];

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [erroCarga,   setErroCarga]   = useState(false);
  const [itens,       setItens]       = useState([]);
  const [nomes,       setNomes]       = useState({});
  const [fotos,       setFotos]       = useState({});
  const [aba,         setAba]         = useState('Em Análise');
  const [gerenciando, setGerenciando] = useState(null);

  const carregar = useCallback(async () => {
    if (!currentUser?.condominio_id) return;
    setLoading(true);
    setErroCarga(false);

    let consulta = supabase
      .from('Ocorrencias')
      .select(`${OCORRENCIA_CAMPOS}, Moradores(nome, bloco, apartamento)`)
      .eq('condominio_id', currentUser.condominio_id);
    if (modo === 'pessoais') {
      consulta = consulta.eq('privacidade', 'pessoal').order('created_at', { ascending: false });
    } else if (modo === 'analise') {
      consulta = consulta.eq('privacidade', 'mural').eq('status', 'Em Análise').order('analise_em');
    } else {
      consulta = consulta.eq('status', 'Em Andamento')
        .lt('andamento_em', new Date(Date.now() - DIAS_PROLONGADO * 864e5).toISOString())
        .order('andamento_em');
    }

    const { data, error } = await consulta;
    if (error) {
      console.error('Erro ao buscar ocorrências:', error);
      setErroCarga(true);
      setLoading(false);
      return;
    }
    const lista = data || [];

    const [mapaNomes, mapaFotos] = await Promise.all([
      carregarNomes(lista.flatMap(o => [o.atribuido_a, o.andamento_por, o.concluida_por, o.analise_por])),
      assinarEvidencias(lista.flatMap(o => o.conclusao_evidencias || [])),
    ]);
    setNomes(mapaNomes);
    setFotos(mapaFotos);
    setItens(lista);
    setLoading(false);
  }, [currentUser, modo]);

  useEffect(() => { carregar(); }, [carregar]);

  // Recarrega quando uma ocorrência muda em outro ponto da tela (ex.: Gerenciar aberto pela notificação)
  useEffect(() => {
    window.addEventListener(EVENTO_CONTADORES, carregar);
    return () => window.removeEventListener(EVENTO_CONTADORES, carregar);
  }, [carregar]);

  // Pessoais: subtelas por status, cada uma com a sua quantidade
  const SUBTELAS_PESSOAIS = [
    { key: 'Em Análise',   label: 'Em análise' },
    { key: 'Em Andamento', label: 'Em andamento' },
    { key: 'Resolvida',    label: 'Concluídas' },
  ];
  const visiveis = modo === 'pessoais' ? itens.filter(o => o.status === aba) : itens;

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">{config.titulo}</h2>
              <p className="header-date">{config.subtitulo}</p>
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
          <div className="oc-container">

            {modo === 'pessoais' && (
              <div className="oc-abas" role="tablist">
                {SUBTELAS_PESSOAIS.map(s => (
                  <button key={s.key} role="tab" aria-selected={aba === s.key} className={aba === s.key ? 'ativa' : ''} onClick={() => setAba(s.key)}>
                    {s.label} <span>{itens.filter(o => o.status === s.key).length}</span>
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="oc-vazio"><RefreshCw size={32} className="oc-spin" /><p>Carregando...</p></div>
            ) : erroCarga ? (
              <ErroCarregamento onTentar={carregar} />
            ) : visiveis.length === 0 ? (
              <div className="oc-vazio"><Inbox size={40} /><h4>{config.vazio}</h4></div>
            ) : (
              <div className="placas-grade">
                {visiveis.map(item => {
                  const unidade = item.Moradores ? `Bloco ${item.Moradores.bloco}, Apt ${item.Moradores.apartamento}` : '';
                  return (
                    <article key={item.id} className={`placa placa-entra oc-placa oc-card-${modo}`}>
                      <PlacaLocal
                        ocorrencia={item}
                        unidade={{ bloco: item.Moradores?.bloco, apartamento: item.Moradores?.apartamento }}
                        categoriaNome={porSlug[item.categoria]?.nome}
                      />

                      <div className="placa-corpo">
                        <h3 className="placa-titulo">{item.titulo}</h3>
                        <p className="placa-texto">{separarLocal(item.descricao).texto}</p>
                        <div className="placa-meta">
                          <span>{porSlug[item.categoria]?.nome || 'Outros'}</span>
                          <span><User size={13} /> {item.Moradores?.nome || 'Morador'}{item.privacidade === 'pessoal' && unidade && ` · ${unidade}`}</span>
                          <span><CalendarDays size={13} /> Aberta {formatarData(item.created_at)}</span>
                          <span><UserCog size={13} /> {item.atribuido_a ? nomes[item.atribuido_a] || 'Funcionário' : 'Sem responsável'}</span>
                        </div>
                        {modo === 'prolongadas' && (
                          <p className="oc-duracao">
                            <Hourglass size={14} /> Em andamento há <strong>{diasDesde(item.andamento_em)} dias</strong> · por {item.andamento_por_nome || nomes[item.andamento_por] || 'Administração'}
                          </p>
                        )}
                      </div>

                      {item.status === 'Em Análise' && (
                        <div className="oc-analise">
                          <strong>
                            <ScanSearch size={14} />
                            {item.analise_por
                              ? `Análise pedida por ${nomes[item.analise_por] || 'funcionário'} · ${formatarData(item.analise_em)}`
                              : `Em análise desde ${formatarData(item.analise_em)}`}
                          </strong>
                          {item.analise_motivo && <p>{item.analise_motivo}</p>}
                        </div>
                      )}

                      <AtualizacaoOcorrencia ocorrencia={item} nomes={nomes} fotos={fotos} />

                      <div className="placa-acoes oc-placa-acoes">
                        <button className="btn-hab oc-gerenciar" onClick={() => setGerenciando(item.id)}>Gerenciar</button>
                      </div>

                      <FaixaStatus status={item.status} protocolo={protocoloOcorrencia(item.id, item.created_at)} />
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {gerenciando && (
        <GerenciarOcorrencia
          ocorrenciaId={gerenciando}
          onFechar={() => setGerenciando(null)}
          onAtualizada={carregar}
        />
      )}
    </div>
  );
};

export default OcorrenciasGestao;
