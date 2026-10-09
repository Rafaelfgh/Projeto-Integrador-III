// Busca usada em todas as telas: ignora acentos e maiúsculas e procura cada
// palavra digitada separadamente, em qualquer ordem, em qualquer um dos campos.
// Ex.: "agua banheiro" acha "Vazamento de Água no banheiro".
export const normalizar = (texto) =>
  String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const combinaBusca = (termo, campos) => {
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return true;
  const texto = normalizar(campos.filter(Boolean).join(' '));
  return palavras.every(p => texto.includes(p));
};
