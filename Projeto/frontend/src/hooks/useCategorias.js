import { useEffect, useState } from 'react';
import { supabase } from '../backend/supabaseClient';

// Lista fixa de categorias de ocorrência (tabela categorias_ocorrencia).
// É a mesma lista usada nas especialidades dos funcionários.
let cache = null;
let pendente = null;

const carregar = () => {
  if (!pendente) {
    pendente = supabase
      .from('categorias_ocorrencia')
      .select('slug, nome, descricao, icone')
      .eq('ativo', true)
      .order('ordem')
      .then(({ data, error }) => {
        if (error) {
          pendente = null;
          throw error;
        }
        cache = data || [];
        return cache;
      });
  }
  return pendente;
};

export const useCategorias = () => {
  const [categorias, setCategorias] = useState(cache || []);

  useEffect(() => {
    if (cache) return;
    let ativo = true;
    carregar()
      .then(lista => { if (ativo) setCategorias(lista); })
      .catch(err => console.error('Erro ao carregar categorias:', err));
    return () => { ativo = false; };
  }, []);

  const porSlug = Object.fromEntries(categorias.map(c => [c.slug, c]));
  const rotulo = (slug) => {
    const c = porSlug[slug];
    return c ? `${c.icone} ${c.nome}` : (slug || 'Outros');
  };

  return { categorias, porSlug, rotulo };
};
