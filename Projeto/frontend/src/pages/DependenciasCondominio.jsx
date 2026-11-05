import React, { useState, useEffect, useCallback } from 'react';
import ErroCarregamento from '../components/ErroCarregamento';
import { Menu, CalendarDays, Loader2, CalendarCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import AvatarUsuario from '../components/AvatarUsuario';
import EditorDependencias from '../components/EditorDependencias';
import Janela from '../components/Janela';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import { isoLocal, dataCurta, horaCurta } from '../utils/dependencias';
import './Dashboard.css';
import './BlocosCondominio.css';

// Dependências do condomínio (só o master), no mesmo formato da aba Blocos:
// adicionar a qualquer momento; remover (com confirmação) apaga também todos os
// agendamentos dela — quem tinha reserva futura é avisado (decisão do dono, 04/11).
const DependenciasCondominio = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const condominioId = currentUser?.condominio_id;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);
  const [dependencias, setDependencias] = useState([]);
  const [reservas, setReservas] = useState([]); // próximas reservas ativas
  const [confirmarRemocao, setConfirmarRemocao] = useState(null); // dependência a remover
  const [removendo, setRemovendo] = useState(false);
  const [erroRemocao, setErroRemocao] = useState(null);

  const carregar = useCallback(async () => {
    if (!condominioId) return;
    const hoje = isoLocal(new Date());
    const [{ data, error }, { data: res, error: erroRes }] = await Promise.all([
      supabase.from('dependencias').select('id, nome, tipo, dias_semana, horarios')
        .eq('condominio_id', condominioId).eq('ativa', true).order('nome'),
      supabase.from('reservas').select('id, dependencia_id, data, inicio, fim, Moradores(nome, bloco, apartamento)')
        .eq('condominio_id', condominioId).eq('status', 'ativa').gte('data', hoje)
        .order('data').order('inicio', { nullsFirst: true }),
    ]);
    setErroCarga(!!(error || erroRes));
    if (error || erroRes) {
      console.error('Erro ao carregar dependências:', error || erroRes);
      setCarregando(false);
      return;
    }
    setDependencias(data || []);
    setReservas(res || []);
    setCarregando(false);
  }, [condominioId]);

  useEffect(() => { carregar(); }, [carregar]);

  const futurasDe = (d) => reservas.filter(r => r.dependencia_id === d.id).length;

  const salvar = async (dep) => {
    const { error } = await supabase.from('dependencias').insert({ condominio_id: condominioId, ...dep });
    if (error) {
      console.error('Erro ao salvar dependência:', error);
      return error.code === '23505' ? 'Já existe uma dependência com esse nome.'
        : error.hint === 'horarios' ? error.message : 'Não foi possível salvar a dependência.';
    }
    await carregar();
    return null;
  };

  // O "x" só pede a confirmação; a remoção acontece no botão da janela
  const pedirRemocao = (dep) => {
    setErroRemocao(null);
    setConfirmarRemocao(dep);
    return null;
  };

  const remover = async () => {
    if (!confirmarRemocao || removendo) return;
    setRemovendo(true);
    const { error } = await supabase.rpc('remover_dependencia', { p_dependencia: confirmarRemocao.id });
    setRemovendo(false);
    if (error) {
      console.error('Erro ao remover dependência:', error);
      setErroRemocao('Não foi possível remover a dependência.');
      return;
    }
    setConfirmarRemocao(null);
    carregar();
  };

  const nomeDep = Object.fromEntries(dependencias.map(d => [d.id, d.nome]));

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Dependências</h2>
              <p className="header-date">Espaços do condomínio que os moradores podem reservar</p>
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
          <div className="bc-container">
            <section className="bc-card">
              <header className="bc-card-topo">
                <span className="bc-icone"><CalendarDays size={18} /></span>
                <div>
                  <h3>Dependências cadastradas</h3>
                  <p>
                    Salão de festas, churrasqueira, quadra... Para cada uma, escolha se a reserva é do dia inteiro
                    ou por horário, e em quais dias da semana ela funciona.
                  </p>
                </div>
              </header>

              {carregando ? (
                <p className="bc-vazio"><Loader2 size={18} className="janela-girando" /> Carregando...</p>
              ) : erroCarga ? (
                <ErroCarregamento onTentar={() => { setCarregando(true); carregar(); }} />
              ) : (
                <>
                  {dependencias.length === 0 && (
                    <p className="bc-aviso">Nenhuma dependência ainda. Enquanto não houver, a aba de reservas fica vazia para os moradores.</p>
                  )}
                  <EditorDependencias
                    dependencias={dependencias}
                    onSalvar={salvar}
                    onRemover={pedirRemocao}
                    detalhe={(d) => {
                      const n = futurasDe(d);
                      return n === 0 ? 'sem reservas futuras' : `${n} ${n === 1 ? 'reserva futura' : 'reservas futuras'}`;
                    }}
                  />
                  <p className="bc-ajuda">Remover uma dependência apaga todos os agendamentos dela; quem tinha reserva futura recebe um aviso.</p>
                </>
              )}
            </section>

            {!carregando && !erroCarga && dependencias.length > 0 && (
              <section className="bc-card dc-reservas">
                <header className="bc-card-topo">
                  <span className="bc-icone"><CalendarCheck size={18} /></span>
                  <div>
                    <h3>Próximas reservas</h3>
                    <p>Quem reservou, o dia e o horário. Só a gestão vê esta lista.</p>
                  </div>
                </header>
                {reservas.length === 0 ? (
                  <p className="bc-vazio">Nenhuma reserva marcada.</p>
                ) : (
                  <ul className="dc-lista">
                    {reservas.map(r => (
                      <li key={r.id}>
                        <span className="dc-data">{dataCurta(r.data)}</span>
                        <span className="dc-texto">
                          <strong>{nomeDep[r.dependencia_id] || 'Dependência'}</strong>
                          <small>{r.inicio ? `${horaCurta(r.inicio)} às ${horaCurta(r.fim)}` : 'Dia inteiro'}</small>
                        </span>
                        <span className="dc-quem">
                          <strong>{r.Moradores?.nome || 'Morador'}</strong>
                          <small>{r.Moradores?.apartamento ? `${r.Moradores.bloco ? `Bloco ${r.Moradores.bloco} · ` : ''}Apto ${r.Moradores.apartamento}` : ''}</small>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      {confirmarRemocao && (
        <Janela
          icone={Trash2}
          tom="perigo"
          titulo="Remover dependência?"
          subtitulo={confirmarRemocao.nome}
          largura="pequena"
          bloqueada={removendo}
          onFechar={() => setConfirmarRemocao(null)}
          rodape={<>
            <button type="button" className="janela-btn janela-btn-sec btn-cancelar" onClick={() => setConfirmarRemocao(null)} disabled={removendo}>Cancelar</button>
            <button type="button" className="janela-btn janela-btn-perigo" onClick={remover} disabled={removendo}>
              {removendo ? <><Loader2 size={16} className="janela-girando" /> Removendo...</> : <><Trash2 size={16} /> Remover</>}
            </button>
          </>}
        >
          <p className="janela-texto">
            Ela deixa de aparecer para os moradores e <strong>todos os agendamentos dela são apagados</strong>.
            {futurasDe(confirmarRemocao) > 0 && (
              <> {futurasDe(confirmarRemocao) === 1 ? 'A reserva futura será cancelada e o morador será avisado' : `As ${futurasDe(confirmarRemocao)} reservas futuras serão canceladas e os moradores serão avisados`} por notificação.</>
            )}
          </p>
          {erroRemocao && <p className="janela-erro" role="alert">{erroRemocao}</p>}
        </Janela>
      )}
    </div>
  );
};

export default DependenciasCondominio;
