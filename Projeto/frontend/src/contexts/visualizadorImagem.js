import { createContext, useContext } from 'react';

// abrirImagem(listaDeUrls, indiceInicial) — abre o visualizador sobre a página
export const VisualizadorImagemContext = createContext(() => {});

export const useVisualizadorImagem = () => useContext(VisualizadorImagemContext);
