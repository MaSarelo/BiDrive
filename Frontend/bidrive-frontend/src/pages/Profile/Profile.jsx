import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

// ИСПРАВЛЕНО: Используем относительные пути для проксирования через Vite
const API_BASE = '';

const STATUS_MAP = {
    ACTIVE:   { label: 'Активен',     cls: 'pf-badge--active'   },
    DRAFT:    { label: 'Черновик',    cls: 'pf-badge--draft'    },
    PENDING:  { label: 'На проверке', cls: 'pf-badge--pending'  },
    FINISHED: { label: 'Завершён',    cls: 'pf-badge--finished' },
    COMPLETED:{ label: 'Завершён',    cls: 'pf-badge--finished' },
    APPROVED: { label: 'Одобрен',     cls: 'pf-badge--approved' },
    REJECTED: { label: 'Отклонён',    cls: 'pf-badge--rejected' },
};

function Profile() {
    const [auctions, setAuctions] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const currentUserId = localStorage.getItem('userId');
    const navigate = useNavigate();

    // === СОСТОЯНИЯ МОДАЛОК ===
    const [finishModal, setFinishModal] = useState({ open: false, id: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
    // =========================

    useEffect(() => {
        if (!currentUserId) return;
        // ИСПРАВЛЕНО: относительный путь для проксирования
        axios.get(`${API_BASE}/api/auctions/my?sellerId=${currentUserId}`)
            .then(r => { setAuctions(r.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }, [currentUserId]);

    // === ЛОГИКА УДАЛЕНИЯ ===
    const openDeleteModal = (id) => setDeleteModal({ open: true, id });
    const closeDeleteModal = () => setDeleteModal({ open: false, id: null });

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            // ИСПРАВЛЕНО: относительный путь для проксирования
            await axios.delete(`${API_BASE}/api/auctions/${deleteModal.id}`, { params: { userId: currentUserId } });
            setAuctions(p => p.filter(a => a.id !== deleteModal.id));
            closeDeleteModal();
        } catch (err) {
            alert('Ошибка: ' + (err.response?.data || 'Нет прав'));
            closeDeleteModal();
        }
    };
    // =======================

    // === ЛОГИКА ЗАВЕРШЕНИЯ ТОРГОВ ===
    const openFinishModal = (id) => setFinishModal({ open: true, id });
    const closeFinishModal = () => setFinishModal({ open: false, id: null });

    const confirmFinish = async () => {
        if (!finishModal.id) return;
        try {
            // ИСПРАВЛЕНО: относительный путь для проксирования
            await axios.put(`${API_BASE}/api/auctions/${finishModal.id}/finish`, null, { params: { userId: currentUserId } });
            setAuctions(p => p.map(a => a.id === finishModal.id ? { ...a, status: 'FINISHED' } : a));
            closeFinishModal();
        } catch (err) {
            alert('Ошибка: ' + (err.response?.data || 'Нет прав'));
            closeFinishModal();
        }
    };
    // =================================

    const handleRelist = (auction) => {
        navigate(`/create?copyId=${auction.id}`);
    };

    const active   = auctions.filter(a => a.status === 'ACTIVE').length;
    const finished = auctions.filter(a => a.status === 'FINISHED' || a.status === 'COMPLETED').length;

    if (loading) return (
        <div className="pf-loading">
            <span style={{ display:'block', width:48, height:1, background:'var(--gold)', opacity:0.5 }} />
            <p>Загрузка профиля...</p>
        </div>
    );

    return (
        <div className="pf">

            {/* === МОДАЛКА ЗАВЕРШЕНИЯ === */}
            {finishModal.open && (
                <div className="pf-modal-overlay" onClick={closeFinishModal}>
                    <div className="pf-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="pf-modal__title">Завершить торги?</h3>
                        <p className="pf-modal__text">
                            Победитель будет определен по последней ставке. Это действие нельзя отменить.
                        </p>
                        <div className="pf-modal__actions">
                            <button className="pf-btn pf-btn--ghost" onClick={closeFinishModal}>Отмена</button>
                            <button className="pf-btn pf-btn--finish" onClick={confirmFinish}>Завершить</button>
                        </div>
                    </div>
                </div>
            )}

            {/* === МОДАЛКА УДАЛЕНИЯ === */}
            {deleteModal.open && (
                <div className="pf-modal-overlay" onClick={closeDeleteModal}>
                    <div className="pf-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="pf-modal__title pf-modal__title--danger">Удалить лот?</h3>
                        <p className="pf-modal__text">
                            Это действие необратимо. Фотографии и данные лота будут удалены без возможности восстановления.
                        </p>
                        <div className="pf-modal__actions">
                            <button className="pf-btn pf-btn--ghost" onClick={closeDeleteModal}>Отмена</button>
                            <button className="pf-btn pf-btn--delete" onClick={confirmDelete}>Удалить</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="pf-hero">
                <div className="pf-wrap">
                    <p className="pf-eyebrow">Личный кабинет</p>
                    <h1 className="pf-title">Мои лоты</h1>
                </div>
            </div>

            <div className="pf-wrap pf-body">

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

                <Link to="/create" className="pf-btn pf-btn--new">
                    + Выставить автомобиль
                </Link>

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
                            // ИСПРАВЛЕНО: убрали http://localhost:8080 для проксирования через Vite
                            const img = a.mainImageUrl || null;

                            const canRelist = (a.status === 'FINISHED' || a.status === 'COMPLETED') && !a.winner;
                            const canDelete = a.status !== 'ACTIVE';

                            return (
                                <div key={a.id} className="pf-card">
                                    <div className="pf-card__photo">
                                        {img
                                            ? <img src={img} alt={`${a.brand?.name} ${a.model?.name}`} loading="lazy" />
                                            : <div className="pf-card__photo-empty">Нет фото</div>
                                        }
                                    </div>

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

                                    <div className="pf-card__actions">
                                        <Link to={`/auction/${a.id}`} className="pf-btn pf-btn--view">
                                            Смотреть детали
                                        </Link>

                                        {a.status === 'ACTIVE' && (
                                            <button className="pf-btn pf-btn--finish"
                                                    onClick={() => openFinishModal(a.id)}>
                                                Завершить торги
                                            </button>
                                        )}

                                        {canRelist && (
                                            <button className="pf-btn pf-btn--publish"
                                                    onClick={() => handleRelist(a)}>
                                                Выставить повторно
                                            </button>
                                        )}

                                        {canDelete && (
                                            <button className="pf-btn pf-btn--delete"
                                                    onClick={() => openDeleteModal(a.id)}>
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