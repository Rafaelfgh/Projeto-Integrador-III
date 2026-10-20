import { useEffect, useState } from 'react';
import { supabase } from '../backend/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Nome do evento disparado quando uma ocorrência muda de status, para as
// bolinhas do menu se atualizarem na hora (sem esperar o próximo ciclo).
export const EVENTO_CONTADORES = 'habitare:contadores';
export const avisarMudancaOcorrencias = () => window.dispatchEvent(new Event(EVENTO_CONTADORES));

// Quantidades das bolinhas do menu do síndico/master:
// analise = ocorrências do mural em análise; pessoais = pessoais em análise;
// moradores_pendentes = moradores aguardando aprovação (bolinha do master).
// Guardados entre as trocas de tela: o menu mostra o último valor na hora e só
// busca de novo se já passou um tempinho (ou se alguém avisou que mudou).
// O cache é de UM usuário: trocou de conta, descarta (senão mostrava o número do anterior).
const ZERADO = { analise: 0, pessoais: 0, moradores_pendentes: 0 };
let cache = { usuario: null, valor: ZERADO, em: 0 };
const VALIDADE = 30000;

export const useContadoresGestao = (ativo) => {
  const usuario = useAuth().currentUser?.id ?? null;
  const [contadores, setContadores] = useState(cache.usuario === usuario ? cache.valor : ZERADO);

  useEffect(() => {
    if (!ativo || !usuario) return undefined;
    if (cache.usuario !== usuario) {
      cache = { usuario, valor: ZERADO, em: 0 };
      setContadores(ZERADO);
    }
    let vivo = true;
    const carregar = async () => {
      const { data, error } = await supabase.rpc('contadores_gestao');
      if (error) console.error('Erro ao carregar contadores:', error);
      if (data && cache.usuario === usuario) cache = { usuario, valor: data, em: Date.now() };
      if (vivo && data) setContadores(data);
    };
    if (Date.now() - cache.em > VALIDADE) carregar();
    const intervalo = setInterval(carregar, 60000);
    window.addEventListener(EVENTO_CONTADORES, carregar);
    return () => {
      vivo = false;
      clearInterval(intervalo);
      window.removeEventListener(EVENTO_CONTADORES, carregar);
    };
  }, [ativo, usuario]);

  return contadores;
};
