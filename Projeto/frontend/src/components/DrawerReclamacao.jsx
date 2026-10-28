import React, { useState } from 'react';
import { CheckCircle2, X, Send, MapPin, FileText, User, Gavel } from 'lucide-react';
import { supabase } from '../backend/supabaseClient';
import { contemPalavrao, MSG_PALAVRAO } from '../utils/palavroes';
import { avisarMudancaOcorrencias } from '../hooks/useContadoresGestao';
import { lerReclamacao, unidadeTexto, dataBR } from '../utils/reclamacao';

// ---------------------------------------------------------------------------
// DrawerReclamacao — só o síndico vê: quem reclamou, a unidade reclamada e o relato;
// a resposta vai só para quem reclamou e fica gravada na reclamação.
// ---------------------------------------------------------------------------
export default function DrawerReclamacao({ reclamacao, onFechar, onRespondida }) {
  const [resposta,  setResposta]  = useState('');
  const [enviando,  setEnviando]  = useState(false);
  const [enviado,   setEnviado]   = useState(false);
  const [erro,      setErro]      = useState(null);

  const info = lerReclamacao(reclamacao.descricao);
  const autor = reclamacao.Moradores?.nome || 'Morador';
  const unidadeAutor = reclamacao.Moradores?.apartamento ? unidadeTexto(reclamacao.Moradores.bloco, reclamacao.Moradores.apartamento) : '';
  const unidadeReclamada = unidadeTexto(reclamacao.bloco_denunciado, reclamacao.apartamento_denunciado);
  const jaRespondida = !!reclamacao.respondida_em;

  const enviarResposta = async () => {
    if (!resposta.trim() || enviando) return;
    setErro(null);
    if (await contemPalavrao(resposta)) {
      setErro(MSG_PALAVRAO);
      return;
    }
    setEnviando(true);

    // Grava a resposta na reclamação e avisa só quem reclamou (RPC responder_reclamacao)
    const { error } = await supabase.rpc('responder_reclamacao', { p_reclamacao: reclamacao.rawId, p_texto: resposta.trim() });

    setEnviando(false);
    if (error) {
      console.error('Erro ao enviar resposta:', error);
      setErro(error.hint ? error.message : 'Não foi possível enviar a resposta.');
      return;
    }
    setEnviado(true);
    setResposta('');
    avisarMudancaOcorrencias(); // atualiza a bolinha de reclamações abertas
    onRespondida?.(reclamacao.rawId);
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onFechar}
        style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)', zIndex:200 }}
      />

      {/* Drawer */}
      <div style={{
        position:'fixed', top:0, right:0, width:480, height:'100%',
        background:'#fff', zIndex:201, overflowY:'auto',
        borderLeft:'1px solid #e2e8f0', display:'flex', flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{ padding:24, borderBottom:'1px solid var(--hab-linha)', background:'var(--hab-placa)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ display:'flex', gap:12, alignItems:'center', minWidth:0 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'var(--hab-tinta)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Gavel size={20} color="#fff" />
              </div>
              <div style={{ minWidth:0 }}>
                <h2 style={{ margin:0, fontSize:18, color:'var(--hab-tinta)', fontWeight:700, fontFamily:'var(--hab-fonte-titulo)' }}>{info.tipo}</h2>
                <p style={{ margin:'4px 0 0', fontSize:12, color:'var(--hab-texto-3)', fontWeight:600 }}>
                  Recebida em {reclamacao.data || dataBR(reclamacao.created_at)} · só o síndico vê
                </p>
              </div>
            </div>
            <button onClick={onFechar} aria-label="Fechar" style={{ width:36, height:36, borderRadius:10, border:'1px solid var(--hab-linha)', cursor:'pointer', background:'white', display:'grid', placeItems:'center' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding:24, flex:1, display:'flex', flexDirection:'column', gap:16 }}>

          {/* Quem reclamou e quem foi reclamado (o síndico vê os dois) */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ border:'1px solid var(--hab-linha)', borderRadius:12, padding:14, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--hab-texto-3)', marginBottom:8 }}>
                <User size={14} />
                <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Quem reclamou</span>
              </div>
              <p style={{ margin:0, fontSize:15, fontWeight:700, color:'var(--hab-tinta)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={autor}>{autor}</p>
              <p style={{ margin:'2px 0 0', fontSize:13, color:'var(--hab-texto-2)' }}>{unidadeAutor || 'Unidade não informada'}</p>
            </div>
            <div style={{ border:'1px solid var(--hab-linha)', borderRadius:12, padding:14, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--hab-texto-3)', marginBottom:8 }}>
                <MapPin size={14} />
                <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Unidade reclamada</span>
              </div>
              <p style={{ margin:0, fontSize:15, fontWeight:700, color:'var(--hab-tinta)' }}>{unidadeReclamada}</p>
              <p style={{ margin:'2px 0 0', fontSize:13, color:'var(--hab-texto-2)' }}>{info.quando ? `Ocorrido em ${info.quando}` : 'Data do ocorrido não informada'}</p>
            </div>
          </div>

          {/* Descrição escrita pelo morador */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--hab-texto-3)', marginBottom:8 }}>
              <FileText size={14} />
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>O que aconteceu</span>
            </div>
            <div style={{ background:'var(--hab-aluminio)', borderRadius:12, padding:16, color:'var(--hab-tinta)', fontSize:14, lineHeight:1.7, whiteSpace:'pre-wrap' }}>
              {info.texto || 'Sem descrição.'}
            </div>
          </div>

          {/* Resposta já enviada (fica gravada na reclamação) */}
          {jaRespondida && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--hab-texto-3)', marginBottom:8 }}>
                <CheckCircle2 size={14} />
                <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  Respondida em {dataBR(reclamacao.respondida_em)}{reclamacao.respondida_por_nome ? ` por ${reclamacao.respondida_por_nome}` : ''}
                </span>
              </div>
              <div style={{ background:'#ecfdf5', border:'1px solid #a7f3d0', borderRadius:12, padding:16, color:'var(--hab-tinta)', fontSize:14, lineHeight:1.7, whiteSpace:'pre-wrap' }}>
                {reclamacao.resposta}
              </div>
            </div>
          )}

          {/* Campo de resposta */}
          {!jaRespondida && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b' }}>
              <Send size={15} />
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Responder a {autor}</span>
            </div>
            <p style={{ margin:0, fontSize:12, color:'var(--hab-texto-3)' }}>
              A resposta chega como notificação só para {autor}, quem registrou a reclamação. A unidade reclamada não é avisada.
            </p>
            <textarea
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              placeholder="Ex.: Recebemos sua reclamação e vamos conversar com a unidade."
              disabled={enviado}
              style={{
                flex:1, minHeight:130, borderRadius:14, border:'1.5px solid #e2e8f0',
                padding:16, resize:'none', fontFamily:'inherit', fontSize:14,
                outline:'none', lineHeight:1.6,
                background: enviado ? '#f0fdf4' : 'white',
                color: enviado ? '#15803d' : '#334155',
              }}
            />

            {erro && (
              <p style={{ margin:0, fontSize:13, color:'#b91c1c', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'8px 12px' }}>{erro}</p>
            )}
            {enviado ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', background:'#f0fdf4', borderRadius:12, border:'1px solid #bbf7d0' }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span style={{ fontSize:13, fontWeight:600, color:'#16a34a' }}>Resposta enviada com sucesso!</span>
              </div>
            ) : (
              <button
                type="button"
                className="btn-hab"
                onClick={enviarResposta}
                disabled={!resposta.trim() || enviando}
                style={{ height:46, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor: resposta.trim() ? 'pointer' : 'not-allowed' }}
              >
                <Send size={16} />
                {enviando ? 'Enviando...' : `Enviar resposta a ${autor}`}
              </button>
            )}
          </div>
          )}
        </div>
      </div>
    </>
  );
}
