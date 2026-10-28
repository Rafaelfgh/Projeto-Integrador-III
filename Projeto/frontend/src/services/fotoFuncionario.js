import { supabase } from '../backend/supabaseClient';

// Fotos dos funcionários ficam na pasta privada "funcionarios": a tela pede links
// temporários (1 hora) e guarda por 55 minutos para não pedir de novo a cada tela.
const cache = new Map(); // caminho -> { url, expira }

export const urlsFotosFuncionarios = async (caminhos) => {
  const agora = Date.now();
  const unicos = [...new Set(caminhos.filter(Boolean))];
  const faltam = unicos.filter(c => !(cache.get(c)?.expira > agora));
  if (faltam.length > 0) {
    const { data, error } = await supabase.storage.from('funcionarios').createSignedUrls(faltam, 3600);
    if (error) console.error('Erro ao gerar links das fotos:', error);
    (data || []).forEach(d => {
      if (d.signedUrl) cache.set(d.path, { url: d.signedUrl, expira: agora + 55 * 60 * 1000 });
    });
  }
  return Object.fromEntries(unicos.map(c => [c, cache.get(c)?.url]).filter(([, url]) => url));
};

// Depois de trocar a foto (mesmo caminho), força um link novo
export const esquecerFoto = (caminho) => cache.delete(caminho);
