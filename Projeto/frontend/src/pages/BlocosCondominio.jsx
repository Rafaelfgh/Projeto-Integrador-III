import React, { useState, useEffect, useCallback } from 'react';
import ErroCarregamento from '../components/ErroCarregamento';
import { Menu, Layers, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import AvatarUsuario from '../components/AvatarUsuario';
import EditorBlocos from '../components/EditorBlocos';
import Janela from '../components/Janela';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import './Dashboard.css';
import './BlocosCondominio.css';

// Blocos do condomínio (só o master): adicionar a qualquer momento; remover só blocos
// sem moradores (o banco confere e nunca deixa o condomínio sem nenhum bloco).
const BlocosCondominio = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const condominioId = currentUser?.condominio_id;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);
  const [blocos, setBlocos] = useState([]);
  const [moradoresPor, setMoradoresPor] = useState({}); // nome do bloco (minúsculo) -> quantidade
  const [confirmarRemocao, setConfirmarRemocao] = useState(null); // bloco a remover
  const [removendo, setRemovendo] = useState(false);
  const [erroRemocao, setErroRemocao] = useState(null);

  const carregar = useCallback(async () => {
    if (!condominioId) return;
    setErroCarga(false);
    const [{ data, error }, { data: moradores, error: erroMoradores }] = await Promise.all([
      supabase.from('blocos').select('id, nome, andares, aptos_por_andar').eq('condominio_id', condominioId).order('nome'),
      supabase.from('Moradores').select('bloco').eq('condominio_id', condominioId),
    ]);
    if (error || erroMoradores) {
      console.error('Erro ao carregar blocos:', error || erroMoradores);
      setErroCarga(true);
      setCarregando(false);
      return;
    }
    const contagem = {};
    (moradores || []).forEach(m => {
      const chave = (m.bloco || '').trim().toLowerCase();
      if (chave) contagem[chave] = (contagem[chave] || 0) + 1;
    });
    setBlocos(data || []);
    setMoradoresPor(contagem);
    setCarregando(false);
  }, [condominioId]);

  useEffect(() => { carregar(); }, [carregar]);

  const moradoresDo = (b) => moradoresPor[b.nome.toLowerCase()] || 0;

  const salvar = async (bloco) => {
    const { error } = await supabase.from('blocos').insert({ condominio_id: condominioId, ...bloco });
    if (error) {
      console.error('Erro ao salvar bloco:', error);
      return error.code === '23505' ? 'Já existe um bloco com esse nome.' : 'Não foi possível salvar o bloco.';
    }
    await carregar();
    return null;
  };

  // O "x" só pede a confirmação; a remoção acontece no botão da janela
  const pedirRemocao = (bloco) => {
    setErroRemocao(null);
    setConfirmarRemocao(bloco);
    return null;
  };

  const remover = async () => {
    if (!confirmarRemocao || removendo) return;
    setRemovendo(true);
    const { error } = await supabase.from('blocos').delete().eq('id', confirmarRemocao.id);
    setRemovendo(false);
    if (error) {
      console.error('Erro ao remover bloco:', error);
      setErroRemocao(error.hint ? error.message : 'Não foi possível remover o bloco.');
      return;
    }
    setConfirmarRemocao(null);
    carregar();
  };

  const totalAptos = blocos.reduce((soma, b) => soma + b.andares * b.aptos_por_andar, 0);

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Blocos do Condomínio</h2>
              <p className="header-date">Blocos, andares e apartamentos que os moradores escolhem</p>
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
                <span className="bc-icone"><Layers size={18} /></span>
                <div>
                  <h3>Blocos cadastrados</h3>
                  <p>
                    {blocos.length} {blocos.length === 1 ? 'bloco' : 'blocos'} · {totalAptos} apartamentos.
                    Numeração: andar + 2 dígitos (o 1201 é o 12º andar, apartamento 01).
                  </p>
                </div>
              </header>

              {carregando ? (
                <p className="bc-vazio"><Loader2 size={18} className="janela-girando" /> Carregando...</p>
              ) : erroCarga ? (
                <ErroCarregamento onTentar={() => { setCarregando(true); carregar(); }} />
              ) : (
                <>
                  {blocos.length === 0 && (
                    <p className="bc-aviso">
                      Este condomínio ainda não tem blocos. Sem eles, novos moradores não conseguem escolher o apartamento no cadastro.
                    </p>
                  )}
                  <EditorBlocos
                    blocos={blocos}
                    onSalvar={salvar}
                    onRemover={pedirRemocao}
                    removivel={(b) => moradoresDo(b) === 0 && blocos.length > 1}
                    detalhe={(b) => {
                      const n = moradoresDo(b);
                      return n === 0 ? 'sem moradores' : `${n} ${n === 1 ? 'morador' : 'moradores'}`;
                    }}
                  />
                  <p className="bc-ajuda">Blocos com moradores não podem ser removidos. O condomínio precisa ter sempre pelo menos um bloco.</p>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      {confirmarRemocao && (
        <Janela
          icone={Trash2}
          tom="perigo"
          titulo="Remover bloco?"
          subtitulo={`Bloco ${confirmarRemocao.nome}`}
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
          <p className="janela-texto">Os apartamentos desse bloco deixam de aparecer no cadastro de novos moradores.</p>
          {erroRemocao && <p className="janela-erro" role="alert">{erroRemocao}</p>}
        </Janela>
      )}
    </div>
  );
};

export default BlocosCondominio;
