import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, User, Home, Camera, Search as Lupa, Send, CheckCircle2, UserCog, Clock, Lock } from 'lucide-react';
import { supabase } from '../backend/supabaseClient';
import { useVisualizadorImagem } from '../contexts/visualizadorImagem';
import { useCategorias } from '../hooks/useCategorias';
import { protocoloOcorrencia } from '../utils/protocolo';
import { garantirSemPalavrao } from '../utils/palavroes';
import {
  OCORRENCIA_CAMPOS, MIN_DESCRICAO, carregarNomes, assinarEvidencias, enviarEvidencias, mudarStatus,
} from '../services/ocorrenciaService';
import AtualizacaoOcorrencia from './AtualizacaoOcorrencia';
import ConversaOcorrencia from './ConversaOcorrencia';
import { avisarMudancaOcorrencias } from '../hooks/useContadoresGestao';
import './GerenciarOcorrencia.css';

const STATUS_LABEL = { 'Resolvida': 'Concluída' };
const STATUS_CLASSE = { 'Aberta': 'go-st-aberta', 'Em Análise': 'go-st-analise', 'Em Andamento': 'go-st-andamento', 'Resolvida': 'go-st-concluida' };

const formatarData = (d) => (d
  ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—');

// Painel lateral do síndico/master para conduzir uma ocorrência:
// Em análise, atribuir (vai para Em andamento), em andamento e concluir.
const GerenciarOcorrencia = ({ ocorrenciaId, onFechar, onAtualizada }) => {
  const { rotulo } = useCategorias();
  const fileRef = useRef();
  const abrirImagem = useVisualizadorImagem();

  const [oc,            setOc]            = useState(null);
  const [nomes,         setNomes]         = useState({});
  const [fotos,         setFotos]         = useState({});
  const [historico,     setHistorico]     = useState([]);
  const [funcionarios,  setFuncionarios]  = useState([]);
  const [aba,           setAba]           = useState('encaminhar');
  const [descricao,     setDescricao]     = useState('');
  const [funcionarioId, setFuncionarioId] = useState('');
  const [arquivos,      setArquivos]      = useState([]);
  const [enviando,      setEnviando]      = useState(false);
  const [erro,          setErro]          = useState(null);
  const [confirmarAnalise, setConfirmarAnalise] = useState(false);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('Ocorrencias')
      .select(`${OCORRENCIA_CAMPOS}, condominio_id, Moradores(nome, bloco, apartamento)`)
      .eq('id', ocorrenciaId)
      .single();
    if (error) {
      setErro(error.message);
      return;
    }

    const [mapaNomes, mapaFotos, hist, funcs, esp] = await Promise.all([
      carregarNomes([data.morador_id, data.atribuido_a, data.andamento_por, data.concluida_por, data.analise_por]),
      assinarEvidencias(data.conclusao_evidencias || []),
      supabase.from('ocorrencia_historico')
        .select('id, autor_nome, status_anterior, status_novo, descricao, created_at')
        .eq('ocorrencia_id', ocorrenciaId)
        .order('created_at'),
      supabase.from('Funcionarios').select('id, nome')
        .eq('condominio_id', data.condominio_id).eq('status', 'ATIVO').order('nome'),
      supabase.from('funcionario_especialidades').select('funcionario_id').eq('categoria', data.categoria),
    ]);

    const especialistas = new Set((esp.data || []).map(e => e.funcionario_id));
    setOc(data);
    setNomes(mapaNomes);
    setFotos(mapaFotos);
    setHistorico(hist.data || []);
    setFuncionarios((funcs.data || [])
      .map(f => ({ ...f, especialista: especialistas.has(f.id) }))
      .sort((a, b) => b.especialista - a.especialista));
  }, [ocorrenciaId]);

  useEffect(() => { carregar(); }, [carregar]);

  const executar = async (acao) => {
    setEnviando(true);
    setErro(null);
    try {
      await acao();
      setDescricao('');
      setArquivos([]);
      setFuncionarioId('');
      await carregar();
      onAtualizada?.();
      avisarMudancaOcorrencias();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const descricaoOk = descricao.trim().length >= MIN_DESCRICAO;

  const colocarEmAnalise = () => {
    setConfirmarAnalise(false);
    executar(() => mudarStatus(oc.id, 'Em Análise'));
  };
  const colocarEmAndamento = () => executar(async () => {
    await garantirSemPalavrao(descricao);
    await mudarStatus(oc.id, 'Em Andamento', descricao.trim());
  });
  const atribuir = () => executar(async () => {
    await garantirSemPalavrao(descricao);
    const { error } = await supabase.rpc('atribuir_ocorrencia', {
      p_ocorrencia_id: oc.id,
      p_funcionario_id: funcionarioId,
      p_descricao: descricao.trim(),
    });
    if (error) throw new Error(error.message);
  });
  const concluir = () => executar(async () => {
    await garantirSemPalavrao(descricao);
    const caminhos = await enviarEvidencias(oc.condominio_id, oc.id, arquivos);
    await mudarStatus(oc.id, 'Resolvida', descricao.trim(), caminhos);
  });

  const unidade = oc?.Moradores ? `Bloco ${oc.Moradores.bloco}, Apt ${oc.Moradores.apartamento}` : '';
  const concluida = oc?.status === 'Resolvida';

  return (
    <>
      <div className="go-overlay" onClick={onFechar} />
      <aside className="go-drawer" role="dialog" aria-label="Gerenciar ocorrência">
        {!oc ? (
          <div className="go-carregando">{erro || 'Carregando...'}</div>
        ) : (
          <>
            <header className="go-topo">
              <div>
                <span className="go-protocolo">{protocoloOcorrencia(oc.id, oc.created_at)}</span>
                <h2>{oc.titulo}</h2>
                <div className="go-tags">
                  <span className={`go-status ${STATUS_CLASSE[oc.status] || ''}`}>{STATUS_LABEL[oc.status] || oc.status}</span>
                  <span className="go-tag">{rotulo(oc.categoria)}</span>
                  {oc.privacidade === 'pessoal' && <span className="go-tag go-tag-pessoal"><Home size={11} /> Pessoal · {unidade}</span>}
                </div>
              </div>
              <button className="go-fechar" onClick={onFechar} aria-label="Fechar"><X size={18} /></button>
            </header>

            <div className="go-corpo">
              <section className="go-bloco">
                <div className="go-linha"><User size={14} /> {oc.Moradores?.nome || 'Morador'} · {unidade}</div>
                <div className="go-linha"><Clock size={14} /> Aberta em {formatarData(oc.created_at)}</div>
                <div className="go-linha"><UserCog size={14} /> {oc.atribuido_a ? `Responsável: ${nomes[oc.atribuido_a] || 'funcionário'}` : 'Sem responsável'}</div>
                <p className="go-descricao">{oc.descricao}</p>
                {oc.anexos?.length > 0 && (
                  <div className="go-fotos">
                    {oc.anexos.map((url, i) => (
                      <button key={i} type="button" className="img-zoom" onClick={() => abrirImagem(oc.anexos, i)}><img src={url} alt={`Anexo ${i + 1}`} /></button>
                    ))}
                  </div>
                )}
              </section>

              <AtualizacaoOcorrencia ocorrencia={oc} nomes={nomes} fotos={fotos} />

              {oc.privacidade === 'pessoal' && <ConversaOcorrencia ocorrencia={oc} />}

              {!concluida && (
                <section className="go-acoes">
                  {oc.status === 'Em Análise' && (
                    <div className="go-aviso" role="status">
                      <Lock size={15} />
                      <span>
                        <strong>Em análise:</strong> só você (síndico) pode mudar o status desta ocorrência.
                        Os funcionários não conseguem iniciar nem concluir até você encaminhar.
                        {oc.analise_por && (
                          <>
                            <br />
                            <strong>Pedido de {nomes[oc.analise_por] || 'funcionário'}</strong>
                            {oc.analise_motivo ? `: ${oc.analise_motivo}` : '.'}
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {['Aberta', 'Em Andamento'].includes(oc.status) && !confirmarAnalise && (
                    <button className="go-btn go-btn-secundario" onClick={() => setConfirmarAnalise(true)} disabled={enviando}>
                      <Lupa size={15} /> Colocar em análise
                    </button>
                  )}

                  {['Aberta', 'Em Andamento'].includes(oc.status) && confirmarAnalise && (
                    <div className="go-aviso go-aviso-confirmar" role="alertdialog" aria-label="Confirmar análise">
                      <Lock size={15} />
                      <div>
                        <span>
                          Ao colocar em análise, <strong>só você poderá alterar o status</strong> desta ocorrência.
                          Os funcionários ficam aguardando até você encaminhar, colocar em andamento ou concluir.
                        </span>
                        <div className="go-botoes" style={{ marginTop: '0.6rem' }}>
                          <button className="go-btn go-btn-secundario" onClick={() => setConfirmarAnalise(false)}>Cancelar</button>
                          <button className="go-btn go-btn-primario" onClick={colocarEmAnalise} disabled={enviando}>
                            <Lupa size={15} /> Confirmar análise
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="go-abas" role="tablist">
                    <button role="tab" aria-selected={aba === 'encaminhar'} className={aba === 'encaminhar' ? 'ativa' : ''} onClick={() => setAba('encaminhar')}>
                      Encaminhar
                    </button>
                    <button role="tab" aria-selected={aba === 'concluir'} className={aba === 'concluir' ? 'ativa' : ''} onClick={() => setAba('concluir')}>
                      Concluir
                    </button>
                  </div>

                  {aba === 'encaminhar' ? (
                    <>
                      <label className="go-rotulo" htmlFor="go-funcionario">Funcionário</label>
                      <select id="go-funcionario" value={funcionarioId} onChange={(e) => setFuncionarioId(e.target.value)}>
                        <option value="">Selecione (★ = especialista nesta categoria)</option>
                        {funcionarios.map(f => (
                          <option key={f.id} value={f.id}>{f.especialista ? '★ ' : ''}{f.nome}{f.especialista ? ' · especialista' : ''}</option>
                        ))}
                      </select>
                      <label className="go-rotulo" htmlFor="go-descricao">O que será feito</label>
                      <textarea
                        id="go-descricao"
                        maxLength={2000}
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Ex.: Troca da válvula da caixa d'água na quinta pela manhã."
                      />
                      <div className="go-botoes">
                        {oc.status !== 'Em Andamento' && (
                          <button className="go-btn go-btn-secundario" onClick={colocarEmAndamento} disabled={enviando || !descricaoOk}>
                            Só colocar em andamento
                          </button>
                        )}
                        <button className="go-btn go-btn-primario" onClick={atribuir} disabled={enviando || !descricaoOk || !funcionarioId}>
                          <Send size={15} /> {oc.atribuido_a ? 'Reatribuir' : 'Atribuir e colocar em andamento'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="go-rotulo" htmlFor="go-conclusao">O que foi feito</label>
                      <textarea
                        id="go-conclusao"
                        maxLength={2000}
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descreva a solução aplicada."
                      />
                      <button type="button" className="go-upload" onClick={() => fileRef.current?.click()}>
                        <Camera size={16} /> Adicionar fotos da prova (obrigatório)
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => setArquivos(prev => [...prev, ...Array.from(e.target.files)])} />
                      <p className="go-ajuda">
                        {arquivos.length > 0 ? `${arquivos.length} foto(s) selecionada(s)` : 'Anexe ao menos uma foto para concluir.'}
                      </p>
                      <div className="go-botoes">
                        <button className="go-btn go-btn-sucesso" onClick={concluir} disabled={enviando || !descricaoOk || arquivos.length === 0}>
                          <CheckCircle2 size={15} /> Concluir ocorrência
                        </button>
                      </div>
                    </>
                  )}
                  {!descricaoOk && <p className="go-ajuda">A descrição precisa ter pelo menos {MIN_DESCRICAO} caracteres.</p>}
                </section>
              )}

              {erro && <p className="go-erro" role="alert">{erro}</p>}

              {historico.length > 0 && (
                <section>
                  <h3 className="go-subtitulo">Histórico</h3>
                  <ol className="go-historico">
                    {historico.map(h => (
                      <li key={h.id}>
                        <strong>{h.status_anterior === h.status_novo ? `Reatribuída (${h.status_novo})` : `${h.status_anterior || '—'} → ${STATUS_LABEL[h.status_novo] || h.status_novo}`}</strong>
                        <span>{h.autor_nome || '—'} · {formatarData(h.created_at)}</span>
                        {h.descricao && <p>{h.descricao}</p>}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default GerenciarOcorrencia;
