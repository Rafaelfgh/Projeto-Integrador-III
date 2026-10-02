// Reduz fotos antes do envio (celulares geram arquivos de 3–8 MB; o Storage grátis tem 1 GB).
// Lado maior até 1600 px, JPEG 80%. Se algo falhar, envia o arquivo original.
export const reduzirImagem = async (arquivo, ladoMaximo = 1600, qualidade = 0.8) => {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
    if (escala === 1 && arquivo.size <= 500 * 1024) return arquivo;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', qualidade));
    if (!blob || blob.size >= arquivo.size) return arquivo;
    const nome = arquivo.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], nome, { type: 'image/jpeg' });
  } catch {
    return arquivo;
  }
};

// Foto de perfil do funcionário no formato 3x4 (300x400 px): recorta o centro (um pouco
// acima do meio, onde costuma estar o rosto) e reduz — nunca sobe uma foto gigante.
// Devolve a imagem em base64 (data URL JPEG). Lança erro se o arquivo não for imagem.
export const fotoRetrato = async (arquivo, largura = 300, altura = 400) => {
  const bitmap = await createImageBitmap(arquivo);
  const proporcao = largura / altura;
  let recorteL = bitmap.width;
  let recorteA = bitmap.height;
  if (recorteL / recorteA > proporcao) recorteL = recorteA * proporcao;
  else recorteA = recorteL / proporcao;
  const x = (bitmap.width - recorteL) / 2;
  const y = (bitmap.height - recorteA) * 0.3;

  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // PNG transparente vira fundo branco (JPEG não tem transparência)
  ctx.fillRect(0, 0, largura, altura);
  ctx.drawImage(bitmap, x, y, recorteL, recorteA, 0, 0, largura, altura);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', 0.85);
};
