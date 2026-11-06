import React, { useState, useEffect, useCallback } from 'react';
import { Menu, RefreshCw, Inbox, Trash2, Loader2, CalendarDays, Mail, User, IdCard } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ErroCarregamento from '../components/ErroCarregamento';
import Janela from '../components/Janela';
import { supabase } from '../backend/supabaseClient';
import './Dashboard.css';
import './PainelDev.css';

// Equipe Habitare: pedidos de exclusão de conta feitos no Perfil (Google Play / LGPD).
// Não existe "negar": o pedido é atendido (Excluir conta) ou o próprio usuário desiste.
const ABAS = [
  { key: 'PENDENTE',  label: 'Pendentes' },
  { key: 'CONCLUIDO', label: 'Concluídos' },
  { key: 'CANCELADO', label: 'Desistências' },
];

const PAPEL = { MORADOR: 'Morador', SINDICO: 'Síndico', FUNCIONARIO: 'Funcionário', MASTER: 'Master', DEV: 'Equipe Habitare' };

const formatar = (d) => (d
  ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—');

const ExclusoesConta = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [erroCarga, setErroCarga]     = useState(false);
  const [pedidos, setPedidos]         = useState([]);
  const [aba, setAba]                 = useState('PENDENTE');
  const [confirmar, setConfirmar]     = useState(null);
  const [excluindo, setExcluindo]     = useState(false);
  const [erro, setErro]               = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarga(false);
    const { data, error } = await supabase.rpc('pedidos_exclusao_para_dev');
    if (error) { console.error('Erro ao buscar pedidos de exclusão:', error); setErroCarga(true); setLoading(false); return; }
    setPedidos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const excluir = async () => {
    setExcluindo(true);
    setErro(null);
    const { error } = await supabase.rpc('concluir_exclusao_conta', { p_pedido: confirmar.id });
    setExcluindo(false);
    if (error) { setErro(error.message || 'Não foi possível excluir a conta.'); return; }
    setConfirmar(null);
    carregar();
  };

  const lista = pedidos.filter(p => p.status === aba);

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Exclusões de conta</h2>
              <p className="header-date">Pedidos feitos pelos usuários no Perfil — prazo de até 30 dias</p>
            </div>
          </div>
          <div className="header-right"><NotificationMenu /></div>
        </header>

        <div className="dashboard-content-scroll">
          <div className="dev-container">
            <div className="dev-barra">
              <div className="dev-abas" role="tablist">
                {ABAS.map(a => (
                  <button key={a.key} role="tab" aria-selected={aba === a.key} className={aba === a.key ? 'ativa' : ''} onClick={() => setAba(a.key)}>
                    {a.label} <span>{pedidos.filter(p => p.status === a.key).length}</span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="dev-vazio"><RefreshCw size={30} className="dev-girar" /><p>Carregando...</p></div>
            ) : erroCarga ? (
              <ErroCarregamento onTentar={carregar} />
            ) : lista.length === 0 ? (
              <div className="dev-vazio"><Inbox size={40} /><h4>{aba === 'PENDENTE' ? 'Nenhum pedido aguardando' : 'Nada por aqui'}</h4></div>
            ) : (
              <div className="dev-lista">
                {lista.map(p => (
                  <article key={p.id} className="dev-card">
                    <div className="dev-card-info">
                      <h3>{p.nome || p.email || 'Conta excluída'}</h3>
                      <div className="dev-meta">
                        <span><CalendarDays size={14} /> Pedido: {formatar(p.criado_em)}</span>
                        {p.concluido_em && <span><CalendarDays size={14} /> {p.status === 'CONCLUIDO' ? 'Excluída' : 'Desistiu'}: {formatar(p.concluido_em)}</span>}
                        <span><Mail size={14} /> {p.email || '—'}</span>
                        <span><User size={14} /> {PAPEL[p.papel] || p.papel || '—'}</span>
                        {p.condominio_id && <span><IdCard size={14} /> Condomínio #{p.condominio_id}</span>}
                      </div>
                      {p.motivo && <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--hab-texto-2, #64748b)' }}>Motivo: {p.motivo}</p>}
                    </div>
                    {p.status === 'PENDENTE' && (
                      <button className="dev-btn dev-btn-pri" onClick={() => { setErro(null); setConfirmar(p); }}>
                        <Trash2 size={15} /> Excluir conta
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {confirmar && (
        <Janela
          icone={Trash2}
          tom="perigo"
          titulo="Excluir esta conta?"
          subtitulo={confirmar.nome || confirmar.email}
          largura="pequena"
          bloqueada={excluindo}
          onFechar={() => setConfirmar(null)}
          rodape={<>
            <button type="button" className="janela-btn janela-btn-sec btn-cancelar" onClick={() => setConfirmar(null)} disabled={excluindo}>Cancelar</button>
            <button type="button" className="janela-btn janela-btn-perigo" onClick={excluir} disabled={excluindo}>
              {excluindo ? <><Loader2 size={16} className="janela-girando" /> Excluindo...</> : <><Trash2 size={16} /> Excluir conta</>}
            </button>
          </>}
        >
          <p className="janela-texto">
            Apaga o login e, junto, o cadastro, as ocorrências, reclamações, reservas e notificações desta pessoa.
            <strong> Não dá para desfazer.</strong> Fica guardado só o e-mail e a data, como prova do atendimento.
          </p>
          {erro && <p className="janela-erro" role="alert">{erro}</p>}
        </Janela>
      )}
    </div>
  );
};

export default ExclusoesConta;
