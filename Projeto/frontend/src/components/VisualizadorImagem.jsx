import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { VisualizadorImagemContext } from '../contexts/visualizadorImagem';
import './VisualizadorImagem.css';

// Mostra a imagem clicada ampliada e centralizada, sem sair da página.
// Fecha com Esc, no X ou clicando fora; setas navegam entre as imagens do grupo.
const VisualizadorImagemProvider = ({ children }) => {
  const [estado, setEstado] = useState(null); // { imagens: string[], indice: number }

  const abrirImagem = useCallback((imagens, indice = 0) => {
    const lista = (Array.isArray(imagens) ? imagens : [imagens]).filter(Boolean);
    if (lista.length > 0) setEstado({ imagens: lista, indice });
  }, []);

  const fechar = useCallback(() => setEstado(null), []);

  const mover = useCallback((passo) => {
    setEstado(prev => prev && {
      ...prev,
      indice: (prev.indice + passo + prev.imagens.length) % prev.imagens.length,
    });
  }, []);

  useEffect(() => {
    if (!estado) return undefined;
    const aoTeclar = (e) => {
      if (e.key === 'Escape') fechar();
      if (e.key === 'ArrowRight') mover(1);
      if (e.key === 'ArrowLeft') mover(-1);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [estado, fechar, mover]);

  const varias = estado?.imagens.length > 1;

  return (
    <VisualizadorImagemContext.Provider value={abrirImagem}>
      {children}
      {estado && (
        <div className="vi-overlay" role="dialog" aria-modal="true" aria-label="Visualizar imagem" onClick={fechar}>
          <button className="vi-botao vi-fechar" onClick={fechar} aria-label="Fechar"><X size={22} /></button>

          {varias && (
            <button className="vi-botao vi-anterior" onClick={(e) => { e.stopPropagation(); mover(-1); }} aria-label="Imagem anterior">
              <ChevronLeft size={26} />
            </button>
          )}

          <img
            className="vi-imagem"
            src={estado.imagens[estado.indice]}
            alt={`Imagem ${estado.indice + 1} de ${estado.imagens.length}`}
            onClick={(e) => e.stopPropagation()}
          />

          {varias && (
            <>
              <button className="vi-botao vi-proxima" onClick={(e) => { e.stopPropagation(); mover(1); }} aria-label="Próxima imagem">
                <ChevronRight size={26} />
              </button>
              <span className="vi-contador">{estado.indice + 1} / {estado.imagens.length}</span>
            </>
          )}
        </div>
      )}
    </VisualizadorImagemContext.Provider>
  );
};

export default VisualizadorImagemProvider;
