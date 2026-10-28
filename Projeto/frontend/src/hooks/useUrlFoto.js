import { useEffect, useState } from 'react';
import { urlsFotosFuncionarios } from '../services/fotoFuncionario';

// Link temporário da foto de um funcionário (null enquanto carrega ou se não houver foto)
export const useUrlFoto = (caminho, versao = 0) => {
  const [estado, setEstado] = useState({ chave: null, url: null });
  const chave = caminho ? `${caminho}#${versao}` : null;

  useEffect(() => {
    if (!caminho) return undefined;
    let ativo = true;
    urlsFotosFuncionarios([caminho]).then(mapa => {
      if (ativo) setEstado({ chave: `${caminho}#${versao}`, url: mapa[caminho] || null });
    });
    return () => { ativo = false; };
  }, [caminho, versao]);

  return estado.chave === chave ? estado.url : null;
};
