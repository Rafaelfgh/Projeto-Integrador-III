// Testes das regras do Habitare que não dependem de tela nem de banco.
// Rodar: npm test (também roda sozinho no GitHub a cada push — ver .github/workflows/ci.yml)
import { describe, it, expect } from 'vitest';
import { apartamentoDe, apartamentoEscolhido, partesDoApartamento, rotuloBloco, descreverUnidade, resumoBloco, VAZIO_UNIDADE } from './unidades';
import { protocoloOcorrencia, protocoloReclamacao, protocoloEncomenda } from './protocolo';
import { combinaBusca, normalizar } from './busca';
import { lerReclamacao, unidadeTexto } from './reclamacao';
import { mascaraCPF, mascaraTelefone, mascaraEmail, mascaraBloco, emailValido, cpfCompleto, somenteLetras } from './mascaras';
import { separarLocal, placaDaOcorrencia } from './placa';
import { resumoDias, horaCurta } from './dependencias';
import { passaFiltroData, anosDe, FILTRO_DATA_VAZIO } from '../components/FiltroData';

describe('unidades (Bloco → Andar → Apartamento)', () => {
  it('monta o número do apartamento: andar + 2 dígitos', () => {
    expect(apartamentoDe(12, 4)).toBe('1204');
    expect(apartamentoDe(8, 3)).toBe('803');
  });
  it('só devolve o apartamento com bloco, andar e apto escolhidos', () => {
    expect(apartamentoEscolhido({ bloco: 'B', andar: 12, apto: 4 })).toBe('1204');
    expect(apartamentoEscolhido({ ...VAZIO_UNIDADE, bloco: 'B', andar: 12 })).toBe('');
  });
  it('separa andar e posição do número', () => {
    expect(partesDoApartamento('1204')).toEqual({ andar: 12, apto: 4 });
    expect(partesDoApartamento('99')).toBeNull();
    expect(partesDoApartamento('abc')).toBeNull();
  });
  it('escreve o nome do bloco para frases', () => {
    expect(rotuloBloco('A')).toBe('Bloco A');
    expect(rotuloBloco('Torre Norte')).toBe('Torre Norte');
    expect(descreverUnidade('B', '1204')).toBe('Bloco B · Apartamento 1204');
  });
  it('resume o tamanho do bloco no singular e no plural', () => {
    expect(resumoBloco({ andares: 15, aptos_por_andar: 4 })).toBe('15 andares · 4 por andar · 60 apartamentos');
    expect(resumoBloco({ andares: 1, aptos_por_andar: 1 })).toBe('1 andar · 1 por andar · 1 apartamento');
  });
});

describe('protocolos', () => {
  it('usa prefixo, ano e número com 4 dígitos', () => {
    expect(protocoloOcorrencia(10, '2026-06-15T12:00:00')).toBe('OCO-2026-0010');
    expect(protocoloReclamacao(7, '2025-06-15T12:00:00')).toBe('REC-2025-0007');
    expect(protocoloEncomenda(3, '2026-06-15T12:00:00')).toBe('ENC-2026-0003');
  });
});

describe('busca', () => {
  it('ignora acentos e maiúsculas', () => {
    expect(normalizar('Água ÇÃO')).toBe('agua cao');
  });
  it('procura cada palavra, em qualquer ordem e em qualquer campo', () => {
    expect(combinaBusca('agua banheiro', ['Vazamento de Água', 'no banheiro'])).toBe(true);
    expect(combinaBusca('agua cozinha', ['Vazamento de Água', 'no banheiro'])).toBe(false);
  });
  it('busca vazia mostra tudo e campos vazios não quebram', () => {
    expect(combinaBusca('   ', ['qualquer'])).toBe(true);
    expect(combinaBusca('1204', [null, undefined, 'Apto 1204'])).toBe(true);
  });
});

