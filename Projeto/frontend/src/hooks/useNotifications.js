import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../backend/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Lista guardada entre as trocas de tela (o Realtime avisa das novas)
let cache = { usuario: null, lista: [], em: 0 };
const VALIDADE = 60000;

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const doCache = cache.usuario === currentUser?.id ? cache.lista : [];
  const [notifications, setNotificationsEstado] = useState(doCache);
  const [unreadCount, setUnreadCount] = useState(doCache.filter(n => !n.lida).length);
  const [loading, setLoading] = useState(doCache.length === 0 && cache.usuario !== currentUser?.id);
  const setNotifications = useCallback((valor) => {
    setNotificationsEstado(prev => {
      const nova = typeof valor === 'function' ? valor(prev) : valor;
      cache = { ...cache, usuario: currentUser?.id, lista: nova };
      return nova;
    });
  }, [currentUser?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('destinatario_id', currentUser.id)
        .order('criado_em', { ascending: false })
        .limit(20);

      if (error) throw error;

      cache.em = Date.now();
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.lida).length);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, setNotifications]);

  useEffect(() => {
    if (cache.usuario !== currentUser?.id || Date.now() - cache.em > VALIDADE) fetchNotifications();

    if (!currentUser?.id) return;

    // Assinar canal do Supabase Realtime
    const channel = supabase
      .channel('notificacoes_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `destinatario_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('Nova notificação recebida:', payload);
          const newNotif = payload.new;
          setNotifications(prev => [newNotif, ...prev].slice(0, 20)); // Manter top 20
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      // Otimista (atualiza UI primeiro)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, lida: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);

      if (error) {
        // Reverter se falhar
        fetchNotifications();
        throw error;
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || !currentUser?.id) return;

    try {
      // Otimista
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      setUnreadCount(0);

      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('destinatario_id', currentUser.id)
        .eq('lida', false);

      if (error) {
        fetchNotifications();
        throw error;
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deleteNotification = async (id) => {
     try {
       setNotifications(prev => prev.filter(n => n.id !== id));
       // recalcular unread count baseado na lista local
       const notif = notifications.find(n => n.id === id);
       if(notif && !notif.lida) setUnreadCount(prev => Math.max(0, prev - 1));

       const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', id);
        
       if (error) throw error;
     } catch (error) {
       console.error('Erro ao deletar notificação:', error);
       fetchNotifications();
     }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications
  };
};
