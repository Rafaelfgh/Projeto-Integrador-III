import React from 'react';
import { CheckCircle2, Wrench } from 'lucide-react';

// Lugar reservado no mural quando ainda não há andamento/conclusão para mostrar
const SITUACAO_VAZIA = {
  'Aberta': 'Aguardando atendimento da equipe.',
  'Em Análise': 'Em análise pelo síndico.',
  'Em Andamento': 'A equipe já está cuidando disso.',
  'Resolvida': 'Concluída sem descrição da equipe.',
};
import { useVisualizadorImagem } from '../contexts/visualizadorImagem';
import './AtualizacaoOcorrencia.css';

const formatar = (d) => (d
  ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '');

// Andamento e conclusão informados pela equipe/síndico (visível a quem vê a ocorrência).
// compacto: versão do mural, de altura fixa — texto em até 2 linhas e fotos ao lado (até 2, "+N")
const MAX_FOTOS_COMPACTO = 2;
const AtualizacaoOcorrencia = ({ ocorrencia, nomes = {}, fotos = {}, compacto = false }) => {
  const abrirImagem = useVisualizadorImagem();
  const nome = (id) => nomes[id] || 'Administração';
  const provas = ocorrencia.conclusao_evidencias || [];

  if (ocorrencia.status === 'Resolvida' && (ocorrencia.conclusao_descricao || provas.length > 0)) {
    return (
      <div className={`atu atu-concluida${compacto ? ' atu-compacto' : ''}`}>
        <span className="atu-rotulo">
          <CheckCircle2 size={13} /> Concluída por {ocorrencia.concluida_por_nome || nome(ocorrencia.concluida_por)} · {formatar(ocorrencia.concluida_em)}
        </span>
        {ocorrencia.conclusao_descricao && <p className="atu-texto" title={compacto ? ocorrencia.conclusao_descricao : undefined}>{ocorrencia.conclusao_descricao}</p>}
        {provas.length > 0 && (
          <div className="atu-fotos">
            {(compacto ? provas.slice(0, MAX_FOTOS_COMPACTO) : provas).map((caminho, i) => (
              fotos[caminho]
                ? (
                  <button key={caminho} type="button" className="img-zoom" title="Ampliar foto da prova" onClick={() => {
                    const urls = provas.map(c => fotos[c]).filter(Boolean);
                    abrirImagem(urls, urls.indexOf(fotos[caminho]));
                  }}>
                    <img src={fotos[caminho]} alt="Prova da conclusão" />
                    {compacto && i === MAX_FOTOS_COMPACTO - 1 && provas.length > MAX_FOTOS_COMPACTO && (
                      <span className="atu-fotos-mais">+{provas.length - MAX_FOTOS_COMPACTO}</span>
                    )}
                  </button>
                )
                : <span key={caminho} className="atu-foto-carregando" aria-label="Carregando foto" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (ocorrencia.status === 'Em Andamento' && ocorrencia.andamento_descricao) {
    return (
      <div className={`atu atu-andamento${compacto ? ' atu-compacto' : ''}`}>
        <span className="atu-rotulo">
          <Wrench size={13} /> Em andamento · {ocorrencia.andamento_por_nome || nome(ocorrencia.andamento_por)} · {formatar(ocorrencia.andamento_em)}
        </span>
        <p className="atu-texto" title={compacto ? ocorrencia.andamento_descricao : undefined}>{ocorrencia.andamento_descricao}</p>
      </div>
    );
  }

  if (compacto) {
    return (
      <div className="atu atu-compacto atu-vazio">
        <span className="atu-rotulo"><Wrench size={13} /> Andamento</span>
        <p className="atu-texto">{SITUACAO_VAZIA[ocorrencia.status] || 'Sem atualização ainda.'}</p>
      </div>
    );
  }

  return null;
};

export default AtualizacaoOcorrencia;