describe('reclamações', () => {
  it('lê tipo, data, hora e texto gravados', () => {
    const r = lerReclamacao('Tipo de Violação: barulho\nData: 2026-11-18\nHora: 23:10\n\nDescrição do Morador: Som alto');
    expect(r).toEqual({ tipo: 'Barulho fora do horário', quando: '18/11/2026 · 23:10', texto: 'Som alto' });
  });
  it('aguenta texto sem o formato (registros antigos)', () => {
    expect(lerReclamacao('Só um texto')).toEqual({ tipo: 'Reclamação', quando: '', texto: 'Só um texto' });
  });
  it('escreve a unidade e limpa prefixos antigos', () => {
    expect(unidadeTexto('b', '801')).toBe('Bloco B · Apto 801');
    expect(unidadeTexto('Ver unidade', 'AP 802')).toBe('Apto 802');
  });
});

describe('máscaras dos cadastros', () => {
  it('CPF e telefone no formato brasileiro', () => {
    expect(mascaraCPF('12345678901')).toBe('123.456.789-01');
    expect(mascaraCPF('123.456')).toBe('123.456');
    expect(mascaraTelefone('61999998888')).toBe('(61) 99999-8888');
    expect(cpfCompleto('123.456.789-01')).toBe(true);
  });
  it('e-mail em minúsculas com um único @', () => {
    expect(mascaraEmail('Davi@@Teste.com')).toBe('davi@teste.com');
    expect(emailValido('davi@teste.com')).toBe(true);
    expect(emailValido('davi@teste')).toBe(false);
  });
  it('bloco é uma letra maiúscula e nome só aceita letras', () => {
    expect(mascaraBloco('b2')).toBe('B');
    expect(somenteLetras('José  da Silva!1')).toBe('José da Silva');
  });
});

describe('placa da ocorrência', () => {
  it('separa o local que a tela anexa no fim da descrição', () => {
    expect(separarLocal('Vazamento\n\nLocal Relacionado: Garagem')).toEqual({ texto: 'Vazamento', local: 'Garagem' });
  });
  it('ocorrência pessoal mostra a unidade; sem local vira "Área comum"', () => {
    expect(placaDaOcorrencia({ privacidade: 'pessoal' }, { bloco: 'B', apartamento: '1204' }).valor).toBe('Bloco B · Apto 1204');
    expect(placaDaOcorrencia({ descricao: 'Sem local' }).valor).toBe('Área comum');
  });
});

describe('filtro por data', () => {
  const dia = new Date(2026, 10, 18, 10, 0); // 18/11/2026 no horário local
  it('sem filtro passa tudo; dia, mês e ano são independentes', () => {
    expect(passaFiltroData(dia, FILTRO_DATA_VAZIO)).toBe(true);
    expect(passaFiltroData(dia, { dia: '18', mes: '', ano: '' })).toBe(true);
    expect(passaFiltroData(dia, { dia: '', mes: '11', ano: '2026' })).toBe(true);
    expect(passaFiltroData(dia, { dia: '19', mes: '', ano: '' })).toBe(false);
    expect(passaFiltroData(null, { dia: '18', mes: '', ano: '' })).toBe(false);
  });
  it('lista os anos dos dados, do mais novo para o mais antigo, sem repetir', () => {
    expect(anosDe([new Date(2025, 5, 1), new Date(2026, 1, 1), null, new Date(2026, 3, 1)])).toEqual([2026, 2025]);
  });
});

describe('dependências e reservas', () => {
  it('resume os dias de funcionamento', () => {
    expect(resumoDias([0, 1, 2, 3, 4, 5, 6])).toBe('todos os dias');
    expect(resumoDias([1, 2, 3, 4, 5])).toBe('Seg a Sex');
    expect(resumoDias([1, 3, 5])).toBe('Seg, Qua, Sex');
  });
  it('mostra a hora sem os segundos', () => {
    expect(horaCurta('08:00:00')).toBe('08:00');
  });
});
