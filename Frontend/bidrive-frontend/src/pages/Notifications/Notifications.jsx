import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Notifications.css';
import { NotifContext } from '../../components/Layout';

export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const userId = localStorage.getItem('userId');
  const { setNotifCount } = useContext(NotifContext);

  // Функция загрузки
  const fetchNotifications = () => {
    if (!userId) return;
    axios.get(`http://localhost:8080/api/notifications/user/${userId}`)
        .then(r => setNotifications(r.data))
        .catch(console.error);
  };

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 5000);
    return () => clearInterval(intervalId);
  }, [userId]);

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`http://localhost:8080/api/notifications/user/${userId}/read-all`);
      setNotifications(p => p.map(n => ({ ...n, isRead: true })));
      setNotifCount(0);
    } catch (err) { console.error(err); }
  };

  const handleMarkAsRead = async (notif) => {
    if (notif.isRead) return;
    try {
      await axios.put(`http://localhost:8080/api/notifications/${notif.id}/read`);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setNotifCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error("Ошибка при прочтении", err); }
  };

  // === УДАЛЕНИЕ УВЕДОМЛЕНИЯ ===
  const handleDelete = async (e, id, isRead) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await axios.delete(`http://localhost:8080/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (!isRead) {
        setNotifCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Ошибка удаления", err);
    }
  };

  // === ФОРМАТИРОВАНИЕ ДАТЫ ===
  const fmt = d => new Date(d).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  // === ОЧИСТКА СООБЩЕНИЯ ОТ МАРКЕРОВ ===
  const cleanMessage = (message) => {
    // Удаляем маркеры вида [EXTEND:123] или [REJECT:123] в начале сообщения
    return message.replace(/^\[(EXTEND|REJECT):\d+\]\s*/, '');
  };

  // === ОПРЕДЕЛЕНИЕ ИКОНКИ ПО ТИПУ ===
  const getIconForType = (type) => {
    switch (type) {
      case 'WIN':
      case 'AUCTION_WON':
        return '🏆';
      case 'SALE':
      case 'AUCTION_SOLD':
        return '💰';
      case 'BID_OUTBID':
        return '⚔️';
      case 'AUCTION_EXTENDED':
        return '⏰'; // Продление аукциона
      case 'AUCTION_EXTENSION_REJECTED':
        return '❌'; // Отклонение продления
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
      <div className="nf">
        <div className="nf-hero">
          <div className="nf-wrap">
            <p className="nf-eyebrow">
              {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитаны'}
            </p>
            <div className="nf-hero__row">
              <h1 className="nf-title">Уведомления</h1>
              {unreadCount > 0 && (
                  <button type="button" className="nf-mark-btn" onClick={handleMarkAllRead}>
                    Отметить все как прочитанные
                  </button>
              )}
            </div>
          </div>
        </div>

        <div className="nf-wrap">
          <div className="nf-body">
            {notifications.length === 0 ? (
                <div className="nf-empty">
                  <div className="nf-empty__icon">🔔</div>
                  <p className="nf-empty__title">Уведомлений пока нет</p>
                  <p className="nf-empty__sub">Здесь будут появляться ставки и результаты торгов</p>
                </div>
            ) : (
                <div className="nf-list">
                  {notifications.map(n => {
                    const icon = getIconForType(n.type);
                    const displayMessage = cleanMessage(n.message);

                    const content = (
                        <>
                          <div className="nf-item__icon">{icon}</div>
                          <div className="nf-item__content">
                            <p className="nf-item__msg">{displayMessage}</p>
                            <span className="nf-item__time">{fmt(n.createdAt)}</span>
                          </div>

                          {/* Кнопка удаления */}
                          <button
                              className="nf-item__delete"
                              onClick={(e) => handleDelete(e, n.id, n.isRead)}
                              title="Удалить"
                          >
                            ×
                          </button>

                          {!n.isRead && <div className="nf-item__dot" />}
                        </>
                    );

                    // Если есть ID аукциона — ссылка на лот
                    if (n.auctionId) {
                      return (
                          <Link
                              key={n.id}
                              to={`/auctions/${n.auctionId}`}
                              className={`nf-item nf-item--link${n.isRead ? '' : ' nf-item--unread'}`}
                              onClick={() => handleMarkAsRead(n)}
                          >
                            {content}
                          </Link>
                      );
                    }

                    // Иначе просто блок
                    return (
                        <div key={n.id} className={`nf-item${n.isRead ? '' : ' nf-item--unread'}`}>
                          {content}
                        </div>
                    );
                  })}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default Notifications;