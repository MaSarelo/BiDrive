import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BynIcon from '../../components/BynIcon';
import './AdminPage.css';

const API_URL = 'http://localhost:8080'; // Вынесли хардкод

function AdminPage() {
    const [auctions, setAuctions] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectError, setRejectError] = useState(''); // Для инлайн-ошибки

    useEffect(() => {
        fetchAuctions();
        fetchUsers();
        fetchStats();
    }, []);

    const fetchAuctions = () => {
        setLoading(true);
        axios.get(`${API_URL}/api/auctions/pending`)
            .then(r => { setAuctions(r.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    };

    const fetchUsers = () => {
        axios.get(`${API_URL}/api/users`)
            .then(r => setUsers(r.data))
            .catch(err => console.error(err));
    };

    const fetchStats = () => {
        axios.get(`${API_URL}/api/admin/stats`)
            .then(r => setStats(r.data))
            .catch(err => console.error(err));
    };

    const handleApprove = (id) => {
        axios.put(`${API_URL}/api/auctions/${id}/approve`)
            .then(() => setAuctions(prev => prev.filter(a => a.id !== id)))
            .catch(err => console.error(err));
    };

    const handleRejectInit = (id) => {
        setRejectingId(id);
        setRejectReason('');
        setRejectError('');
    };

    const handleRejectConfirm = (id) => {
        if (!rejectReason.trim()) {
            setRejectError('Укажите причину отклонения'); // Заменили alert()
            return;
        }
        setRejectError('');
        axios.post(`${API_URL}/api/auctions/${id}/reject`, null, {
            params: { reason: rejectReason }
        })
            .then(() => {
                setAuctions(prev => prev.filter(a => a.id !== id));
                setRejectingId(null);
            })
            .catch(err => console.error(err));
    };

    const handleBlock = (userId) => {
        axios.put(`${API_URL}/api/users/${userId}/block`, null, { params: { isBlocked: true } })
            .then(() => {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: true } : u));
            })
            .catch(err => console.error(err));
    };

    const handleUnblock = (userId) => {
        axios.put(`${API_URL}/api/users/${userId}/block`, null, { params: { isBlocked: false } })
            .then(() => {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: false } : u));
            })
            .catch(err => console.error(err));
    };

    const sortedUsers = [...users].sort((a, b) => (b.roleId === 2 ? 1 : 0) - (a.roleId === 2 ? 1 : 0));

    if (loading) return <div className="ap-loading">Загрузка...</div>;

    return (
        <div className="ap">
            <header className="ap-header">
                <div className="ap-header__inner">
                    <h1 className="ap-title">Панель администратора</h1>
                    <Link to="/" className="ap-back">← На главную</Link>
                </div>
            </header>

            <main className="ap-main">

                {/* СТАТИСТИКА */}
                <section className="ap-section">
                    <p className="ap-section-heading">Статистика платформы</p>

                    {stats ? (
                        <div className="ap-stats-grid">
                            <div className="ap-stat-card">
                                <span className="ap-stat-card__value">{stats.totalUsers}</span>
                                <span className="ap-stat-card__label">Пользователей</span>
                            </div>
                            <div className="ap-stat-card">
                                <span className="ap-stat-card__value">{stats.activeAuctions}</span>
                                <span className="ap-stat-card__label">Активных аукционов</span>
                            </div>
                            <div className="ap-stat-card">
                                <span className="ap-stat-card__value">{stats.totalBids}</span>
                                <span className="ap-stat-card__label">Всего ставок</span>
                            </div>
                            <div className="ap-stat-card">
                                <span className="ap-stat-card__value">
                                    {stats.totalTurnover?.toLocaleString('ru-RU')}
                                    <BynIcon className="ap-currency-icon" />
                                </span>
                                <span className="ap-stat-card__label">Общий оборот</span>
                            </div>
                        </div>
                    ) : (
                        <div className="ap-loading ap-loading--inline">Загрузка статистики...</div>
                    )}
                </section>

                {/* СЕКЦИЯ МОДЕРАЦИИ ЛОТОВ */}
                <section className="ap-section">
                    <p className="ap-section-heading">Модерация лотов</p>

                    {auctions.length === 0 ? (
                        <div className="ap-empty">
                            <div className="ap-empty__icon">✓</div>
                            <p>Все лоты проверены</p>
                        </div>
                    ) : (
                        <div className="ap-list">
                            {auctions.map(a => (
                                <article key={a.id} className="ap-card">
                                    <div className="ap-card__left">
                                        {a.mainImageUrl ? (
                                            <img src={`${API_URL}${a.mainImageUrl}`} alt="Фото автомобиля" className="ap-card__img" />
                                        ) : (
                                            <div className="ap-card__img ap-card__img--empty">Нет фото</div>
                                        )}
                                    </div>
                                    <div className="ap-card__body">
                                        <h3 className="ap-card__title">{a.brand?.name} {a.model?.name}</h3>
                                        <div className="ap-card__meta">
                                            <span>Год: {a.year}</span>
                                            <span>Пробег: {a.mileage?.toLocaleString()} км</span>
                                            <span>Продавец: {a.seller?.firstName}</span>
                                        </div>
                                        <p className="ap-card__price">
                                            Старт: {a.startingPrice?.toLocaleString()} BYN
                                        </p>
                                    </div>
                                    <div className="ap-card__actions">
                                        <button type="button" className="ap-btn ap-btn--green" onClick={() => handleApprove(a.id)}>
                                            Одобрить
                                        </button>
                                        {rejectingId === a.id ? (
                                            <div className="ap-reject-form">
                                                <input
                                                    type="text"
                                                    placeholder="Причина отклонения"
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    className={`ap-reject-input ${rejectError ? 'input--error' : ''}`}
                                                />
                                                {rejectError && <span className="ap-reject-error">{rejectError}</span>}
                                                <div className="ap-reject-actions">
                                                    <button type="button" className="ap-btn ap-btn--red" onClick={() => handleRejectConfirm(a.id)}>Отправить</button>
                                                    <button type="button" className="ap-btn ap-btn--ghost" onClick={() => setRejectingId(null)}>Отмена</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button type="button" className="ap-btn ap-btn--red" onClick={() => handleRejectInit(a.id)}>
                                                Отклонить
                                            </button>
                                        )}
                                        <Link to={`/auction/${a.id}`} className="ap-btn ap-btn--ghost">
                                            Смотреть
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* СЕКЦИЯ ПОЛЬЗОВАТЕЛЕЙ */}
                <section className="ap-section">
                    <p className="ap-section-heading">Управление пользователями</p>
                    <div className="ap-users">
                        {sortedUsers.map(u => (
                            <div key={u.id} className="ap-user">
                                <div className="ap-user__info">
                                    <span className="ap-user__name">{u.firstName} {u.lastName}</span>
                                    <span className="ap-user__email">{u.email}</span>
                                    <div className="ap-user__tags">
                                        {u.roleId === 2 && <span className="ap-tag ap-tag--admin">Админ</span>}
                                        {u.isBlocked && <span className="ap-tag ap-tag--blocked">Заблокирован</span>}
                                    </div>
                                </div>

                                {u.roleId !== 2 && (
                                    u.isBlocked ? (
                                        <button type="button" className="ap-btn ap-btn--unblock" onClick={() => handleUnblock(u.id)}>
                                            Разблокировать
                                        </button>
                                    ) : (
                                        <button type="button" className="ap-btn ap-btn--block" onClick={() => handleBlock(u.id)}>
                                            Заблокировать
                                        </button>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}

export default AdminPage;