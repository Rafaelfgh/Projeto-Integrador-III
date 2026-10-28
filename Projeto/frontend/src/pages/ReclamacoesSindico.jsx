import React, { useState, useEffect, useCallback } from 'react';
import { Menu, RefreshCw, Inbox, User, CalendarDays, MessageSquareReply } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import ErroCarregamento from '../components/ErroCarregamento';
import DrawerReclamacao from '../components/DrawerReclamacao';
import { Pictograma } from '../components/Placa';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import { EVENTO_CONTADORES } from '../hooks/useContadoresGestao';
import { protocoloReclamacao } from '../utils/protocolo';
import { lerReclamacao, unidadeTexto, dataBR } from '../utils/reclamacao';
import './Dashboard.css';
import './OcorrenciasConcluidas.css';

// Reclamações dos moradores — só o síndico vê. Abertas (sem resposta, com bolinha no menu)
// e Respondidas. Abrir mostra quem reclamou, a unidade reclamada e o relato; a resposta
// vai só para quem reclamou.
const SUBTELAS = [
  { key: 'abertas',     label: 'Abertas' },
  { key: 'respondidas', label: 'Respondidas' },
];

const ReclamacoesSindico = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [params, setParams] = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [erroCarga,   setErroCarga]   = useState(false);
  const [itens,       setItens]       = useState([]);
  const [aba,         setAba]         = useState('abertas');
  const [aberta,      setAberta]      = useState(null);

  const condominioId = currentUser?.condominio_id;
  const carregar = useCallback(async () => {
    if (!condominioId) return;
    const { data, error } = await supabase
      .from('Reclamacoes')
      .select('*, Moradores(nome, bloco, apartamento)')
      .eq('condominio_id', condominioId)
      .order('created_at', { ascending: true });
    setErroCarga(!!error);
    if (error) {
      console.error('Erro ao carregar reclamações:', error);
      setErroCarga(true);
      setLoading(false);
      return;
    }
    setItens((data || []).map(r => ({
      ...r,
      rawId: r.id,
      data: dataBR(r.created_at),
      apartamento_denunciado: r.apartamento_denunciada || r.apartamento_denunciado,
    })));
    setLoading(false);
  }, [condominioId]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    window.addEventListener(EVENTO_CONTADORES, carregar);
    return () => window.removeEventListener(EVENTO_CONTADORES, carregar);
  }, [carregar]);

  // Abertas: a mais antiga primeiro (fila). Respondidas: a resposta mais recente primeiro.
  const abertas = itens.filter(r => !r.respondida_em);
  const respondidas = itens.filter(r => r.respondida_em)
    .sort((a, b) => new Date(b.respondida_em) - new Date(a.respondida_em));
  const visiveis = aba === 'abertas' ? abertas : respondidas;

  // Link da notificação: /reclamacoes?reclamacao=<id>
  const idDoLink = params.get('reclamacao');
  const mostrada = aberta || itens.find(r => String(r.id) === idDoLink) || null;
  const fechar = () => {
    setAberta(null);
    if (idDoLink) {
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
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Reclamações</h2>
              <p className="header-date">Reclamações dos moradores sobre outras unidades. Só você vê; a resposta vai só para quem reclamou</p>
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
            <div className="oc-abas" role="tablist">
              {SUBTELAS.map(s => (
                <button key={s.key} role="tab" aria-selected={aba === s.key} className={aba === s.key ? 'ativa' : ''} onClick={() => setAba(s.key)}>
                  {s.label} <span>{s.key === 'abertas' ? abertas.length : respondidas.length}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="oc-vazio"><RefreshCw size={32} className="oc-spin" /><p>Carregando...</p></div>
            ) : erroCarga ? (
              <ErroCarregamento onTentar={carregar} />
            ) : visiveis.length === 0 ? (
              <div className="oc-vazio">
                <Inbox size={40} />
                <h4>{aba === 'abertas' ? 'Nenhuma reclamação esperando resposta' : 'Nenhuma reclamação respondida ainda'}</h4>
              </div>
            ) : (
              <div className="placas-grade">
                {visiveis.map(r => {
                  const info = lerReclamacao(r.descricao);
                  const autor = r.Moradores?.nome || 'Morador';
                  const unidadeAutor = r.Moradores?.apartamento ? unidadeTexto(r.Moradores.bloco, r.Moradores.apartamento) : '';
                  return (
                    <article key={r.id} className="placa placa-entra rs-placa">
                      <div className="placa-cabeca">
                        <div className="placa-local">
                          <span className="placa-rotulo">Unidade reclamada</span>
                          <span className="placa-valor placa-valor-longo">{unidadeTexto(r.bloco_denunciado, r.apartamento_denunciado)}</span>
                        </div>
                        <Pictograma categoria="reclamacao" titulo="Reclamação" />
                      </div>

                      <div className="placa-corpo">
                        <h3 className="placa-titulo">{info.tipo}</h3>
                        <p className="placa-texto rs-texto" title={info.texto}>{info.texto || 'Sem descrição.'}</p>
                        <div className="placa-meta">
                          <span title={unidadeAutor}><User size={13} /> {autor}{unidadeAutor && ` · ${unidadeAutor}`}</span>
                          <span><CalendarDays size={13} /> {info.quando ? `Ocorrido ${info.quando}` : `Recebida ${r.data}`}</span>
                        </div>
                        {r.respondida_em && (
                          <p className="rs-resposta" title={r.resposta}>
                            <MessageSquareReply size={14} />
                            <span><strong>Respondida em {dataBR(r.respondida_em)}:</strong> {r.resposta}</span>
                          </p>
                        )}
                      </div>

                      <div className="placa-acoes rs-acoes">
                        <button type="button" className={r.respondida_em ? 'sd-btn' : 'btn-hab rs-responder'} onClick={() => setAberta(r)}>
                          {r.respondida_em ? 'Ver reclamação' : `Responder a ${autor}`}
                        </button>
                      </div>

                      <div className={`placa-faixa ${r.respondida_em ? 'st-resolvida' : 'st-aberta'}`}>
                        <span className="placa-faixa-status">{r.respondida_em ? 'Respondida' : 'Aguardando resposta'}</span>
                        <span className="placa-faixa-protocolo">{protocoloReclamacao(r.id, r.created_at)}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {mostrada && (
        <DrawerReclamacao
          key={mostrada.id}
          reclamacao={mostrada}
          onFechar={fechar}
          onRespondida={() => { fechar(); carregar(); }}
        />
      )}
    </div>
  );
};

export default ReclamacoesSindico;
