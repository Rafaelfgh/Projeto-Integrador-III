import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GerenciarOcorrencia from './GerenciarOcorrencia';

// Síndico/master: com ?ocorrencia=<id> no endereço (ex.: clique numa notificação),
// abre o "Gerenciar" daquela ocorrência em qualquer tela. Fechar tira o parâmetro.
export default function AbrirOcorrenciaPorLink() {
  const { currentUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const id = params.get('ocorrencia');
  const ehGestao = currentUser?.role === 'SINDICO' || currentUser?.role === 'MASTER';
  if (!id || !ehGestao || !/^\d+$/.test(id)) return null;

  const fechar = () => {
    const novos = new URLSearchParams(params);
    novos.delete('ocorrencia');
    setParams(novos, { replace: true });
  };

  return <GerenciarOcorrencia key={id} ocorrenciaId={Number(id)} onFechar={fechar} />;
}
