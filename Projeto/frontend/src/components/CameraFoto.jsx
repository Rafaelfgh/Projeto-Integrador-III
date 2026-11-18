import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X, RefreshCw, Check, RotateCcw, Loader2 } from 'lucide-react';
import './CameraFoto.css';

// "Tirar foto" no computador (webcam, visor espelhado): pede acesso à câmera (getUserMedia),
// mostra a imagem ao vivo, captura e devolve um File JPEG para quem chamou (onFoto).
const MENSAGEM_ERRO = {
  NotAllowedError: 'O acesso à câmera foi negado. Libere a câmera nas permissões do navegador (ou do app) e tente de novo.',
  NotFoundError: 'Nenhuma câmera foi encontrada neste aparelho.',
  NotReadableError: 'A câmera está sendo usada por outro aplicativo. Feche-o e tente de novo.',
};

const JanelaCamera = ({ onFoto, onFechar }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [erro, setErro] = useState(null);
  const [pronta, setPronta] = useState(false);
  const [foto, setFoto] = useState(null); // { file, url }

  const parar = () => streamRef.current?.getTracks().forEach(t => t.stop());

  const ligar = useCallback(async () => {
    parar();
    setPronta(false);
    setErro(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro('Este navegador não permite usar a câmera por aqui. Use a opção de escolher uma foto.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setPronta(true);
    } catch (e) {
      setErro(MENSAGEM_ERRO[e?.name] || 'Não foi possível abrir a câmera. Tente de novo.');
    }
  }, []);

  useEffect(() => {
    if (!foto) ligar();
    return parar;
  }, [ligar, foto]);

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onFechar(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onFechar]);

  const capturar = () => {
    const v = videoRef.current;
    if (!v?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d').drawImage(v, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
      parar();
      setFoto({ file, url: URL.createObjectURL(blob) });
    }, 'image/jpeg', 0.9);
  };

  const usar = () => {
    onFoto(foto.file);
    onFechar();
  };

  return createPortal(
    <div className="cam-fundo" role="dialog" aria-modal="true" aria-label="Tirar foto" onClick={(e) => e.stopPropagation()}>
      <div className="cam-caixa">
        <div className="cam-topo">
          <strong><Camera size={18} /> Tirar foto</strong>
          <button type="button" className="cam-fechar" onClick={onFechar} aria-label="Fechar"><X size={20} /></button>
        </div>

        <div className="cam-visor">
          {foto ? (
            <img src={foto.url} alt="Foto tirada" />
          ) : (
            <video ref={videoRef} playsInline muted autoPlay className="cam-espelho" />
          )}
          {!foto && !pronta && !erro && <span className="cam-aviso"><Loader2 size={22} className="cam-girando" /> Abrindo a câmera...</span>}
          {erro && <p className="cam-aviso cam-erro" role="alert">{erro}</p>}
        </div>

        <div className="cam-acoes">
          {foto ? (<>
            <button type="button" className="cam-btn" onClick={() => setFoto(null)}><RotateCcw size={16} /> Tirar outra</button>
            <button type="button" className="cam-btn cam-btn-pri" onClick={usar}><Check size={16} /> Usar foto</button>
          </>) : erro ? (
            <button type="button" className="cam-btn cam-btn-pri" onClick={ligar}><RefreshCw size={16} /> Tentar de novo</button>
          ) : (<>
            <button type="button" className="cam-disparo" onClick={capturar} disabled={!pronta} aria-label="Capturar foto" />
          </>)}
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Celular/tablet (app e navegador): abre o app de câmera do aparelho e a foto volta para cá.
// Computador: não há app de câmera, então usa a janela com a webcam acima.
const temTelaDeToque = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

// Botão que abre a câmera. children muda o texto; className segue o estilo de cada tela.
export default function BotaoCamera({ onFoto, className = '', disabled = false, children }) {
  const [aberta, setAberta] = useState(false);
  const inputRef = useRef(null);
  const abrir = (e) => {
    e.stopPropagation();
    if (temTelaDeToque()) inputRef.current?.click();
    else setAberta(true);
  };
  const recebida = (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = ''; // permite tirar outra em seguida
    if (arquivo) onFoto(arquivo);
  };
  return (
    <>
      <button type="button" className={className} disabled={disabled} onClick={abrir}>
        {children || <><Camera size={16} /> Tirar foto</>}
      </button>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={recebida} onClick={(e) => e.stopPropagation()} />
      {aberta && <JanelaCamera onFoto={onFoto} onFechar={() => setAberta(false)} />}
    </>
  );
}
