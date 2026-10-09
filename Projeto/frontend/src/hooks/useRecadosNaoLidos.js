import { useEffect, useState } from 'react';
import { supabase } from '../backend/supabaseClient';

// Recados não lidos (bolinha do menu e marcação em cada recado).
// Recado novo conta 1 para o funcionário destinatário; cada resposta de outra pessoa
// conta +1; abrir o recado zera (RPC marcar_recado_lido).
export const EVENTO_RECADOS = 'habitare:recados';
export const avisarLeituraRecados = () => window.dispatchEvent(new Event(EVENTO_RECADOS));

export const marcarRecadoLido = async (recadoId) => {
  const { error } = await supabase.rpc('marcar_recado_lido', { p_recado: recadoId });
  if (error) console.error('Erro ao marcar recado como lido:', error);
  avisarLeituraRecados();
};

// Guardado entre as trocas de tela (mesma ideia dos contadores do menu)
let cache = { valor: { total: 0, porRecado: {} }, em: 0 };
const VALIDADE = 30000;

// Devolve { total, porRecado: { [id]: n } }
export const useRecadosNaoLidos = (ativo) => {
  const [estado, setEstado] = useState(cache.valor);

  useEffect(() => {
    if (!ativo) return undefined;
    let vivo = true;
    const carregar = async () => {
      const { data, error } = await supabase.rpc('recados_nao_lidos');
      if (error) {
        console.error('Erro ao contar recados não lidos:', error);
        return;
      }
      const porRecado = Object.fromEntries((data || []).filter(l => l.nao_lidos > 0).map(l => [l.recado_id, l.nao_lidos]));
      cache = { valor: { total: Object.values(porRecado).reduce((a, b) => a + b, 0), porRecado }, em: Date.now() };
      if (vivo) setEstado(cache.valor);
    };
    if (Date.now() - cache.em > VALIDADE) carregar();
    const intervalo = setInterval(carregar, 60000);
    window.addEventListener(EVENTO_RECADOS, carregar);
    return () => {
      vivo = false;
      clearInterval(intervalo);
      window.removeEventListener(EVENTO_RECADOS, carregar);
    };
  }, [ativo]);

  return estado;
};
