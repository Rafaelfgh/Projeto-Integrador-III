import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, RefreshCw, Send, Camera, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '../backend/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useVisualizadorImagem } from '../contexts/visualizadorImagem';
import { assinarEvidencias, enviarEvidencias } from '../services/ocorrenciaService';
import { contemPalavrao, MSG_PALAVRAO } from '../utils/palavroes';
import './ConversaOcorrencia.css';

// Conversa das ocorrências pessoais: morador, síndico/master e funcionário atribuído.
// Mesma tabela dos comentários (ocorrencia_comentarios), com até 3 fotos por mensagem.
// Sem atualização ao vivo: mensagens novas aparecem ao abrir ou em "Atualizar".

const PAPEL_LABEL = { SINDICO: 'Síndico', MASTER: 'Administração', FUNCIONARIO: 'Equipe', MORADOR: 'Morador' };
const MAX_FOTOS = 3;

const formatarHora = (data) => new Date(data).toLocaleString('pt-BR', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});

export default function ConversaOcorrencia({ ocorrencia }) {
  const { currentUser } = useAuth();
  const abrirImagem = useVisualizadorImagem();
  const [mensagens,  setMensagens]  = useState([]);
  const [links,      setLinks]      = useState({});
  const [carregando, setCarregando] = useState(true);
  const [texto,      setTexto]      = useState('');
  const [fotos,      setFotos]      = useState([]); // { file, preview }
  const [enviando,   setEnviando]   = useState(false);
  const [erro,       setErro]       = useState(null);
  const travaRef = useRef(false); // bloqueia cliques repetidos antes mesmo de a tela redesenhar
  const fileRef  = useRef(null);
  const fotosRef = useRef(fotos);
  useEffect(() => { fotosRef.current = fotos; }, [fotos]);

  const encerrada = ocorrencia.status === 'Resolvida';
  const isGestor  = currentUser?.role === 'SINDICO' || currentUser?.role === 'MASTER';

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from('ocorrencia_comentarios')
      .select('id, autor_id, autor_nome, autor_papel, texto, fotos, created_at')
      .eq('ocorrencia_id', ocorrencia.id)
      .order('created_at');
    if (error) {
      console.error('Erro ao carregar a conversa:', error);
      setErro('Não foi possível carregar a conversa.');
    } else {
      setMensagens(data || []);
      setLinks(await assinarEvidencias((data || []).flatMap(m => m.fotos || [])));
    }
    setCarregando(false);
  }, [ocorrencia.id]);

  useEffect(() => { carregar(); }, [carregar]);

  // Libera as prévias das fotos ao sair
  useEffect(() => () => fotosRef.current.forEach(f => URL.revokeObjectURL(f.preview)), []);

  const escolherFotos = (e) => {
    const novas = Array.from(e.target.files || [])
      .filter(f => f.type.startsWith('image/'))
      .slice(0, MAX_FOTOS - fotos.length)
      .map(file => ({ file, preview: URL.createObjectURL(file) }));
    setFotos(prev => [...prev, ...novas]);
    e.target.value = '';
  };

  const tirarFoto = (i) => setFotos(prev => {
    URL.revokeObjectURL(prev[i].preview);
    return prev.filter((_, j) => j !== i);
  });

  const enviar = async () => {
    const t = texto.trim();
    if ((!t && fotos.length === 0) || travaRef.current) return;
    travaRef.current = true;
    setEnviando(true);
    setErro(null);
    try {
      if (await contemPalavrao(t)) throw new Error(MSG_PALAVRAO);
      const caminhos = await enviarEvidencias(currentUser.condominio_id, ocorrencia.id, fotos.map(f => f.file), 'conversa');
      const { error } = await supabase
        .from('ocorrencia_comentarios')
        .insert({ ocorrencia_id: ocorrencia.id, texto: t, fotos: caminhos });
      if (error) {
        if (caminhos.length) supabase.storage.from('evidencias').remove(caminhos);
        // hint = regra do banco (palavrão, mensagem repetida...) com mensagem pronta
        throw new Error(error.hint ? error.message : 'Não foi possível enviar a mensagem.');
      }
      setTexto('');
      fotos.forEach(f => URL.revokeObjectURL(f.preview));
      setFotos([]);
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      travaRef.current = false;
      setEnviando(false);
    }
  };

  const apagar = async (m) => {
    const { error } = await supabase.from('ocorrencia_comentarios').delete().eq('id', m.id);
    if (error) {
      console.error('Erro ao apagar mensagem:', error);
      setErro('Não foi possível apagar a mensagem.');
      return;
    }
    if (m.fotos?.length) supabase.storage.from('evidencias').remove(m.fotos);
    setMensagens(prev => prev.filter(x => x.id !== m.id));
  };

  return (
    <section className="conv">
      <div className="conv-topo">
        <h4><MessageCircle size={15} /> Conversa</h4>
        <button type="button" className="conv-atualizar" onClick={carregar} disabled={carregando}>
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>
      <p className="conv-ajuda">Morador, síndico e funcionário responsável combinam o atendimento por aqui.</p>

      <div className="conv-lista">
        {carregando && mensagens.length === 0 ? (
          <p className="conv-vazio">Carregando...</p>
        ) : mensagens.length === 0 ? (
          <p className="conv-vazio">Nenhuma mensagem ainda.</p>
        ) : mensagens.map(m => {
          const minha = m.autor_id === currentUser?.id;
          const urls  = (m.fotos || []).map(c => links[c]).filter(Boolean);
          return (
            <div key={m.id} className={`conv-msg${minha ? ' conv-msg-minha' : ''}`}>
              <div className="conv-msg-cabecalho">
                <strong>{minha ? 'Você' : m.autor_nome}</strong>
                {!minha && PAPEL_LABEL[m.autor_papel] && <span className="conv-papel">{PAPEL_LABEL[m.autor_papel]}</span>}
                <span className="conv-hora">{formatarHora(m.created_at)}</span>
                {!encerrada && (minha || isGestor) && (
                  <button type="button" className="conv-apagar" title="Apagar mensagem" onClick={() => apagar(m)}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              {m.texto && <p className="conv-texto">{m.texto}</p>}
              {urls.length > 0 && (
                <div className="conv-fotos">
                  {urls.map((url, i) => (
                    <button key={url} type="button" className="img-zoom" onClick={() => abrirImagem(urls, i)}>
                      <img src={url} alt={`Foto ${i + 1} da mensagem`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {encerrada ? (
        <p className="conv-vazio">Ocorrência concluída — conversa encerrada.</p>
      ) : (
        <div className="conv-form">
          {fotos.length > 0 && (
            <div className="conv-previas">
              {fotos.map((f, i) => (
                <div key={f.preview} className="conv-previa">
                  <img src={f.preview} alt={`Foto ${i + 1} a enviar`} />
                  <button type="button" title="Tirar foto" onClick={() => tirarFoto(i)} disabled={enviando}><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <textarea
            maxLength={1000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva uma mensagem..."
            disabled={enviando}
          />
          <div className="conv-botoes">
            <button
              type="button"
              className="conv-btn-foto"
              onClick={() => fileRef.current?.click()}
              disabled={enviando || fotos.length >= MAX_FOTOS}
            >
              <Camera size={15} /> Foto {fotos.length > 0 && `(${fotos.length}/${MAX_FOTOS})`}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={escolherFotos} />
            <button
              type="button"
              className="conv-btn-enviar"
              onClick={enviar}
              disabled={enviando || (!texto.trim() && fotos.length === 0)}
            >
              {enviando ? <><Loader2 size={15} className="conv-girando" /> Enviando...</> : <><Send size={15} /> Enviar</>}
            </button>
          </div>
        </div>
      )}
      {erro && <p className="conv-erro" role="alert">{erro}</p>}
    </section>
  );
}
