import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Notifications.css';
import { NotifContext } from '../../components/Layout';

const API_BASE = 'http://localhost:8080';

// === SVG ИКОНКИ ===
const Icons = {
    bell: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
    ),
    trophy: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
        </svg>
    ),
    money: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
    ),
    swords: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
            <line x1="13" y1="19" x2="19" y2="13"/>
            <line x1="16" y1="16" x2="20" y2="20"/>
            <line x1="19" y1="21" x2="21" y2="19"/>
            <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/>
            <line x1="5" y1="14" x2="9" y2="18"/>
            <line x1="7" y1="17" x2="4" y2="20"/>
            <line x1="3" y1="19" x2="5" y2="21"/>
        </svg>
    ),
    clock: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
        </svg>
    ),
    xCircle: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
    ),
    checkCircle: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
    ),
    refresh: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
    ),
    phone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
    ),
    mail: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
        </svg>
    )
};

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

// === ФОРМАТИРОВАНИЕ КОНТАКТА ===
const formatContactInfo = (contact) => {
    if (!contact) return 'Контакт не указан';

    const formattedPhone = formatPhone(contact.phone);

    if (formattedPhone) return (
        <>
            <span className="nf-contact-icon">{Icons.phone}</span>
            {formattedPhone}
        </>
    );
    if (contact.email) return (
        <>
            <span className="nf-contact-icon">{Icons.mail}</span>
            {contact.email}
        </>
    );
    return 'Контакт не указан';
};

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
                // eslint-disable-next-line react-hooks/immutability
                contactIds.forEach(id => fetchContact(id));
            } catch (err) {
                console.error('Ошибка загрузки уведомлений:', err);
            }
        };

        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 10000);
        return () => clearInterval(intervalId);
    }, [userId]);

    const fetchContact = async (contactUserId) => {
        if (contacts[contactUserId]) return;
        try {
            const res = await axios.get(`${API_BASE}/api/users/${contactUserId}`);
            setContacts(prev => ({
                ...prev,
                [contactUserId]: {
                    name: `${res.data.firstName || ''} ${res.data.lastName || ''}`.trim() || 'Пользователь',
                    phone: res.data.phone || '',
                    email: res.data.email || ''
                }
            }));
        } catch (err) {
            console.error('Ошибка загрузки контакта:', err);
        }
    };

    const renderMessage = (notif) => {
        if (notif.type === 'AUCTION_APPROVED') {
            return 'Ваш лот прошёл модерацию и появился в каталоге. Удачи в торгах!';
        }

        if (notif.message?.startsWith('TEMPLATE:')) {
            const parts = notif.message.split(':');
            const type = parts[1];
            const contactId = parts[3];
            const contact = contacts[contactId];

            if (!contact) return (
                <>
                    <span className="nf-loading-icon">{Icons.refresh}</span>
                    Загрузка контактов...
                </>
            );

            const contactInfo = formatContactInfo(contact);

            if (type === 'AUCTION_WON' || type === 'WIN') {
                return (
                    <>
                        <div style={{ whiteSpace: 'nowrap' }}>
                            Вы выиграли лот! Свяжитесь с продавцом:{' '}
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
                            Ваш лот продан! Свяжитесь с победителем:{' '}
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

    const getIcon = (type) => {
        switch (type) {
            case 'WIN':
            case 'AUCTION_WON':
                return Icons.trophy;
            case 'SALE':
            case 'AUCTION_SOLD':
                return Icons.money;
            case 'BID_OUTBID':
                return Icons.swords;
            case 'AUCTION_EXTENDED':
                return Icons.clock;
            case 'AUCTION_EXTENSION_REJECTED':
                return Icons.xCircle;
            case 'AUCTION_APPROVED':
                return Icons.checkCircle;
            default:
                return Icons.bell;
        }
    };

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
                            <div className="nf-empty__icon">{Icons.bell}</div>
                            <p className="nf-empty__title">Уведомлений пока нет</p>
                            <p className="nf-empty__sub">Здесь будут появляться ставки и результаты торгов</p>
                        </div>
                    ) : (
                        <div className="nf-list">
                            {notifications.map(n => {
                                const icon = getIcon(n.type);

                                const content = (
                                    <>
                                        <div className="nf-item__icon">{icon}</div>
                                        <div className="nf-item__content">
                                            <div className="nf-item__msg">{renderMessage(n)}</div>
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