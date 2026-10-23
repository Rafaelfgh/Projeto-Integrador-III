import React from 'react';
import {
  Droplets, Zap, Wrench, SprayCan, Sprout, Shield, Building2, HardHat, SquareParking, Volume2, CircleHelp, Gavel,
} from 'lucide-react';
import { placaDaOcorrencia } from '../utils/placa';
import { classeStatus } from '../utils/statusOcorrencia';

// Pictogramas das categorias (uma família de ícones, traço único), como na sinalização do prédio
const PICTOGRAMA = {
  hidraulica: Droplets, eletrica: Zap, manutencao: Wrench, limpeza: SprayCan, jardinagem: Sprout,
  seguranca: Shield, areas_comuns: Building2, estrutural: HardHat, garagem: SquareParking,
  barulho: Volume2, reclamacao: Gavel,
};

export const Pictograma = ({ categoria, tamanho = 20, titulo }) => {
  const Icone = PICTOGRAMA[categoria] || CircleHelp;
  return (
    <span className="placa-picto" title={titulo} aria-hidden={titulo ? undefined : true}>
      <Icone size={tamanho} strokeWidth={2} />
    </span>
  );
};

// Cabeçalho-placa do cartão: onde é (numerais grandes) + pictograma da categoria
export const PlacaLocal = ({ ocorrencia, unidade, categoriaNome, extra }) => {
  const p = placaDaOcorrencia(ocorrencia, unidade);
  return (
    <div className="placa-cabeca">
      <div className="placa-local">
        <span className="placa-rotulo">{p.rotulo}</span>
        <span className={`placa-valor${p.longo ? ' placa-valor-longo' : ''}`}>{p.valor}</span>
      </div>
      {extra}
      <Pictograma categoria={ocorrencia?.categoria} titulo={categoriaNome} />
    </div>
  );
};

const NOME_STATUS = { 'Aberta': 'Aberta', 'Em Análise': 'Em análise', 'Em Andamento': 'Em andamento', 'Resolvida': 'Concluída' };

// Faixa de status no pé do cartão, como a faixa de uma placa
export const FaixaStatus = ({ status, protocolo, children }) => (
  <div className={`placa-faixa ${classeStatus(status)}`}>
    <span className="placa-faixa-status" key={status}>{NOME_STATUS[status] || status}</span>
    {protocolo && <span className="placa-faixa-protocolo">{protocolo}</span>}
    {children}
  </div>
);
