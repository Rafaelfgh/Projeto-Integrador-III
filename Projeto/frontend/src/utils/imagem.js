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
