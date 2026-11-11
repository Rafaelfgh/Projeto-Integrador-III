// src/supabaseClient.jsx
import { createClient, processLock } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

// Obter as variáveis de ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar se as variáveis estão configuradas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão configuradas.');
}

// Criar o cliente do Supabase (Público)
// No app Android a trava padrão da sessão (navigator.locks) pode emperrar quando o app vai
// para segundo plano ou volta do login do Google, deixando login/sessão parados para sempre.
// Lá usamos a trava em memória (processLock), que não depende do navegador.
const opcoes = Capacitor.isNativePlatform()
  ? { auth: { lock: processLock, lockAcquireTimeout: 5000 } }
  : {};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opcoes);

// O cliente Admin foi removido porque o Supabase bloqueia a Service Role Key no navegador.