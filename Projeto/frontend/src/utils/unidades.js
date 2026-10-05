// Escolha vazia do seletor Bloco → Andar → Apartamento (components/SeletorUnidade.jsx)
export const VAZIO_UNIDADE = { bloco: '', andar: '', apto: '' };

// Apartamento escolhido ("1201") ou '' se a escolha está incompleta
export const apartamentoEscolhido = (u) => (u.bloco && u.andar && u.apto ? apartamentoDe(u.andar, u.apto) : '');

// Numeração dos apartamentos: andar + 2 dígitos (1201 = 12º andar, apto 01; 803 = 8º andar, apto 03)
export const apartamentoDe = (andar, apto) => `${andar}${String(apto).padStart(2, '0')}`;

// Andar e posição a partir do número do apartamento ("1201" -> { andar: 12, apto: 1 })
export const partesDoApartamento = (numero) => {
  const n = Number(numero);
  if (!Number.isInteger(n) || n < 101) return null;
  return { andar: Math.floor(n / 100), apto: n % 100 };
};

// "20 andares · 4 por andar · 80 apartamentos"
export const resumoBloco = (b) => {
  const total = b.andares * b.aptos_por_andar;
  return `${b.andares} ${b.andares === 1 ? 'andar' : 'andares'} · ${b.aptos_por_andar} por andar · ${total} ${total === 1 ? 'apartamento' : 'apartamentos'}`;
};

// Nome do bloco para frases: "Torre Norte" fica como está; "A" vira "Bloco A"
export const rotuloBloco = (nome) => {
  const n = String(nome || '').trim();
  return /^(bloco|torre|edif[ií]cio|pr[eé]dio|ala)\b/i.test(n) ? n : `Bloco ${n}`;
};

// "Torre A · Apartamento 802"
export const descreverUnidade = (bloco, apartamento) => `${rotuloBloco(bloco)} · Apartamento ${apartamento}`;
