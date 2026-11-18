// Notificação no celular (só no app Android): guarda o token deste aparelho para tirá-lo ao sair da conta.
import { supabase } from '../backend/supabaseClient';
import { ehApp } from './appNativo';

let tokenAtual = null;

export const lembrarTokenPush = async (token) => {
  tokenAtual = token;
  const { error } = await supabase.rpc('registrar_dispositivo_push', { p_token: token, p_plataforma: 'android' });
  if (error) console.error('Push: não foi possível registrar o aparelho', error);
};

// Chamado no "Sair" ANTES do signOut (depois dele o banco já não sabe quem é o dono do token)
export const esquecerAparelhoPush = async () => {
  if (!ehApp || !tokenAtual) return;
  try {
    await supabase.rpc('remover_dispositivo_push', { p_token: tokenAtual });
  } catch { /* sem internet: o token some sozinho quando o Firebase o recusar */ }
  tokenAtual = null;
};
