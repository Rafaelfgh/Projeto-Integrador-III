import React, { useState, useEffect } from 'react';
import { 
  Users, Package, Clock, ShieldCheck, UserPlus, FilePlus, 
  Search, Bell, X, LogIn, LogOut, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import { useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css'; // base layout
import './PainelPorteiro.css';

// --- Mocks ---
const mockVisitantes = [
  { id: 1, nome: 'Carlos Silva', tipo: 'convidado', documento: 'MG-12.345.678', apto: '102', bloco: 'A', entrada: '08:30', saida: null, status: 'Dentro', liberadoPor: 'João Morador', motivo: 'Visita', placa_veiculo: 'XYZ-1234' },
  { id: 2, nome: 'Maria Oliveira (Diarista)', tipo: 'prestador', documento: '111.222.333-44', apto: '305', bloco: 'B', entrada: '07:15', saida: '14:20', status: 'Finalizado', liberadoPor: 'Lista Autorizada', motivo: 'Faxina', placa_veiculo: '' },
  { id: 3, nome: 'João Ferreira', tipo: 'prestador', documento: '999.888.777-66', apto: '301', bloco: 'A', entrada: null, saida: null, status: 'Aguardando', liberadoPor: 'Pendente', motivo: 'Reparo TV', placa_veiculo: 'ABC-9876' }
];

const mockEncomendas = [
  { id: 1, destinatario: 'João Morador', apto: '102', bloco: 'A', tipo: 'Caixa (Sedex)', recebidoEm: '09:45', status: 'Pendente' },
  { id: 2, destinatario: 'Ana Clara', apto: '401', bloco: 'B', tipo: 'Envelope', recebidoEm: 'Ontem, 16:30', status: 'Entregue' }
];

const mockAutorizados = [
  { id: 1, nome: 'Maria Oliveira', tipo: 'Diarista', apto: '305', bloco: 'B', dias: 'Seg, Qua, Sex', status: 'Ativa' },
  { id: 2, nome: 'José Pedro', tipo: 'Encanador', apto: '102', bloco: 'A', dias: 'Hoje', status: 'Temporário' },
  { id: 3, nome: 'Pedro Marques', tipo: 'Visitante', apto: 'Todos', bloco: 'Todos', dias: 'N/A', status: 'Bloqueado' }
];

const mockHistorico = [
  { id: 1, tempo: '10:15', acao: 'Encomenda Registrada: Caixa p/ Apto 102 - Bloco A' },
  { id: 2, tempo: '09:45', acao: 'Entrada Liberada: Carlos Silva p/ Apto 102 (João Morador)' },
  { id: 3, tempo: '07:15', acao: 'Entrada Recorrente: Maria Oliveira (Diarista) p/ Apto 305' }
];

const PainelPorteiro = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Data States
  const [visitantes, setVisitantes] = useState(mockVisitantes);
  const [encomendas, setEncomendas] = useState(mockEncomendas);
  
  // Modal States
  const [modalVisitanteOpen, setModalVisitanteOpen] = useState(false);
  const [modalEncomendaOpen, setModalEncomendaOpen] = useState(false);
  const [tipoVisitante, setTipoVisitante] = useState('convidado');
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync Sidebar URL Params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    const actionParam = searchParams.get('action');

    if (tabParam && ['geral', 'visitantes', 'encomendas', 'autorizados', 'historico'].includes(tabParam)) {
        setActiveTab(tabParam);
    } else if (!tabParam && !actionParam) {
        setActiveTab('geral');
    }

    if (actionParam === 'novo-visitante') {
        setModalVisitanteOpen(true);
        navigate('/painel-portaria', { replace: true });
    } else if (actionParam === 'nova-encomenda') {
        setModalEncomendaOpen(true);
        navigate('/painel-portaria', { replace: true });
    }
  }, [location.search, navigate]);

  // Handlers
  const handleLiberarEntrada = (id) => {
    setVisitantes(visitantes.map(v => 
      v.id === id ? { ...v, status: 'Dentro', entrada: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) } : v
    ));
  };

  const handleRegistrarSaida = (id) => {
    setVisitantes(visitantes.map(v => 
      v.id === id ? { ...v, status: 'Finalizado', saida: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) } : v
    ));
  };

  const handleBloquear = (id) => {
    setVisitantes(visitantes.filter(v => v.id !== id));
    alert('Acesso negado e registro removido.');
  };

  const handleNovoVisitanteSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nome = formData.get('nome')?.toString() || 'Sem Nome';
    const novoVisitante = {
        id: Date.now(),
        nome: nome,
        documento: formData.get('documento')?.toString() || '',
        apto: formData.get('apto')?.toString() || '',
        bloco: '-', 
        tipo: tipoVisitante,
        motivo: formData.get('motivo')?.toString() || '',
        liberadoPor: formData.get('liberadoPor')?.toString() || 'Pendente',
        placa_veiculo: formData.get('placa')?.toString() || '',
        status: 'Aguardando',
        entrada: null,
        saida: null
    };
    
    setVisitantes(prev => [novoVisitante, ...prev]);
    setModalVisitanteOpen(false);
  };

  const handleNovaEncomendaSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const novaEncomenda = {
        id: Date.now(),
        destinatario: formData.get('destinatario')?.toString() || 'Desconhecido',
        apto: formData.get('apto')?.toString() || '',
        bloco: '-',
        tipo: formData.get('tipo')?.toString() || '',
        transportadora: formData.get('transportadora')?.toString() || '',
        recebidoEm: `${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`,
        status: 'Pendente'
    };
    
    setEncomendas(prev => [novaEncomenda, ...prev]);
    setModalEncomendaOpen(false);
  };

  const handleEntregarEncomenda = (id) => {
    setEncomendas(encomendas.map(e => 
      e.id === id ? { ...e, status: 'Entregue' } : e
    ));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // derived metrics
  const visAguardando = visitantes.filter(v => v.status === 'Aguardando').length;
  const visDentro = visitantes.filter(v => v.status === 'Dentro').length;
  const visEntradasHj = visitantes.filter(v => v.status === 'Dentro' || v.status === 'Finalizado').length;
  const visSaidasHj = visitantes.filter(v => v.status === 'Finalizado').length;
  const encPendentes = encomendas.filter(e => e.status === 'Pendente').length;
  const encEntregues = encomendas.filter(e => e.status === 'Entregue').length;

  // Calculador de tempo de permanência genérico
  const calcularTempoPermanencia = (horaEntrada) => {
    if (!horaEntrada) return '';
    try {
        const [h, m] = horaEntrada.split(':');
        const entradaDate = new Date(currentTime);
        entradaDate.setHours(h, m, 0);
        let diffMs = currentTime - entradaDate;
        if (diffMs < 0) return 'Agora'; // caso virada de dia simplificada
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        if (diffHrs > 0) return `${diffHrs}h ${diffMins}m`;
        return `${diffMins}m`;
    } catch {
        return '';
    }
  };

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content" style={{ backgroundColor: '#f8fafc' }}>
        <header className="main-header">
           <div className="header-left" style={{ width: '100%', maxWidth: '600px' }}>
             <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><ShieldCheck size={20} /></button>
             <div className="header-breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
               <h2 className="header-title" style={{ whiteSpace: 'nowrap' }}>Controle de Portaria</h2>
               <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1 }}>
                  <Search size={18} color="#64748b" />
                  <input type="text" placeholder="Buscar morador, unidade, placa, ou veículo..." style={{ border: 'none', outline: 'none', marginLeft: '0.5rem', width: '100%', fontSize: '0.9rem' }} />
               </div>
             </div>
           </div>
           
           {/* Live Clock Header */}
           <div className="portaria-clock">
              <Clock size={24} />
              {formatTime(currentTime)}
           </div>

           <div className="header-right">
              <NotificationMenu />
              <div className="user-profile-dropdown" onClick={() => navigate('/perfil')}>
                 <div className="user-avatar"><span>{currentUser?.name?.charAt(0) || 'P'}</span></div>
              </div>
           </div>
        </header>

        <div className="dashboard-content-scroll portaria-container">
          <div className="portaria-content-area">
             {/* TAB: VISÃO GERAL */}
             {activeTab === 'geral' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div className="portaria-header-row" style={{ alignItems: 'center' }}>
                      <div className="portaria-title">
                        <h1 style={{ fontWeight: 700 }}>Visão geral</h1>
                        <p className="portaria-subtitle" style={{ textTransform: 'capitalize' }}>
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} • {formatTime(currentTime).split(':').slice(0,2).join(':')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-qa btn-qa-outline" onClick={() => alert('Ocorrência registrada!')}>+ Ocorrência</button>
                        <button className="btn-qa btn-qa-primary" onClick={() => setModalVisitanteOpen(true)} style={{ backgroundColor: '#1e293b' }}>+ Visitante</button>
                      </div>
                    </div>

                    {/* Alert Banner */}
                    <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '12px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, border: '1px solid #fde68a' }}>
                        <AlertTriangle size={20} />
                        {encPendentes} encomendas aguardando retirada · última há 3h
                    </div>

                    {/* MOCK METRICS (4 cards) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div className="portaria-metric-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', padding: '1.5rem', borderRadius: '12px', flex: 1 }}>
                           <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Visitantes hoje</p>
                           <h3 style={{ fontSize: '2.5rem', color: '#0f172a', fontWeight: 'bold' }}>{visEntradasHj}</h3>
                           <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{visDentro} no local agora</p>
                        </div>
                        <div className="portaria-metric-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', padding: '1.5rem', borderRadius: '12px', flex: 1 }}>
                           <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Encomendas pendentes</p>
                           <h3 style={{ fontSize: '2.5rem', color: '#0f172a', fontWeight: 'bold' }}>{encPendentes}</h3>
                           <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{encEntregues} entregues hoje</p>
                        </div>
                        <div className="portaria-metric-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', padding: '1.5rem', borderRadius: '12px', flex: 1 }}>
                           <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Entradas registradas</p>
                           <h3 style={{ fontSize: '2.5rem', color: '#0f172a', fontWeight: 'bold' }}>{visEntradasHj}</h3>
                           <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Saídas: {visSaidasHj}</p>
                        </div>
                        <div className="portaria-metric-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', padding: '1.5rem', borderRadius: '12px', flex: 1 }}>
                           <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Pessoas Aguardando</p>
                           <h3 style={{ fontSize: '2.5rem', color: '#ea580c', fontWeight: 'bold' }}>{visAguardando}</h3>
                           <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No portão</p>
                        </div>
                    </div>

                    {/* Quick Actions Wide Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <button className="portaria-metric-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', gap: '0.75rem', cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }} onClick={() => setModalVisitanteOpen(true)}>
                            <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '50%', color: '#475569' }}><UserPlus size={28} /></div>
                            <span style={{ fontWeight: 600, color: '#334155' }}>Registrar visitante</span>
                        </button>
                        <button className="portaria-metric-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', gap: '0.75rem', cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }} onClick={() => setModalEncomendaOpen(true)}>
                            <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '50%', color: '#ea580c' }}><Package size={28} /></div>
                            <span style={{ fontWeight: 600, color: '#334155' }}>Registrar encomenda</span>
                        </button>
                        <button className="portaria-metric-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', gap: '0.75rem', cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }} onClick={() => setActiveTab('autorizados')}>
                            <div style={{ background: '#dcfce7', padding: '1rem', borderRadius: '50%', color: '#16a34a' }}><CheckCircle size={28} /></div>
                            <span style={{ fontWeight: 600, color: '#334155' }}>Ver autorizados</span>
                        </button>
                    </div>

                    {/* Bottom Lists */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                        <div className="portaria-table-container" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 'bold' }}>Visitantes no local</h3>
                                <button style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('visitantes')}>ver todos</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {visitantes.filter(v => ['Dentro', 'Aguardando'].includes(v.status)).length === 0 && (
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>Nenhum visitante no local no momento.</p>
                                )}
                                {visitantes.filter(v => ['Dentro', 'Aguardando'].includes(v.status)).map(v => (
                                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: v.status === 'Aguardando' ? '#ffedd5' : '#e0e7ff', color: v.status === 'Aguardando' ? '#ea580c' : '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                                                {typeof v.nome === 'string' && v.nome.trim().length > 0 ? v.nome.trim().split(' ').map(n=>n?.[0]||'').join('').substring(0,2).toUpperCase() : 'V'}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {v.nome}
                                                    {v.placa_veiculo && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>{v.placa_veiculo}</span>}
                                                </p>
                                                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    Ap. {v.apto} · {v.tipo === 'prestador' ? 'Prestador' : v.motivo} 
                                                    {v.status === 'Dentro' && v.entrada ? ` · Há ${calcularTempoPermanencia(v.entrada)}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{ 
                                            padding: '6px 14px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, 
                                            background: v.status === 'Aguardando' ? '#fef3c7' : '#dcfce7', 
                                            color: v.status === 'Aguardando' ? '#92400e' : '#166534' 
                                        }}>
                                            {v.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="portaria-table-container" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 'bold' }}>Encomendas pendentes</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                                {encomendas.filter(e => e.status === 'Pendente').map(e => (
                                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', color: '#64748b' }}>
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, color: '#1e293b' }}>Ap. {e.apto} · {e.destinatario}</p>
                                            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{e.tipo} · {e.recebidoEm}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="btn-qa btn-qa-outline" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', borderStyle: 'dashed' }} onClick={() => setModalEncomendaOpen(true)}>
                                + Nova encomenda
                            </button>
                        </div>
                    </div>
                </div>
             )}

            {/* TAB: VISITANTES */}
            {activeTab === 'visitantes' && (
              <div className="portaria-table-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.5rem 0', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 'bold' }}>Todos os Visitantes</h3>
                      <button className="btn-qa btn-qa-primary" onClick={() => setModalVisitanteOpen(true)} style={{ backgroundColor: '#1e293b', gap: '0.5rem' }}><UserPlus size={18}/> Registrar Visitante</button>
                  </div>
                  <table className="portaria-table">
                      <thead>
                          <tr>
                              <th>Nome</th>
                              <th>Unidade de Destino</th>
                              <th>Tipo de Acesso</th>
                              <th>Entrada / Permanência</th>
                              <th>Status</th>
                              <th>Ações</th>
                          </tr>
                      </thead>
                      <tbody>
                          {visitantes.map(v => (
                              <tr key={v.id}>
                                  <td>
                                      <div className="pm-resident-cell">
                                          <span className="pm-resident-name" style={{ fontWeight: 600 }}>{v.nome}</span>
                                          <span className="pm-resident-apto">Doc: {v.documento || 'N/A'}</span>
                                      </div>
                                  </td>
                                  <td>
                                      <div className="pm-resident-cell">
                                          <span style={{ fontWeight: 600 }}>Apto {v.apto}</span>
                                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Morador: {v.liberadoPor}</span>
                                      </div>
                                  </td>
                                  <td>
                                      <span style={{ textTransform: 'capitalize' }}>{v.tipo}</span>
                                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{v.motivo}</div>
                                  </td>
                                  <td>
                                      <div className="pm-resident-cell">
                                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{v.entrada || '-'}</span>
                                          {v.status === 'Dentro' && v.entrada && (
                                              <span style={{color: '#16a34a', fontSize: '0.85rem'}}>Há {calcularTempoPermanencia(v.entrada)}</span>
                                          )}
                                          {v.status === 'Finalizado' && v.saida && (
                                              <span style={{color: '#64748b', fontSize: '0.85rem'}}>Saída: {v.saida}</span>
                                          )}
                                      </div>
                                  </td>
                                  <td>
                                      <span className={`pm-badge ${v.status === 'Dentro' ? 'pm-badge-green' : v.status === 'Aguardando' ? 'pm-badge-yellow' : 'pm-badge-slate'}`}>
                                          {v.status}
                                      </span>
                                  </td>
                                  <td>
                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                                          {v.status === 'Aguardando' && (
                                              <>
                                                <button className="btn-action-small btn-resolve" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }} onClick={() => handleLiberarEntrada(v.id)}>
                                                    Liberar
                                                </button>
                                                <button className="btn-action-small btn-reject" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }} onClick={() => handleBloquear(v.id)}>
                                                    Negar
                                                </button>
                                              </>
                                          )}
                                          {v.status === 'Dentro' && (
                                              <button className="btn-action-small btn-resolve" onClick={() => handleRegistrarSaida(v.id)}>
                                                  Registrar Saída
                                              </button>
                                          )}
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
            )}

            {/* TAB: ENCOMENDAS */}
            {activeTab === 'encomendas' && (
              <div className="portaria-table-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.5rem 0', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 'bold' }}>Gestão de Encomendas</h3>
                      <button className="btn-qa btn-qa-primary" onClick={() => setModalEncomendaOpen(true)} style={{ backgroundColor: '#ea580c', gap: '0.5rem' }}><Package size={18}/> Nova Encomenda</button>
                  </div>
                  <table className="portaria-table">
                      <thead>
                          <tr>
                              <th>Destinatário</th>
                              <th>Tipo</th>
                              <th>Recebido Em</th>
                              <th>Status</th>
                              <th>Ações</th>
                          </tr>
                      </thead>
                      <tbody>
                          {encomendas.map(e => (
                              <tr key={e.id}>
                                  <td>
                                      <div className="pm-resident-cell">
                                          <span className="pm-resident-name" style={{ fontWeight: 600 }}>{e.destinatario}</span>
                                          <span className="pm-resident-apto">Apto {e.apto}</span>
                                      </div>
                                  </td>
                                  <td>
                                      <span style={{ fontWeight: 500 }}>{e.tipo}</span>
                                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{e.transportadora || 'Correios/Outro'}</div>
                                  </td>
                                  <td>
                                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{e.recebidoEm}</span>
                                  </td>
                                  <td>
                                       <span className={`pm-badge ${e.status === 'Pendente' ? 'pm-badge-yellow' : 'pm-badge-green'}`}>
                                          {e.status}
                                      </span>
                                  </td>
                                  <td>
                                      {e.status === 'Pendente' && (
                                          <button className="btn-action-small btn-resolve" onClick={() => handleEntregarEncomenda(e.id)}>
                                              Entregar Pacote
                                          </button>
                                      )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
            )}

            {/* TAB: AUTORIZADOS */}
            {activeTab === 'autorizados' && (
              <div className="portaria-table-container">
                   <table className="portaria-table">
                      <thead>
                          <tr>
                              <th>Pessoa Autorizada</th>
                              <th>Tipo</th>
                              <th>Destino (Apto/Bloco)</th>
                              <th>Recorrência</th>
                              <th>Status</th>
                          </tr>
                      </thead>
                      <tbody>
                          {mockAutorizados.map(a => (
                              <tr key={a.id}>
                                  <td className="pm-resident-name">{a.nome}</td>
                                  <td>{a.tipo}</td>
                                  <td>Apto {a.apto} - Bl. {a.bloco}</td>
                                  <td>{a.dias}</td>
                                  <td>
                                      <span className={`pm-badge ${
                                          a.status === 'Ativa' ? 'pm-badge-green' : 
                                          a.status === 'Temporário' ? 'pm-badge-yellow' : 'pm-badge-red'
                                      }`}>
                                          {a.status}
                                      </span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                   </table>
              </div>
            )}

            {/* TAB: HISTORICO */}
            {activeTab === 'historico' && (
              <div className="portaria-table-container" style={{ padding: '2rem' }}>
                  <div className="pm-timeline">
                      {mockHistorico.map(h => (
                          <div key={h.id} className="pm-timeline-item">
                              <div className="pm-timeline-dot"></div>
                              <div className="pm-timeline-time">{h.tempo}</div>
                              <div className="pm-timeline-content">{h.acao}</div>
                          </div>
                      ))}
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Visitante */}
        {modalVisitanteOpen && (
            <div className="modal-overlay">
                <div className="modal-container">
                    <div className="modal-header">
                        <h2>Registrar Entrada</h2>
                        <button className="modal-close" onClick={() => setModalVisitanteOpen(false)}><X size={20}/></button>
                    </div>
                    <form className="modal-body" onSubmit={handleNovoVisitanteSubmit}>
                        
                        {/* Tipo de Acesso Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div 
                                onClick={() => setTipoVisitante('convidado')}
                                style={{
                                    border: tipoVisitante === 'convidado' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                    background: tipoVisitante === 'convidado' ? '#eff6ff' : '#fff',
                                    padding: '1rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                                }}>
                                <Users size={24} color={tipoVisitante === 'convidado' ? '#2563eb' : '#64748b'} style={{ margin: '0 auto 0.5rem' }} />
                                <h4 style={{ color: tipoVisitante === 'convidado' ? '#1e40af' : '#334155', margin: 0 }}>Convidado / Visita</h4>
                            </div>
                            <div 
                                onClick={() => setTipoVisitante('prestador')}
                                style={{
                                    border: tipoVisitante === 'prestador' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                                    background: tipoVisitante === 'prestador' ? '#fff7ed' : '#fff',
                                    padding: '1rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                                }}>
                                <PenTool size={24} color={tipoVisitante === 'prestador' ? '#ea580c' : '#64748b'} style={{ margin: '0 auto 0.5rem' }} />
                                <h4 style={{ color: tipoVisitante === 'prestador' ? '#9a3412' : '#334155', margin: 0 }}>Prestador de Serviço</h4>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                           <div className="input-group" style={{ gridColumn: 'span 2' }}>
                             <label>{tipoVisitante === 'prestador' ? 'Nome da Empresa ou Prestador' : 'Nome do Convidado'}</label>
                             <input type="text" name="nome" className="custom-input" required placeholder={tipoVisitante === 'prestador' ? 'Ex: Conserta Smart' : 'Ex: Roberto Carlos'} />
                           </div>
                           <div className="input-group">
                             <label>Documento {tipoVisitante === 'prestador' ? '(Obrigatório)' : '(Opcional)'}</label>
                             <input type="text" name="documento" className="custom-input" required={tipoVisitante === 'prestador'} placeholder="RG, CPF..." />
                           </div>
                           <div className="input-group">
                             <label>Apto / Unidade Destino</label>
                             <input type="text" name="apto" className="custom-input" required placeholder="Ex: 102" />
                           </div>
                           <div className="input-group">
                             <label>Nome do Morador</label>
                             <input type="text" name="liberadoPor" className="custom-input" required placeholder="Quem autoriza ou recebe?" />
                           </div>
                           <div className="input-group">
                             <label>Motivo da Visita / Serviço</label>
                             <input type="text" name="motivo" className="custom-input" required placeholder="Ex: Entrega, Festa, Conserto..." />
                           </div>
                           <div className="input-group" style={{ gridColumn: 'span 2' }}>
                             <label>Placa do Veículo (Opcional)</label>
                             <input type="text" name="placa" className="custom-input" placeholder="Ex: ABC-1234" />
                           </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setModalVisitanteOpen(false)}>Cancelar</button>
                            <button type="submit" className="btn-primary">Registrar e Notificar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Modal Encomenda */}
        {modalEncomendaOpen && (
             <div className="modal-overlay">
             <div className="modal-container">
                 <div className="modal-header">
                     <h2>Registrar Recebimento de Encomenda</h2>
                     <button className="modal-close" onClick={() => setModalEncomendaOpen(false)}><X size={20}/></button>
                 </div>
                 <form className="modal-body" onSubmit={handleNovaEncomendaSubmit}>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="input-group">
                          <label>Apto / Unidade Destino</label>
                          <input type="text" name="apto" className="custom-input" required placeholder="Ex: 102" />
                        </div>
                        <div className="input-group">
                          <label>Nome no Pacote (Destinatário)</label>
                          <input type="text" name="destinatario" className="custom-input" required placeholder="Ex: João Silva" />
                        </div>
                        <div className="input-group">
                          <label>Descrição / Embalagem</label>
                          <input type="text" name="tipo" className="custom-input" required placeholder="Ex: Caixa Pequena, Envelope..." />
                        </div>
                        <div className="input-group">
                          <label>Transportadora</label>
                          <input type="text" name="transportadora" className="custom-input" required placeholder="Ex: Correios, Loggi, Sedex..." />
                        </div>
                     </div>
                     <div className="modal-footer">
                         <button type="button" className="btn-secondary" onClick={() => setModalEncomendaOpen(false)}>Cancelar</button>
                         <button type="submit" className="btn-primary" style={{ backgroundColor: '#0284c7' }}>Notificar Morador</button>
                     </div>
                 </form>
             </div>
         </div>
        )}

      </main>
    </div>
  );
};

export default PainelPorteiro;
