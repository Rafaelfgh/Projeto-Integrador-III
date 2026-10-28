// Máscaras e regras dos campos de cadastro.
// Regra do projeto: nenhum campo aceita caractere especial, exceto a senha.

const soDigitos = (valor) => String(valor || '').replace(/\D/g, '');

// Letras (com acento: á, é, ã, ç...) e espaços — nomes, cidade.
// normalize('NFC') junta letra + acento digitados separadamente num só caractere.
export const somenteLetras = (valor) =>
  String(valor || '').normalize('NFC').replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, '').replace(/ {2,}/g, ' ').replace(/^ /, '');

// Letras (com acento), números e espaços — nome do condomínio, endereço
export const letrasENumeros = (valor) =>
  String(valor || '').normalize('NFC').replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 ]/g, '').replace(/ {2,}/g, ' ').replace(/^ /, '');

// No Mac o acento é uma "tecla morta": digita-se ´ e depois a letra. Enquanto o
// acento está sendo composto o valor não é filtrado (senão o ´ some e o "é"
// nunca se forma); a máscara é aplicada no onCompositionEnd.
export const valorDigitado = (evento, mascara) =>
  evento.nativeEvent?.isComposing ? evento.target.value : mascara(evento.target.value);

// Só números, com limite de dígitos — apartamento
export const somenteNumeros = (valor, maximo) => soDigitos(valor).slice(0, maximo);

// Uma letra, sempre maiúscula — bloco
export const mascaraBloco = (valor) => String(valor || '').replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase();

// 000.000.000-00
export const mascaraCPF = (valor) => {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

// 00.000.000/0000-00
export const mascaraCNPJ = (valor) => {
  const d = soDigitos(valor).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

// (00) 00000-0000 — DDD com 2 dígitos + número com 9
export const mascaraTelefone = (valor) => {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

// E-mail em minúsculas: letras, números, um único "@" e o "." do domínio
export const mascaraEmail = (valor) => {
  const limpo = String(valor || '').toLowerCase().replace(/[^a-z0-9@.]/g, '');
  const arroba = limpo.indexOf('@');
  return arroba === -1 ? limpo : limpo.slice(0, arroba + 1) + limpo.slice(arroba + 1).replace(/@/g, '');
};

// Validações para o envio do formulário
export const cpfCompleto      = (valor) => soDigitos(valor).length === 11;
export const cnpjCompleto     = (valor) => soDigitos(valor).length === 14;
export const telefoneCompleto = (valor) => soDigitos(valor).length === 11;
export const emailValido      = (valor) => /^[a-z0-9]+(\.[a-z0-9]+)*@[a-z0-9]+(\.[a-z0-9]+)+$/.test(valor);

// Tamanho máximo de cada campo já formatado (para o maxLength do input)
export const TAMANHO = {
  nome: 80,
  cpf: 14,
  cnpj: 18,
  telefone: 15,
  bloco: 1,
  apartamento: 5,
  email: 100,
  condominio: 80,
  endereco: 120,
  cidade: 60,
};
