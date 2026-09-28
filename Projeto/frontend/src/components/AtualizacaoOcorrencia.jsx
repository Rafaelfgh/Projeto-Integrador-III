import React from 'react';
import { CheckCircle2, Wrench } from 'lucide-react';
import { useVisualizadorImagem } from '../contexts/visualizadorImagem';
import './AtualizacaoOcorrencia.css';

const formatar = (d) => (d
  ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '');

// Andamento e conclusão informados pela equipe/síndico (visível a quem vê a ocorrência)
const AtualizacaoOcorrencia = ({ ocorrencia, nomes = {}, fotos = {} }) => {
  const abrirImagem = useVisualizadorImagem();
  const nome = (id) => nomes[id] || 'Administração';
  const provas = ocorrencia.conclusao_evidencias || [];

  if (ocorrencia.status === 'Resolvida' && (ocorrencia.conclusao_descricao || provas.length > 0)) {
    return (
      <div className="atu atu-concluida">
        <span className="atu-rotulo">
          <CheckCircle2 size={13} /> Concluída por {nome(ocorrencia.concluida_por)} · {formatar(ocorrencia.concluida_em)}
        </span>
        {ocorrencia.conclusao_descricao && <p className="atu-texto">{ocorrencia.conclusao_descricao}</p>}
        {provas.length > 0 && (
          <div className="atu-fotos">
            {provas.map(caminho => (
              fotos[caminho]
                ? (
                  <button key={caminho} type="button" className="img-zoom" title="Ampliar foto da prova" onClick={() => {
                    const urls = provas.map(c => fotos[c]).filter(Boolean);
                    abrirImagem(urls, urls.indexOf(fotos[caminho]));
                  }}>
                    <img src={fotos[caminho]} alt="Prova da conclusão" />
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
      <div className="atu atu-andamento">
        <span className="atu-rotulo">
          <Wrench size={13} /> Em andamento · {nome(ocorrencia.andamento_por)} · {formatar(ocorrencia.andamento_em)}
        </span>
        <p className="atu-texto">{ocorrencia.andamento_descricao}</p>
      </div>
    );
  }

  return null;
};

export default AtualizacaoOcorrencia;
