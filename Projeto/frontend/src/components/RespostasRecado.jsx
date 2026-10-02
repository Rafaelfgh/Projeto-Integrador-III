import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquareReply, RefreshCw, Send, Loader2 } from 'lucide-react';
import { supabase } from '../backend/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { contemPalavrao, MSG_PALAVRAO } from '../utils/palavroes';
import './ConversaOcorrencia.css';

// Respostas de um recado: funcionários destinatários e a gestão respondem quantas vezes
// quiserem; todos os destinatários veem todas as respostas. Sem atualização ao vivo.

const PAPEL_LABEL = { SINDICO: 'Síndico', MASTER: 'Administração', FUNCIONARIO: 'Equipe' };

const formatarHora = (data) => new Date(data).toLocaleString('pt-BR', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});

export default function RespostasRecado({ recadoId, onRespondido, onCarregado }) {
  const { currentUser } = useAuth();
  const [respostas,  setRespostas]  = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [texto,      setTexto]      = useState('');
  const [enviando,   setEnviando]   = useState(false);
  const [erro,       setErro]       = useState(null);
  const travaRef = useRef(false); // bloqueia cliques repetidos antes de a tela redesenhar

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from('recado_respostas')
      .select('id, autor_id, autor_nome, autor_papel, texto, created_at')
      .eq('recado_id', recadoId)
      .order('created_at');
    if (error) {
      console.error('Erro ao carregar respostas:', error);
      setErro('Não foi possível carregar as respostas.');
    } else {
      setRespostas(data || []);
      onCarregado?.(); // abriu/atualizou: tudo o que está na tela conta como lido
    }
    setCarregando(false);
  }, [recadoId]); // eslint-disable-line react-hooks/exhaustive-deps -- onCarregado muda a cada render

  useEffect(() => { carregar(); }, [carregar]);

  const responder = async () => {
    const t = texto.trim();
    if (!t || travaRef.current) return;
    travaRef.current = true;
    setEnviando(true);
    setErro(null);
    try {
      if (await contemPalavrao(t)) throw new Error(MSG_PALAVRAO);
      const { error } = await supabase.from('recado_respostas').insert({ recado_id: recadoId, texto: t });
      // hint = regra do banco (palavrão, resposta repetida) com mensagem pronta
      if (error) throw new Error(error.hint ? error.message : 'Não foi possível enviar a resposta.');
      setTexto('');
      await carregar();
      onRespondido?.();
    } catch (e) {
      setErro(e.message);
    } finally {
      travaRef.current = false;
      setEnviando(false);
    }
  };

  return (
    <section className="conv">
      <div className="conv-topo">
        <h4><MessageSquareReply size={15} /> Respostas</h4>
        <button type="button" className="conv-atualizar" onClick={carregar} disabled={carregando}>
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      <div className="conv-lista" style={{ marginTop: 12 }}>
        {carregando && respostas.length === 0 ? (
          <p className="conv-vazio">Carregando...</p>
        ) : respostas.length === 0 ? (
          <p className="conv-vazio">Nenhuma resposta ainda.</p>
        ) : respostas.map(r => {
          const minha = r.autor_id === currentUser?.id;
          return (
            <div key={r.id} className={`conv-msg${minha ? ' conv-msg-minha' : ''}`}>
              <div className="conv-msg-cabecalho">
                <strong>{minha ? 'Você' : r.autor_nome}</strong>
                {!minha && PAPEL_LABEL[r.autor_papel] && <span className="conv-papel">{PAPEL_LABEL[r.autor_papel]}</span>}
                <span className="conv-hora">{formatarHora(r.created_at)}</span>
              </div>
              <p className="conv-texto">{r.texto}</p>
            </div>
          );
        })}
      </div>

      <div className="conv-form">
        <textarea
          maxLength={1000}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva sua resposta..."
          disabled={enviando}
        />
        <div className="conv-botoes" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="conv-btn-enviar" onClick={responder} disabled={enviando || !texto.trim()}>
            {enviando ? <><Loader2 size={15} className="conv-girando" /> Enviando...</> : <><Send size={15} /> Responder</>}
          </button>
        </div>
      </div>
      {erro && <p className="conv-erro" role="alert">{erro}</p>}
    </section>
  );
}
