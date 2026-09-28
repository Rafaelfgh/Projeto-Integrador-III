import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../backend/supabaseClient';

// Nome do evento disparado quando uma ocorrência muda de status, para as
// bolinhas do menu se atualizarem na hora (sem esperar o próximo ciclo).
export const EVENTO_CONTADORES = 'habitare:contadores';
export const avisarMudancaOcorrencias = () => window.dispatchEvent(new Event(EVENTO_CONTADORES));

// Quantidades das bolinhas do menu do síndico/master:
// analise = ocorrências do mural em análise; pessoais = pessoais em análise.
export const useContadoresGestao = (ativo) => {
  const [contadores, setContadores] = useState({ analise: 0, pessoais: 0 });
  const { pathname } = useLocation();

  useEffect(() => {
    if (!ativo) return undefined;
    let vivo = true;
    const carregar = async () => {
      const { data, error } = await supabase.rpc('contadores_gestao');
      if (error) console.error('Erro ao carregar contadores:', error);
      if (vivo && data) setContadores(data);
    };
    carregar();
    const intervalo = setInterval(carregar, 60000);
    window.addEventListener(EVENTO_CONTADORES, carregar);
    return () => {
      vivo = false;
      clearInterval(intervalo);
      window.removeEventListener(EVENTO_CONTADORES, carregar);
    };
  }, [ativo, pathname]);

  return contadores;
};
