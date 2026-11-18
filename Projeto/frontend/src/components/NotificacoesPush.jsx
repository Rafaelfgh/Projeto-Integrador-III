import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PushNotifications } from '@capacitor/push-notifications';
import { ehApp } from '../services/appNativo';
import { lembrarTokenPush } from '../services/pushNativo';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../backend/supabaseClient';
import { destinoDaNotificacao } from '../utils/destinoNotificacao';

// Só no app Android: depois do login pede "Permitir notificações", cadastra o aparelho e,
// ao tocar numa notificação do celular, abre a mesma tela que o sininho abriria.
export default function NotificacoesPush() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const logado = !!currentUser?.id;
  const papel = currentUser?.role;

  useEffect(() => {
    if (!ehApp || !logado) return undefined;
    let ativo = true;
    const ouvintes = [];
    (async () => {
      let { receive } = await PushNotifications.checkPermissions();
      if (receive !== 'granted' && receive !== 'denied') ({ receive } = await PushNotifications.requestPermissions());
      if (receive !== 'granted' || !ativo) return;
      await PushNotifications.createChannel({
        id: 'habitare', name: 'Avisos do Habitare', description: 'Ocorrências, encomendas, recados e avisos',
        importance: 4, visibility: 1, lights: true, vibration: true,
      }).catch(() => {});
      ouvintes.push(await PushNotifications.addListener('registration', ({ value }) => lembrarTokenPush(value)));
      ouvintes.push(await PushNotifications.addListener('registrationError', (e) => console.error('Push:', e)));
      ouvintes.push(await PushNotifications.addListener('pushNotificationActionPerformed', async ({ notification }) => {
        const d = notification?.data || {};
        if (d.notificacao_id) supabase.from('notificacoes').update({ lida: true }).eq('id', d.notificacao_id).then(() => {});
        const destino = await destinoDaNotificacao(
          { tipo: d.tipo, referencia_tipo: d.referencia_tipo, referencia_id: d.referencia_id }, papel,
        );
        if (destino) navigate(destino);
      }));
      await PushNotifications.register();
    })().catch((e) => console.error('Push:', e));
    return () => { ativo = false; ouvintes.forEach((o) => o.remove()); };
  }, [logado, papel, navigate]);

  return null;
}
