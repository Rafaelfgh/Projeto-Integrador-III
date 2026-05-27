import React, { useState } from 'react';
import { Bell, Check, Trash2, Loader2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import '../pages/Dashboard.css';

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Agora mesmo';
  if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 172800) return 'Ontem';
  return date.toLocaleDateString('pt-BR');
};

const NotificationMenu = () => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  return (
    <div className="notification-wrapper">
      <button 
        className="notification-btn" 
        onClick={() => setNotificationsOpen(!notificationsOpen)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
      
      {notificationsOpen && (
        <div className="notifications-dropdown" style={{ maxHeight: '450px', display: 'flex', flexDirection: 'column' }}>
          <div className="notifications-header">
            <h4>Notificações</h4>
            <button className="mark-read-btn" onClick={markAllAsRead} disabled={unreadCount === 0 || loading}>
              <Check size={14} /> Marcar todas lidas
            </button>
          </div>
          <div className="notifications-list" style={{ overflowY: 'auto', flex: 1 }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ marginTop: '10px', fontSize: '13px' }}>Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <Bell size={24} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
                <p style={{ margin: 0, fontSize: '13px' }}>Você não tem novas notificações.</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${!notif.lida ? 'notif-unread' : ''}`}
                  onClick={() => { if (!notif.lida) markAsRead(notif.id); }}
                  style={{ cursor: !notif.lida ? 'pointer' : 'default', display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                >
                  <div className="notif-indicator"></div>
                  <div className="notif-content" style={{ flex: 1 }}>
                    <p className="notif-title">{notif.titulo}</p>
                    {notif.descricao && <p className="notif-desc">{notif.descricao}</p>}
                    <span className="notif-time">{formatRelativeTime(notif.criado_em)}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="notifications-footer" style={{ borderTop: '1px solid #e2e8f0' }}>
            <button className="view-all-notifs" onClick={() => setNotificationsOpen(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
