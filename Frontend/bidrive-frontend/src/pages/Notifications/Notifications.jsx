import { useState, useEffect } from 'react';
import axios from 'axios';
import './Notifications.css';

export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) return;
    axios.get(`http://localhost:8080/api/notifications/user/${userId}`)
        .then(r => setNotifications(r.data))
        .catch(console.error);
  }, [userId]);

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`http://localhost:8080/api/notifications/user/${userId}/read-all`);
      setNotifications(p => p.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const fmt = d => new Date(d).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
      <div className="nf">
        {/* Hero */}
        <div className="nf-hero">
          <div className="nf-wrap">
            <p className="nf-eyebrow">
              {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитаны'}
            </p>
            <div className="nf-hero__row">
              <h1 className="nf-title">Уведомления</h1>
              {unreadCount > 0 && (
                  <button className="nf-mark-btn" onClick={handleMarkAllRead}>
                    Отметить все как прочитанные
                  </button>
              )}
            </div>
          </div>
        </div>

        <div className="nf-wrap nf-body">
          {notifications.length === 0 ? (
              <div className="nf-empty">
                <div className="nf-empty__icon">🔔</div>
                <p className="nf-empty__title">Уведомлений пока нет</p>
                <p className="nf-empty__sub">Здесь будут появляться ставки и результаты торгов</p>
              </div>
          ) : (
              <div className="nf-list">
                {notifications.map(n => (
                    <div key={n.id} className={`nf-item${n.isRead ? '' : ' nf-item--unread'}`}>
                      <div className="nf-item__icon">
                        {n.type === 'WIN' ? '🏆' : '🔔'}
                      </div>
                      <div className="nf-item__content">
                        <p className="nf-item__msg">{n.message}</p>
                        <span className="nf-item__time">{fmt(n.createdAt)}</span>
                      </div>
                      {!n.isRead && <div className="nf-item__dot" />}
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  );
}

export default Notifications;