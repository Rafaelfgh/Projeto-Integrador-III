import { supabase } from '../backend/supabaseClient';

// Filtro de palavrões: mesma lista e mesma regra do banco
// (private.palavras_bloqueadas / private.contem_palavrao). A tela avisa antes de
// enviar; o banco confere de novo e recusa de qualquer jeito.
export const MSG_PALAVRAO = 'O texto contém palavras impróprias. Revise e tente de novo.';

const DE   = 'áàâãäåéèêëíìîïóòôõöúùûüçñ0134@57$';
const PARA = 'aaaaaaeeeeiiiiooooouuuucnoieaasts';

let lista = null;
const carregarLista = () => {
  lista ||= supabase.rpc('lista_palavras_bloqueadas').then(({ data, error }) => {
    if (error) {
      lista = null; // tenta de novo na próxima vez; o banco continua barrando
      return [];
    }
    return data || [];
  });
  return lista;
};

const normalizar = (texto) =>
  Array.from((texto || '').normalize('NFC').toLowerCase(), c => {
    const i = DE.indexOf(c);
    return i >= 0 ? PARA[i] : c;
  }).join('');

// Compara palavra por palavra: "computador" não é barrado por conter "puta".
// Entrada terminada em '*' vale como prefixo (ex.: 'caralh*').
export const contemPalavrao = async (...textos) => {
  const palavras = await carregarLista();
  return textos.some(texto => normalizar(texto).split(/[^a-z]+/).some(token =>
    token && palavras.some(p => (p.endsWith('*') ? token.startsWith(p.slice(0, -1)) : token === p))
  ));
};

// Para usar dentro de ações com try/catch: interrompe com a mensagem padrão
export const garantirSemPalavrao = async (...textos) => {
  if (await contemPalavrao(...textos)) throw new Error(MSG_PALAVRAO);
};
