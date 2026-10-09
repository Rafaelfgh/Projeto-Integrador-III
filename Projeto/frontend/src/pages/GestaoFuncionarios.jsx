import React, { useState, useEffect, useCallback, useRef } from 'react';
import { combinaBusca } from '../utils/busca';
import ErroCarregamento from '../components/ErroCarregamento';
import { Menu, UserPlus, Check, Wrench, Trash2, Loader2, Eye, Camera, AlertCircle, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationMenu from '../components/NotificationMenu';
import ContextBanner from '../components/ContextBanner';
import Janela from '../components/Janela';
import AvatarUsuario from '../components/AvatarUsuario';
import { useAuth } from '../contexts/AuthContext';
import { useCategorias } from '../hooks/useCategorias';
import { useUrlFoto } from '../hooks/useUrlFoto';
import { supabase } from '../backend/supabaseClient';
import { esquecerFoto } from '../services/fotoFuncionario';
import { fotoRetrato } from '../utils/imagem';
import { somenteLetras, mascaraEmail, emailValido, valorDigitado, TAMANHO } from '../utils/mascaras';
import './Dashboard.css';
import './GestaoFuncionarios.css';

// Gestão de funcionários (síndico e master): cadastrar com foto 3x4, especialidades,
// ficha com foto e remover (só o master). A foto é gravada pela Edge Function:
// o funcionário não consegue trocá-la.

const COR_FUNCIONARIO = '#16a34a';
const FORM_VAZIO = { nome: '', email: '', senha: 'Mudar@123', especialidades: [], foto: null };

// Mensagem de erro vinda da Edge Function (o corpo traz { error })
const erroDaFuncao = async (error, data) => {
  if (data?.error) return data.error;
  try {
    const corpo = await error?.context?.json();
    if (corpo?.error) return corpo.error;
  } catch {
    // resposta sem corpo JSON
  }
  return error?.message || 'Erro desconhecido';
};

const alternar = (lista, slug) => (lista.includes(slug) ? lista.filter(c => c !== slug) : [...lista, slug]);

// Escolha de foto: recorta em 3x4 e reduz antes de enviar
const EscolherFoto = ({ valor, onEscolher, desativado }) => {
  const inputRef = useRef(null);
  const [erro, setErro] = useState(null);

  const escolher = async (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setErro(null);
    try {
      onEscolher(await fotoRetrato(arquivo));
    } catch {
      setErro('Não foi possível ler essa imagem. Escolha uma foto JPG ou PNG.');
    }
  };

  return (
    <div className="gf-foto-campo">
      <div className="gf-foto-moldura">
        {valor ? <img src={valor} alt="Foto escolhida" /> : <Camera size={22} />}
      </div>
      <div className="gf-foto-acoes">
        <button type="button" className="janela-btn janela-btn-sec" onClick={() => inputRef.current?.click()} disabled={desativado}>
          <Camera size={15} /> {valor ? 'Trocar foto' : 'Escolher foto'}
        </button>
        {valor && (
          <button type="button" className="gf-link" onClick={() => onEscolher(null)} disabled={desativado}>Tirar foto</button>
        )}
        <p className="janela-ajuda">Opcional. A foto é ajustada no formato 3x4.</p>
        {erro && <p className="janela-ajuda" style={{ color: '#b91c1c' }}>{erro}</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={escolher} />
    </div>
  );
};

// Foto grande (3x4) da ficha
const FotoFicha = ({ funcionario, versao }) => {
  const url = useUrlFoto(funcionario.foto, versao);
  return (
    <div className="gf-ficha-foto">
      {url ? <img src={url} alt={`Foto de ${funcionario.nome}`} /> : <span>{(funcionario.nome || 'F').charAt(0).toUpperCase()}</span>}
    </div>
  );
};

const GestaoFuncionarios = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { categorias, rotulo } = useCategorias();
  const ehMaster = currentUser?.role === 'MASTER';
  const condominioId = currentUser?.condominio_id;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);
  const [funcionarios, setFuncionarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [versaoFoto, setVersaoFoto] = useState({}); // id -> contador (força link novo após trocar)

  const [cadastrando, setCadastrando] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [criado, setCriado] = useState(false);
  const [erroForm, setErroForm] = useState(null);

  const [espEdit, setEspEdit] = useState(null);     // { funcionario, selecionadas }
  const [ficha, setFicha] = useState(null);         // funcionário aberto
  const [remover, setRemover] = useState(null);     // funcionário a remover
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState(null);         // { titulo, mensagem, tipo }

  const carregar = useCallback(async () => {
    if (!condominioId) return;
    setCarregando(true);
    setErroCarga(false);
    const [{ data: funcs, error }, { data: esp, error: erroEsp }, { data: emails, error: erroEmails }] = await Promise.all([
      supabase.from('Funcionarios').select('id, nome, status, foto, created_at').eq('condominio_id', condominioId).order('nome'),
      supabase.from('funcionario_especialidades').select('funcionario_id, categoria'),
      supabase.rpc('emails_do_condominio', { p_condominio_id: condominioId }),
    ]);
    if (error || erroEsp || erroEmails) {
      console.error('Erro ao carregar funcionários:', error || erroEsp || erroEmails);
      setErroCarga(true);
      setCarregando(false);
      return;
    }
    const espPorFunc = {};
    (esp || []).forEach(e => { (espPorFunc[e.funcionario_id] ||= []).push(e.categoria); });
    const emailPor = Object.fromEntries((emails || []).map(e => [e.id, e.email]));
    setFuncionarios((funcs || []).map(f => ({ ...f, especialidades: espPorFunc[f.id] || [], email: emailPor[f.id] || '' })));
    setCarregando(false);
  }, [condominioId]);

  useEffect(() => { carregar(); }, [carregar]);

  const visiveis = funcionarios.filter(f =>
    combinaBusca(busca, [f.nome, f.email, ...f.especialidades.map(rotulo)])
  );

  // ---------- Cadastrar ----------
  const abrirCadastro = () => {
    setForm(FORM_VAZIO);
    setErroForm(null);
    setCriado(false);
    setCadastrando(true);
  };

  const cadastrar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    if (!emailValido(form.email)) {
      setErroForm('Informe um e-mail válido (ex.: nome@gmail.com).');
      return;
    }
    setErroForm(null);
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerenciar-funcionario', {
        body: {
          acao: 'criar',
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          especialidades: form.especialidades,
          foto: form.foto,
        },
      });
      if (error || data?.error) throw new Error(await erroDaFuncao(error, data));

      setCriado(true);
      setFuncionarios(prev => [...prev, {
        id: data.id, nome: data.nome, email: data.email, status: 'ATIVO', foto: data.foto,
        especialidades: data.especialidades || [], created_at: new Date().toISOString(),
      }].sort((a, b) => a.nome.localeCompare(b.nome)));
      const senha = form.senha;
      setTimeout(() => {
        setCadastrando(false);
        setCriado(false);
        setAviso({
          tipo: data.aviso ? 'erro' : 'sucesso',
          titulo: 'Funcionário cadastrado',
          mensagem: `${data.nome} entra com a senha provisória ${senha} e será avisado para trocá-la no primeiro acesso.${data.aviso ? ` ${data.aviso}` : ''}`,
        });
      }, 1200);
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setEnviando(false);
    }
  };

  // ---------- Especialidades ----------
  const salvarEspecialidades = async () => {
    if (!espEdit || ocupado) return;
    const { funcionario, selecionadas } = espEdit;
    const tirar = funcionario.especialidades.filter(c => !selecionadas.includes(c));
    const colocar = selecionadas.filter(c => !funcionario.especialidades.includes(c));
    setOcupado(true);
    try {
      if (tirar.length) {
        const { error } = await supabase.from('funcionario_especialidades')
          .delete().eq('funcionario_id', funcionario.id).in('categoria', tirar);
        if (error) throw error;
      }
      if (colocar.length) {
        const { error } = await supabase.from('funcionario_especialidades')
          .insert(colocar.map(categoria => ({ funcionario_id: funcionario.id, categoria })));
        if (error) throw error;
      }
      setFuncionarios(prev => prev.map(f => (f.id === funcionario.id ? { ...f, especialidades: selecionadas } : f)));
      setEspEdit(null);
    } catch (err) {
      setAviso({ tipo: 'erro', titulo: 'Não foi possível salvar as especialidades', mensagem: err.message });
    } finally {
      setOcupado(false);
    }
  };

  // ---------- Trocar foto (na ficha) ----------
  const trocarFoto = async (funcionario, dataUrl) => {
    if (!dataUrl || ocupado) return;
    setOcupado(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerenciar-funcionario', {
        body: { acao: 'foto', funcionario_id: funcionario.id, foto: dataUrl },
      });
      if (error || data?.error) throw new Error(await erroDaFuncao(error, data));
      esquecerFoto(data.foto);
      setFuncionarios(prev => prev.map(f => (f.id === funcionario.id ? { ...f, foto: data.foto } : f)));
      setFicha(prev => (prev ? { ...prev, foto: data.foto } : prev));
      setVersaoFoto(prev => ({ ...prev, [funcionario.id]: (prev[funcionario.id] || 0) + 1 }));
    } catch (err) {
      setAviso({ tipo: 'erro', titulo: 'Não foi possível trocar a foto', mensagem: err.message });
    } finally {
      setOcupado(false);
    }
  };

  // ---------- Remover (só master) ----------
  const confirmarRemocao = async () => {
    if (!remover || ocupado) return;
    setOcupado(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerenciar-funcionario', {
        body: { acao: 'remover', funcionario_id: remover.id },
      });
      if (error || data?.error) throw new Error(await erroDaFuncao(error, data));
      setFuncionarios(prev => prev.filter(f => f.id !== remover.id));
      setRemover(null);
    } catch (err) {
      setAviso({ tipo: 'erro', titulo: 'Não foi possível remover o funcionário', mensagem: err.message });
    } finally {
      setOcupado(false);
    }
  };

  const bloqueado = enviando || criado;

  return (
    <div className="dashboard-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <header className="main-header" style={{ borderBottom: 'none' }}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="header-breadcrumbs">
              <h2 className="header-title">Gestão de Funcionários</h2>
              <p className="header-date">Equipe técnica e operacional do condomínio</p>
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

        <div className="dashboard-content-scroll" style={{ backgroundColor: '#f8fafc' }}>
          <div className="gf-container">
            <div className="gf-barra">
              <div className="gf-busca">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou especialidade..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <button className="gf-btn-pri" onClick={abrirCadastro}>
                <UserPlus size={16} /> Cadastrar funcionário
              </button>
            </div>

            <p className="gf-total"><Users size={14} /> {funcionarios.length} {funcionarios.length === 1 ? 'funcionário' : 'funcionários'}</p>

            {carregando ? (
              <p className="gf-vazio"><Loader2 size={18} className="janela-girando" /> Carregando...</p>
            ) : erroCarga ? (
              <ErroCarregamento onTentar={carregar} />
            ) : visiveis.length === 0 ? (
              <p className="gf-vazio">{funcionarios.length === 0 ? 'Nenhum funcionário cadastrado ainda.' : 'Nenhum funcionário encontrado.'}</p>
            ) : (
              <div className="gf-grade">
                {visiveis.map(f => (
                  <article key={f.id} className={`gf-card${f.status !== 'ATIVO' ? ' gf-card-inativo' : ''}`}>
                    <button type="button" className="gf-card-topo" onClick={() => setFicha(f)} title="Ver ficha">
                      <AvatarUsuario nome={f.nome} foto={f.foto} tamanho={56} cor={COR_FUNCIONARIO} versao={versaoFoto[f.id] || 0} />
                      <span className="gf-card-nome">
                        <strong>{f.nome}</strong>
                        <small>{f.email || '—'}</small>
                      </span>
                    </button>
                    <div className="esp-tags gf-card-esp">
                      {f.especialidades.length > 0
                        ? f.especialidades.map(c => <span key={c} className="esp-tag">{rotulo(c)}</span>)
                        : <span className="gf-sem">Sem especialidade</span>}
                    </div>
                    <div className="gf-card-acoes">
                      <button type="button" className="gf-acao" onClick={() => setFicha(f)}><Eye size={14} /> Ficha</button>
                      <button type="button" className="gf-acao" onClick={() => setEspEdit({ funcionario: f, selecionadas: f.especialidades })}>
                        <Wrench size={14} /> Especialidades
                      </button>
                      {ehMaster && (
                        <button type="button" className="gf-acao gf-acao-perigo" onClick={() => setRemover(f)}><Trash2 size={14} /> Remover</button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {cadastrando && (
        <Janela
          as="form"
          onSubmit={cadastrar}
          icone={UserPlus}
          titulo="Cadastrar funcionário"
          subtitulo="Ele entra com a senha provisória e troca no primeiro acesso."
          largura="grande"
          bloqueada={bloqueado}
          onFechar={() => setCadastrando(false)}
          rodape={<>
            <button type="button" className="janela-btn janela-btn-sec" onClick={() => setCadastrando(false)} disabled={bloqueado}>Cancelar</button>
            <button type="submit" className={`janela-btn ${criado ? 'janela-btn-sucesso' : 'janela-btn-pri'}`} disabled={bloqueado}>
              {criado ? <><Check size={16} /> Cadastrado!</>
                : enviando ? <><Loader2 size={16} className="janela-girando" /> Cadastrando...</>
                : <><UserPlus size={16} /> Cadastrar funcionário</>}
            </button>
          </>}
        >
          <EscolherFoto valor={form.foto} onEscolher={(foto) => setForm(prev => ({ ...prev, foto }))} desativado={bloqueado} />

          <div className="janela-campo">
            <label htmlFor="gf-nome">Nome completo</label>
            <input
              id="gf-nome"
              type="text"
              className="janela-input"
              value={form.nome}
              maxLength={TAMANHO.nome}
              onChange={e => setForm({ ...form, nome: valorDigitado(e, somenteLetras) })}
              onCompositionEnd={e => setForm({ ...form, nome: somenteLetras(e.target.value) })}
              required
              disabled={bloqueado}
            />
          </div>

          <div className="janela-grade">
            <div className="janela-campo">
              <label htmlFor="gf-email">E-mail (login)</label>
              <input
                id="gf-email"
                type="email"
                className="janela-input"
                value={form.email}
                maxLength={TAMANHO.email}
                onChange={e => setForm({ ...form, email: mascaraEmail(e.target.value) })}
                required
                disabled={bloqueado}
              />
            </div>
            <div className="janela-campo">
              <label htmlFor="gf-senha">Senha provisória</label>
              <input
                id="gf-senha"
                type="text"
                className="janela-input"
                value={form.senha}
                onChange={e => setForm({ ...form, senha: e.target.value })}
                required
                minLength={6}
                disabled={bloqueado}
              />
            </div>
          </div>

          <div className="janela-campo">
            <span className="janela-rotulo">Especialidades <span>(recebe as ocorrências dessas categorias)</span></span>
            <div className="esp-grid">
              {categorias.map(c => {
                const ativo = form.especialidades.includes(c.slug);
                return (
                  <button
                    type="button"
                    key={c.slug}
                    className={`esp-chip${ativo ? ' ativo' : ''}`}
                    aria-pressed={ativo}
                    disabled={bloqueado}
                    onClick={() => setForm({ ...form, especialidades: alternar(form.especialidades, c.slug) })}
                  >
                    {ativo && <Check size={13} />} {c.icone} {c.nome}
                  </button>
                );
              })}
            </div>
          </div>

          {erroForm && <p className="janela-erro" role="alert">{erroForm}</p>}
        </Janela>
      )}

      {espEdit && (
        <Janela
          icone={Wrench}
          titulo="Especialidades"
          subtitulo={espEdit.funcionario.nome}
          bloqueada={ocupado}
          onFechar={() => setEspEdit(null)}
          rodape={<>
            <button type="button" className="janela-btn janela-btn-sec" onClick={() => setEspEdit(null)} disabled={ocupado}>Cancelar</button>
            <button type="button" className="janela-btn janela-btn-pri" onClick={salvarEspecialidades} disabled={ocupado}>
              {ocupado ? <><Loader2 size={16} className="janela-girando" /> Salvando...</> : 'Salvar'}
            </button>
          </>}
        >
          <p className="janela-texto">O funcionário é notificado das novas ocorrências dessas categorias e as vê no painel dele.</p>
          <div className="esp-grid">
            {categorias.map(c => {
              const ativo = espEdit.selecionadas.includes(c.slug);
              return (
                <button
                  type="button"
                  key={c.slug}
                  className={`esp-chip${ativo ? ' ativo' : ''}`}
                  aria-pressed={ativo}
                  disabled={ocupado}
                  onClick={() => setEspEdit({ ...espEdit, selecionadas: alternar(espEdit.selecionadas, c.slug) })}
                >
                  {ativo && <Check size={13} />} {c.icone} {c.nome}
                </button>
              );
            })}
          </div>
        </Janela>
      )}

      {ficha && (
        <Janela
          icone={Eye}
          titulo="Ficha do funcionário"
          onFechar={() => setFicha(null)}
          fecharAoClicarFora
          bloqueada={ocupado}
          rodape={<button type="button" className="janela-btn janela-btn-sec" onClick={() => setFicha(null)} disabled={ocupado}>Fechar</button>}
        >
          <div className="gf-ficha">
            <div className="gf-ficha-lado">
              <FotoFicha funcionario={ficha} versao={versaoFoto[ficha.id] || 0} />
              <TrocarFotoBotao
                temFoto={!!ficha.foto}
                ocupado={ocupado}
                onEscolher={(dataUrl) => trocarFoto(ficha, dataUrl)}
              />
            </div>
            <div className="gf-ficha-dados">
              <p className="janela-pessoa-nome" style={{ fontSize: 17 }}>{ficha.nome}</p>
              <p className="janela-pessoa-sub">{ficha.email || 'E-mail não disponível'}</p>
              <dl className="janela-ficha" style={{ gridTemplateColumns: '1fr', marginTop: 14 }}>
                <div>
                  <dt>Especialidades</dt>
                  <dd>
                    {ficha.especialidades.length > 0 ? (
                      <span className="esp-tags gf-ficha-esp">
                        {ficha.especialidades.map(c => <span key={c} className="esp-tag">{rotulo(c)}</span>)}
                      </span>
                    ) : 'Nenhuma'}
                  </dd>
                </div>
                <div>
                  <dt>Situação</dt>
                  <dd>{ficha.status === 'ATIVO' ? 'Ativo' : ficha.status}</dd>
                </div>
                <div>
                  <dt>Cadastrado em</dt>
                  <dd>{ficha.created_at ? new Date(ficha.created_at).toLocaleDateString('pt-BR') : '—'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Janela>
      )}

      {remover && (
        <Janela
          icone={Trash2}
          tom="perigo"
          titulo="Remover funcionário"
          subtitulo="Esta ação não pode ser desfeita."
          largura="pequena"
          bloqueada={ocupado}
          onFechar={() => setRemover(null)}
          rodape={<>
            <button type="button" className="janela-btn janela-btn-sec" onClick={() => setRemover(null)} disabled={ocupado}>Cancelar</button>
            <button type="button" className="janela-btn janela-btn-perigo" onClick={confirmarRemocao} disabled={ocupado}>
              {ocupado ? <><Loader2 size={16} className="janela-girando" /> Removendo...</> : <><Trash2 size={16} /> Remover</>}
            </button>
          </>}
        >
          <div className="janela-pessoa">
            <AvatarUsuario nome={remover.nome} foto={remover.foto} tamanho={44} cor={COR_FUNCIONARIO} />
            <div>
              <p className="janela-pessoa-nome">{remover.nome}</p>
              <p className="janela-pessoa-sub">{remover.especialidades.map(c => rotulo(c)).join(' · ') || 'Funcionário'}</p>
            </div>
          </div>
          <p className="janela-texto">O login, o cadastro e a foto dele são apagados. As ocorrências que ele atendeu continuam no sistema, com o nome dele.</p>
        </Janela>
      )}

      {aviso && (
        <Janela
          icone={aviso.tipo === 'sucesso' ? Check : AlertCircle}
          tom={aviso.tipo === 'sucesso' ? 'sucesso' : 'erro'}
          titulo={aviso.titulo}
          largura="pequena"
          onFechar={() => setAviso(null)}
          fecharAoClicarFora
          rodape={<button type="button" className="janela-btn janela-btn-pri janela-btn-largo" onClick={() => setAviso(null)}>Entendido</button>}
        >
          <p className="janela-texto">{aviso.mensagem}</p>
        </Janela>
      )}
    </div>
  );
};

// Botão "Adicionar/Trocar foto" da ficha (gestão)
const TrocarFotoBotao = ({ temFoto, ocupado, onEscolher }) => {
  const inputRef = useRef(null);
  const escolher = async (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    try {
      onEscolher(await fotoRetrato(arquivo));
    } catch {
      onEscolher(null);
    }
  };
  return (
    <>
      <button type="button" className="janela-btn janela-btn-sec" onClick={() => inputRef.current?.click()} disabled={ocupado} style={{ width: '100%', padding: '0 8px', fontSize: 13, whiteSpace: 'nowrap' }}>
        {ocupado ? <><Loader2 size={15} className="janela-girando" /> Salvando...</> : <><Camera size={15} /> {temFoto ? 'Trocar foto' : 'Adicionar foto'}</>}
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={escolher} />
    </>
  );
};

export default GestaoFuncionarios;
