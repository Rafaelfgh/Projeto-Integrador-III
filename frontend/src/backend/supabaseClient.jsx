// src/supabaseClient.jsx
import { createClient } from '@supabase/supabase-js';

// Obter as variáveis de ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar se as variáveis estão configuradas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão configuradas.');
}

// Criar o cliente do Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);