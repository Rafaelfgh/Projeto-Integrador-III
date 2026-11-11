import React, { useEffect, useState } from 'react';
import { Trash2, Loader2, Clock } from 'lucide-react';
import Janela from './Janela';
import { supabase } from '../backend/supabaseClient';

// "Excluir minha conta" (fica na aba Segurança do Perfil).
// Exigência da Google Play / LGPD: o próprio usuário pede, a Equipe Habitare conclui
// em "Exclusões de conta". O pedido não é negado; o usuário pode desistir enquanto pendente.
export default function ExcluirConta({ userId }) {
  const [pedido, setPedido]     = useState(null);   // pedido PENDENTE, se houver
  const [aberta, setAberta]     = useState(false);
  const [motivo, setMotivo]     = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro]         = useState(null);

  const carregar = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('pedidos_exclusao_conta')
      .select('id, criado_em')
      .eq('usuario_id', userId)
      .eq('status', 'PENDENTE')
      .maybeSingle();
    setPedido(data || null);
  };

  useEffect(() => { carregar(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pedir = async () => {
    setEnviando(true);
    setErro(null);
    const { error } = await supabase.rpc('solicitar_exclusao_conta', { p_motivo: motivo.trim() || null });
    setEnviando(false);
    if (error) { setErro(error.message || 'Não foi possível registrar o pedido.'); return; }
    setAberta(false);
    setMotivo('');
    carregar();
  };

  const desistir = async () => {
    setEnviando(true);
    await supabase.rpc('cancelar_exclusao_conta');
    setEnviando(false);
    carregar();
  };

  return (
    <>
      <div className="saas-divider"></div>
      <h4 className="settings-section-title">Excluir minha conta</h4>
      {pedido ? (
        <>
          <p className="settings-section-desc">
            <Clock size={14} style={{ verticalAlign: '-2px' }} /> Pedido registrado em{' '}
            {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}. A Equipe Habitare conclui a exclusão em até 30 dias
            e, depois disso, você não consegue mais entrar com esta conta.
          </p>
          <button type="button" className="btn-end-session" onClick={desistir} disabled={enviando}>
            {enviando ? 'Aguarde...' : 'Desistir do pedido'}
          </button>
        </>
      ) : (
        <>
          <p className="settings-section-desc">
            Apaga seu acesso e seus dados pessoais (nome, CPF, telefone, unidade, ocorrências, reclamações,
            reservas e notificações). Não dá para desfazer depois de concluída.
          </p>
          <button type="button" className="btn-end-session" onClick={() => setAberta(true)}>
            <Trash2 size={14} style={{ verticalAlign: '-2px' }} /> Pedir exclusão da conta
          </button>
        </>
      )}

      {aberta && (
        <Janela
          icone={Trash2}
          tom="perigo"
          titulo="Excluir minha conta?"
          largura="pequena"
          bloqueada={enviando}
          onFechar={() => setAberta(false)}
          rodape={<>
            <button type="button" className="janela-btn janela-btn-sec btn-cancelar" onClick={() => setAberta(false)} disabled={enviando}>Cancelar</button>
            <button type="button" className="janela-btn janela-btn-perigo" onClick={pedir} disabled={enviando}>
              {enviando ? <><Loader2 size={16} className="janela-girando" /> Enviando...</> : <><Trash2 size={16} /> Pedir exclusão</>}
            </button>
          </>}
        >
          <p className="janela-texto">
            A Equipe Habitare recebe o pedido e exclui sua conta em até 30 dias. Até lá você pode desistir aqui mesmo.
          </p>
          <div className="janela-campo">
            <label htmlFor="exc-motivo">Motivo (opcional)</label>
            <textarea id="exc-motivo" className="janela-input" rows={3} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          {erro && <p className="janela-erro" role="alert">{erro}</p>}
        </Janela>
      )}
    </>
  );
}
