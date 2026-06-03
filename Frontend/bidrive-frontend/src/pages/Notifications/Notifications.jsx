import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Notifications.css';
import { NotifContext } from '../../components/Layout';

const API_BASE = 'http://localhost:8080';

// ФУНКЦИЯ ФОРМАТИРОВАНИЯ ТЕЛЕФОНА
const formatPhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  let numberPart = digits;
  if (digits.startsWith('375')) numberPart = digits.slice(3);
  else if (digits.startsWith('80')) numberPart = digits.slice(2);
  else if (digits.startsWith('7')) numberPart = digits.slice(1);
  const limited = numberPart.slice(0, 9);
  if (limited.length === 0) return null;
  if (limited.length <= 2) return `+375 (${limited}`;
  if (limited.length <= 5) return `+375 (${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 7) return `+375 (${limited.slice(0, 2)}) ${limited.slice(2, 5)}-${limited.slice(5)}`;
  return `+375 (${limited.slice(0, 2)}) ${limited.slice(2, 5)}-${limited.slice(5, 7)}-${limited.slice(7)}`;
};

// === ИСПРАВЛЕНО: возвращает только контакт (телефон или email), без имени ===
const formatContactInfo = (contact) => {
  if (!contact) return 'Контакт не указан';

  const formattedPhone = formatPhone(contact.phone);

  if (formattedPhone) return `📞 ${formattedPhone}`;
  if (contact.email) return `📧 ${contact.email}`;
  return 'Контакт не указан';
};
// ============================================================================


// СКЛОНЕНИЕ ЧИСЛИТЕЛЬНЫХ
const pluralize = (count, one, few, many) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};

const formatUnreadCount = (count) => {
  if (count === 0) return 'Все прочитаны';
  const word = pluralize(count, 'непрочитанное', 'непрочитанных', 'непрочитанных');
  return `${count} ${word}`;
};


export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [contacts, setContacts] = useState({});
  const userId = localStorage.getItem('userId');
  const { setNotifCount } = useContext(NotifContext);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/notifications/user/${userId}`);
        setNotifications(res.data);

        const templateNotifs = res.data.filter(n => n.message?.startsWith('TEMPLATE:'));
        const contactIds = [...new Set(templateNotifs.map(n => n.message.split(':')[3]))];
        contactIds.forEach(id => fetchContact(id));
      } catch (err) {
        console.error('Ошибка загрузки уведомлений:', err);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 10000);
    return () => clearInterval(intervalId);
  }, [userId]);

  // === ИЗМЕНЕНО: сохраняем phone и email отдельно ===
  const fetchContact = async (contactUserId) => {
    if (contacts[contactUserId]) return;
    try {
      const res = await axios.get(`${API_BASE}/api/users/${contactUserId}`);
      setContacts(prev => ({
        ...prev,
        [contactUserId]: {
          name: `${res.data.firstName || ''} ${res.data.lastName || ''}`.trim() || 'Пользователь',
          phone: res.data.phone || '',   // ← отдельно телефон
          email: res.data.email || ''    // ← отдельно email
        }
      }));
    } catch (err) {
      console.error('Ошибка загрузки контакта:', err);
    }
  };

  const renderMessage = (notif) => {
    if (notif.type === 'AUCTION_APPROVED') {
      return '✅ Ваш лот прошёл модерацию и появился в каталоге. Удачи в торгах!';
    }

    if (notif.message?.startsWith('TEMPLATE:')) {
      const parts = notif.message.split(':');
      const type = parts[1];
      const contactId = parts[3];
      const contact = contacts[contactId];

      if (!contact) return '🔄 Загрузка контактов...';

      const contactInfo = formatContactInfo(contact);

      if (type === 'AUCTION_WON' || type === 'WIN') {
        return (
            <>
              <div style={{ whiteSpace: 'nowrap' }}>
                🎉 Вы выиграли лот! Свяжитесь с продавцом:{' '}
                <span style={{ fontWeight: 500 }}>{contact.name}</span>
              </div>
              <div>{contactInfo}</div>
            </>
        );
      }
      if (type === 'AUCTION_SOLD' || type === 'SALE') {
        return (
            <>
              <div style={{ whiteSpace: 'nowrap' }}>
                ✅ Ваш лот продан! Свяжитесь с победителем:{' '}
                <span style={{ fontWeight: 500 }}>{contact.name}</span>
              </div>
              <div>{contactInfo}</div>
            </>
        );
      }
    }

    return notif.message.replace(/^\[(EXTEND|REJECT):\d+\]\s*/, '');
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API_BASE}/api/notifications/user/${userId}/read-all`);
      setNotifications(p => p.map(n => ({ ...n, isRead: true })));
      setNotifCount(0);
    } catch (err) { console.error(err); }
  };

  const handleMarkAsRead = async (notif) => {
    if (notif.isRead) return;
    try {
      await axios.put(`${API_BASE}/api/notifications/${notif.id}/read`);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setNotifCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error("Ошибка при прочтении", err); }
  };

  const handleDelete = async (e, id, isRead) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axios.delete(`${API_BASE}/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (!isRead) setNotifCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error("Ошибка удаления", err); }
  };

  const fmt = d => new Date(d).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
      <div className="nf">
        <div className="nf-hero">
          <div className="nf-wrap">
            <p className="nf-eyebrow">
              {formatUnreadCount(unreadCount)}
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
                    let icon = '🔔';
                    if (n.type === 'WIN' || n.type === 'AUCTION_WON') icon = '🏆';
                    if (n.type === 'SALE' || n.type === 'AUCTION_SOLD') icon = '💰';
                    if (n.type === 'BID_OUTBID') icon = '⚔️';
                    if (n.type === 'AUCTION_EXTENDED') icon = '⏰';
                    if (n.type === 'AUCTION_EXTENSION_REJECTED') icon = '❌';
                    if (n.type === 'AUCTION_APPROVED') icon = '✅';

                    const content = (
                        <>
                          <div className="nf-item__icon">{icon}</div>
                          <div className="nf-item__content">
                            <p className="nf-item__msg">{renderMessage(n)}</p>
                            <span className="nf-item__time">{fmt(n.createdAt)}</span>
                          </div>
                          <button
                              className="nf-item__delete"
                              onClick={(e) => handleDelete(e, n.id, n.isRead)}
                              title="Удалить"
                          >×</button>
                          {!n.isRead && <div className="nf-item__dot" />}
                        </>
                    );

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