import React, { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import '../pages/Dashboard.css'; // Módulo CSS principal por enquanto

const NotificationMenu = () => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Mock notifications array shared across the app
  const mockNotifications = [
    { id: 1, title: 'Nova resposta da administração', desc: 'Sua solicitação #1204 foi respondida.', time: '5 min atrás', read: false },
    { id: 2, title: 'Aviso Importante do Síndico', desc: 'Manutenção do elevador programada para amanhã às 14h.', time: '1h atrás', read: false },
    { id: 3, title: 'Ocorrência Resolvida', desc: 'A ocorrência "Vazamento Bloco C" foi resolvida.', time: 'Ontem', read: true }
  ];

  return (
    <div className="notification-wrapper">
      <button 
        className="notification-btn" 
        onClick={() => setNotificationsOpen(!notificationsOpen)}
      >
        <Bell size={20} />
        {mockNotifications.filter(n => !n.read).length > 0 && (
          <span className="notification-badge">{mockNotifications.filter(n => !n.read).length}</span>
        )}
      </button>
      
      {notificationsOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h4>Notificações</h4>
            <button className="mark-read-btn">
              <Check size={14} /> Marcar como lidas
            </button>
          </div>
          <div className="notifications-list">
            {mockNotifications.map(notif => (
              <div key={notif.id} className={`notification-item ${!notif.read ? 'notif-unread' : ''}`}>
                <div className="notif-indicator"></div>
                <div className="notif-content">
                  <p className="notif-title">{notif.title}</p>
                  <p className="notif-desc">{notif.desc}</p>
                  <span className="notif-time">{notif.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="notifications-footer">
            <button className="view-all-notifs">Ver todas as notificações</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
