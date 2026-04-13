import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

const STATUS_MAP = {
    ACTIVE:   { label: 'Активен',     cls: 'pf-badge--active'   },
    DRAFT:    { label: 'Черновик',    cls: 'pf-badge--draft'    },
    PENDING:  { label: 'На проверке', cls: 'pf-badge--pending'  },
    FINISHED: { label: 'Завершён',    cls: 'pf-badge--finished' },
    APPROVED: { label: 'Одобрен',     cls: 'pf-badge--approved' },
};

function Profile() {
    const [auctions, setAuctions] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const currentUserId = localStorage.getItem('userId');

    useEffect(() => {
        if (!currentUserId) return;
        axios.get(`http://localhost:8080/api/auctions/my?sellerId=${currentUserId}`)
            .then(r => { setAuctions(r.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }, [currentUserId]);

    const handleDelete = id => {
        if (!window.confirm('Вы уверены, что хотите удалить лот?')) return;
        axios.delete(`http://localhost:8080/api/auctions/${id}`, { params: { userId: currentUserId } })
            .then(() => setAuctions(p => p.filter(a => a.id !== id)))
            .catch(err => alert('Ошибка: ' + (err.response?.data || 'Нет прав')));
    };

    const handlePublish = id => {
        axios.put(`http://localhost:8080/api/auctions/${id}/publish`, null, { params: { userId: currentUserId } })
            .then(() => setAuctions(p => p.map(a => a.id === id ? { ...a, status: 'ACTIVE' } : a)))
            .catch(err => alert('Ошибка: ' + (err.response?.data || 'Нет прав')));
    };

    const handleFinish = id => {
        if (!window.confirm('Завершить торги и назначить победителя?')) return;
        axios.put(`http://localhost:8080/api/auctions/${id}/finish`, null, { params: { userId: currentUserId } })
            .then(() => setAuctions(p => p.map(a => a.id === id ? { ...a, status: 'FINISHED' } : a)))
            .catch(err => alert('Ошибка: ' + (err.response?.data || 'Нет прав')));
    };

    const active   = auctions.filter(a => a.status === 'ACTIVE').length;
    const finished = auctions.filter(a => a.status === 'FINISHED').length;

    if (loading) return (
        <div className="pf-loading">
            <span style={{ display:'block', width:48, height:1, background:'var(--gold)', opacity:0.5 }} />
            <p>Загрузка профиля...</p>
        </div>
    );

    return (
        <div className="pf">
            {/* Hero */}
            <div className="pf-hero">
                <div className="pf-wrap">
                    <p className="pf-eyebrow">Личный кабинет</p>
                    <h1 className="pf-title">Мои лоты</h1>
                </div>
            </div>

            <div className="pf-wrap pf-body">

                {/* Статистика */}
                <div className="pf-stats">
                    <div className="pf-stat">
                        <span className="pf-stat__num">{auctions.length}</span>
                        <span className="pf-stat__label">Всего лотов</span>
                    </div>
                    <div className="pf-stat">
                        <span className="pf-stat__num">{active}</span>
                        <span className="pf-stat__label">Активных</span>
                    </div>
                    <div className="pf-stat">
                        <span className="pf-stat__num">{finished}</span>
                        <span className="pf-stat__label">Завершённых</span>
                    </div>
                </div>

                {/* Кнопка нового лота */}
                <Link to="/create" className="pf-btn pf-btn--new">
                    + Выставить автомобиль
                </Link>

                {/* Лоты */}
                <p className="pf-section-heading">Мои объявления</p>

                {auctions.length === 0 ? (
                    <div className="pf-empty">
                        <p className="pf-empty__title">У вас пока нет лотов</p>
                        <p className="pf-empty__sub">Используйте кнопку «Выставить автомобиль» выше, чтобы начать продажи</p>
                    </div>
                ) : (
                    <div className="pf-grid">
                        {auctions.map(a => {
                            const st = STATUS_MAP[a.status] ?? { label: a.status, cls: '' };
                            // Исправлен пробел в URL
                            const img = a.mainImageUrl
                                ? `http://localhost:8080${a.mainImageUrl}` : null;
                            return (
                                <div key={a.id} className="pf-card">
                                    {/* Фото */}
                                    <div className="pf-card__photo">
                                        {img
                                            ? <img src={img} alt={`${a.brand?.name} ${a.model?.name}`} loading="lazy" />
                                            : <div className="pf-card__photo-empty">Нет фото</div>
                                        }
                                    </div>

                                    {/* Тело */}
                                    <div className="pf-card__body">
                                        <div className="pf-card__head">
                                            <h3 className="pf-card__name">
                                                {a.brand?.name} {a.model?.name}
                                            </h3>
                                            <span className={`pf-badge ${st.cls}`}>{st.label}</span>
                                        </div>

                                        <div className="pf-card__meta">
                                            <div className="pf-card__meta-item">
                                                <span className="pf-card__meta-label">Год</span>
                                                <span className="pf-card__meta-val">{a.year ?? '—'}</span>
                                            </div>
                                            <div className="pf-card__meta-item">
                                                <span className="pf-card__meta-label">Пробег</span>
                                                <span className="pf-card__meta-val">
                          {a.mileage ? `${a.mileage.toLocaleString()} км` : '—'}
                        </span>
                                            </div>
                                            <div className="pf-card__meta-item">
                                                <span className="pf-card__meta-label">Создан</span>
                                                <span className="pf-card__meta-val">
                          {new Date(a.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                                            </div>
                                            <div className="pf-card__meta-item">
                                                <span className="pf-card__meta-label">КПП</span>
                                                <span className="pf-card__meta-val">{a.transmission?.name ?? '—'}</span>
                                            </div>
                                        </div>

                                        <div className="pf-card__price">
                      <span className="pf-card__price-val">
                        {a.currentPrice?.toLocaleString()}
                      </span>
                                            <span className="pf-card__price-cur">BYN</span>
                                        </div>
                                    </div>

                                    {/* Действия */}
                                    <div className="pf-card__actions">
                                        {/* Исправлен && */}
                                        {(a.status === 'DRAFT' || a.status === 'PENDING') && (
                                            <button className="pf-btn pf-btn--publish"
                                                    onClick={() => handlePublish(a.id)}>
                                                Опубликовать
                                            </button>
                                        )}
                                        {a.status === 'ACTIVE' && (
                                            <button className="pf-btn pf-btn--finish"
                                                    onClick={() => handleFinish(a.id)}>
                                                Завершить торги
                                            </button>
                                        )}
                                        {a.status !== 'ACTIVE' && a.status !== 'FINISHED' && (
                                            <button className="pf-btn pf-btn--delete"
                                                    onClick={() => handleDelete(a.id)}>
                                                Удалить
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Profile;