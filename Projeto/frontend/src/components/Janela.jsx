import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import './Janela.css';

// Janela padrão do site para cadastrar, editar, confirmar e avisar.
//  - icone + tom ('padrao' | 'perigo' | 'sucesso' | 'erro') dão a cor do selo do topo;
//  - largura: 'pequena' (confirmações/avisos), 'media' ou 'grande';
//  - as="form" + onSubmit: a janela inteira vira o formulário (o botão do rodapé envia);
//  - bloqueada: enquanto salva, não fecha (nem no X, nem no Esc).
// Classes para o conteúdo: janela-campo, janela-input, janela-grade, janela-ajuda,
// janela-texto, janela-ficha, janela-pessoa e os botões janela-btn-*.
export default function Janela({
  titulo,
  subtitulo,
  icone: Icone,
  tom = 'padrao',
  largura = 'media',
  onFechar,
  bloqueada = false,
  fecharAoClicarFora = false,
  as = 'div',
  onSubmit,
  rodape,
  children,
}) {
  const idTitulo = useId();
  const Tag = as;

  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === 'Escape' && !bloqueada) onFechar?.();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [onFechar, bloqueada]);

  const clicarFora = (e) => {
    if (fecharAoClicarFora && !bloqueada && e.target === e.currentTarget) onFechar?.();
  };

  return (
    <div className="janela-fundo" onMouseDown={clicarFora}>
      <Tag
        className={`janela janela-${largura}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        onSubmit={onSubmit}
      >
        <header className="janela-topo">
          {Icone && <span className={`janela-selo janela-selo-${tom}`}><Icone size={18} /></span>}
          <div className="janela-titulos">
            <h2 id={idTitulo}>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          {onFechar && (
            <button type="button" className="janela-fechar" onClick={onFechar} disabled={bloqueada} aria-label="Fechar">
              <X size={18} />
            </button>
          )}
        </header>
        <div className="janela-corpo">{children}</div>
        {rodape && <footer className="janela-rodape">{rodape}</footer>}
      </Tag>
    </div>
  );
}
