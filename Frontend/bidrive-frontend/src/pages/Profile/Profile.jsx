import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

const API_BASE = 'http://localhost:8080';

const STATUS_MAP = {
    ACTIVE:   { label: 'Активен',     cls: 'pf-badge--active'   },
    DRAFT:    { label: 'Черновик',    cls: 'pf-badge--draft'    },
    PENDING:  { label: 'На проверке', cls: 'pf-badge--pending'  },
    FINISHED: { label: 'Завершён',    cls: 'pf-badge--finished' },
    COMPLETED:{ label: 'Завершён',    cls: 'pf-badge--finished' },
    APPROVED: { label: 'Одобрен',     cls: 'pf-badge--approved' },
    REJECTED: { label: 'Отклонён',    cls: 'pf-badge--rejected' },
};

// === ФУНКЦИИ ВАЛИДАЦИИ ===
const validateName = (name) => {
    if (!name || name.trim().length < 2) return 'Минимум 2 символа';
    if (name.trim().length > 50) return 'Максимум 50 символов';
    if (!/^[\p{L}\s'-]+$/u.test(name.trim())) return 'Только буквы, пробелы, дефисы и апострофы';
    return null;
};

const validateEmail = (email) => {
    if (!email) return 'Email обязателен';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Некорректный формат email';
    if (email.length > 100) return 'Слишком длинный email';
    return null;
};

const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') return null; // Телефон не обязателен

    // Строгая проверка: только полный формат +375 (XX) XXX-XX-XX
    const fullMask = /^\+375 \(\d{2}\) \d{3}-\d{2}-\d{2}$/;
    if (!fullMask.test(phone)) {
        return 'Введите полный номер: +375 (XX) XXX-XX-XX';
    }

    return null;
};

const validatePassword = (password, isConfirm = false, currentPassword = '') => {
    // === ИСПРАВЛЕНО: если поле пустое — не ошибка (пользователь может не менять пароль) ===
    if (!password) return null;

    // Если это подтверждение пароля и пароль введён
    if (isConfirm) {
        // Проверяем, введён ли текущий пароль
        if (!currentPassword) return 'Введите текущий пароль';
        // Проверяем совпадение
        if (password !== currentPassword) return 'Пароли не совпадают';
    }

    // Проверка сложности пароля (только для нового пароля, не для подтверждения)
    if (!isConfirm) {
        if (password.length < 6) return 'Минимум 6 символов';
        if (password.length > 100) return 'Максимум 100 символов';
    }

    return null;
};
// =========================

function Profile() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = localStorage.getItem('userId');
    const navigate = useNavigate();

    // === СОСТОЯНИЯ МОДАЛОК ===
    const [finishModal, setFinishModal] = useState({ open: false, id: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
    const [editProfileModal, setEditProfileModal] = useState(false);

    // === ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ===
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });

    // === ОШИБКИ ВАЛИДАЦИИ ===
    const [validationErrors, setValidationErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');
    // =========================

    useEffect(() => {
        if (!currentUserId) return;
        axios.get(`${API_BASE}/api/auctions/my?sellerId=${currentUserId}`)
            .then(r => { setAuctions(r.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });

        // Загружаем данные пользователя (поля будут предзаполнены)
        axios.get(`${API_BASE}/api/users/${currentUserId}`)
            .then(r => {
                setUserData({
                    firstName: r.data.firstName || '',
                    lastName: r.data.lastName || '',
                    email: r.data.email || '',
                    phone: r.data.phone || ''
                });
            })
            .catch(console.error);
    }, [currentUserId]);

    // === ВАЛИДАЦИЯ В РЕАЛЬНОМ ВРЕМЕНИ ===
    useEffect(() => {
        const errors = {
            firstName: validateName(userData.firstName),
            lastName: validateName(userData.lastName),
            email: validateEmail(userData.email),
            phone: validatePhone(userData.phone),
            currentPassword: validatePassword(passwordData.currentPassword),
            newPassword: validatePassword(passwordData.newPassword),
            confirmPassword: validatePassword(passwordData.confirmPassword, true, passwordData.newPassword)
        };
        setValidationErrors(errors);
    }, [userData, passwordData]);

    // === ПРОВЕРКА: МОЖНО ЛИ СОХРАНИТЬ ===
    const canSaveProfile = () => {
        const hasProfileChanges =
            userData.firstName.trim() ||
            userData.lastName.trim() ||
            userData.email.trim();

        // === ИСПРАВЛЕНО: определяем, начал ли пользователь менять пароль ===
        const hasPasswordChanges =
            passwordData.newPassword || passwordData.confirmPassword;

        const profileValid =
            !validationErrors.firstName &&
            !validationErrors.lastName &&
            !validationErrors.email &&
            !validationErrors.phone;

        // === ИСПРАВЛЕНО: если пароль не меняем — игнорируем ошибки валидации паролей ===
        const passwordValid = !hasPasswordChanges || (
            !validationErrors.currentPassword &&
            !validationErrors.newPassword &&
            !validationErrors.confirmPassword &&
            passwordData.currentPassword &&
            passwordData.newPassword
        );

        return (hasProfileChanges || hasPasswordChanges) && profileValid && passwordValid;
    };

    // === ЛОГИКА УДАЛЕНИЯ ===
    const openDeleteModal = (id) => setDeleteModal({ open: true, id });
    const closeDeleteModal = () => setDeleteModal({ open: false, id: null });

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            await axios.delete(`${API_BASE}/api/auctions/${deleteModal.id}`, { params: { userId: currentUserId } });
            setAuctions(p => p.filter(a => a.id !== deleteModal.id));
            closeDeleteModal();
        } catch (err) {
            alert('Ошибка: ' + (err.response?.data || 'Нет прав'));
            closeDeleteModal();
        }
    };

    // === ЛОГИКА ЗАВЕРШЕНИЯ ТОРГОВ ===
    const openFinishModal = (id) => setFinishModal({ open: true, id });
    const closeFinishModal = () => setFinishModal({ open: false, id: null });

    const confirmFinish = async () => {
        if (!finishModal.id) return;
        try {
            await axios.put(`${API_BASE}/api/auctions/${finishModal.id}/finish`, null, { params: { userId: currentUserId } });
            setAuctions(p => p.map(a => a.id === finishModal.id ? { ...a, status: 'FINISHED' } : a));
            closeFinishModal();
        } catch (err) {
            alert('Ошибка: ' + (err.response?.data || 'Нет прав'));
            closeFinishModal();
        }
    };

    // === ЛОГИКА РЕДАКТИРОВАНИЯ ПРОФИЛЯ ===
    const handleEditProfile = async () => {
        setEditError('');
        setEditSuccess('');

        // Финальная проверка валидации
        const errors = {
            firstName: validateName(userData.firstName),
            lastName: validateName(userData.lastName),
            email: validateEmail(userData.email),
            phone: validatePhone(userData.phone),
            currentPassword: validatePassword(passwordData.currentPassword),
            newPassword: validatePassword(passwordData.newPassword),
            confirmPassword: validatePassword(passwordData.confirmPassword, true, passwordData.newPassword)
        };
        setValidationErrors(errors);

        const hasErrors = Object.values(errors).some(err => err);
        if (hasErrors) {
            setEditError('Исправьте ошибки в форме');
            return;
        }

        try {
            // Обновляем данные профиля
            await axios.put(`${API_BASE}/api/users/${currentUserId}`, {
                firstName: userData.firstName.trim(),
                lastName: userData.lastName.trim(),
                phone: userData.phone?.trim() || '',
                email: userData.email.trim()
            });

            // === ИСПРАВЛЕНО: меняем пароль только если заполнены ОБА поля ===
            if (passwordData.newPassword && passwordData.currentPassword) {
                await axios.put(`${API_BASE}/api/users/${currentUserId}/password`, {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                });
            }

            setEditSuccess('✅ Профиль успешно обновлён!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

            // Закрываем модалку с небольшой задержкой для показа успеха
            setTimeout(() => {
                setEditProfileModal(false);
                setEditSuccess('');
            }, 1500);
        } catch (err) {
            setEditError(err.response?.data || 'Ошибка при обновлении профиля');
        }
    };

    // === ФОРМАТИРОВАНИЕ ТЕЛЕФОНА С ЖЁСТКОЙ МАСКОЙ ===
    const formatPhone = (value) => {
        // Удаляем всё кроме цифр
        const digits = value.replace(/\D/g, '');

        // Извлекаем код страны и номер
        let countryCode = '375';
        let numberPart = digits;

        // Обрабатываем разные форматы ввода
        if (digits.startsWith('375')) {
            numberPart = digits.slice(3);
        } else if (digits.startsWith('80')) {
            numberPart = digits.slice(2);
        } else if (digits.startsWith('7')) {
            numberPart = digits.slice(1);
        } else if (digits.startsWith('+')) {
            numberPart = digits.replace('+', '');
            if (numberPart.startsWith('375')) {
                numberPart = numberPart.slice(3);
            }
        }

        // Ограничиваем до 9 цифр (после кода страны)
        const limited = numberPart.slice(0, 9);

        // Форматируем: +375 (XX) XXX-XX-XX
        let formatted = '+375';

        if (limited.length > 0) {
            formatted += ` (${limited.slice(0, 2)}`;
        } else {
            return '+375 (';
        }
        if (limited.length >= 2) {
            formatted += `) ${limited.slice(2, 5)}`;
        } else if (limited.length === 1) {
            return formatted + ') ';
        } else {
            return formatted;
        }
        if (limited.length >= 5) {
            formatted += `-${limited.slice(5, 7)}`;
        } else if (limited.length > 2) {
            return formatted + '-';
        } else {
            return formatted;
        }
        if (limited.length >= 7) {
            formatted += `-${limited.slice(7, 9)}`;
        } else if (limited.length > 5) {
            return formatted + '-';
        }

        return formatted;
    };

    const handleRelist = (auction) => {
        navigate(`/create?copyId=${auction.id}`);
    };

    const active = auctions.filter(a => a.status === 'ACTIVE').length;
    const finished = auctions.filter(a => a.status === 'FINISHED' || a.status === 'COMPLETED').length;

    if (loading) return (
        <div className="pf-loading">
            <span style={{ display:'block', width:48, height:1, background:'var(--gold)', opacity:0.5 }} />
            <p>Загрузка профиля...</p>
        </div>
    );

    return (
        <div className="pf">
            {/* === МОДАЛКА РЕДАКТИРОВАНИЯ ПРОФИЛЯ === */}
            {editProfileModal && (
                <div className="pf-modal-overlay" onClick={() => setEditProfileModal(false)}>
                    <div className="pf-modal pf-modal--wide" onClick={e => e.stopPropagation()}>
                        <h3 className="pf-modal__title">Редактировать профиль</h3>

                        {editError && <div className="pf-modal__error">{editError}</div>}
                        {editSuccess && <div className="pf-modal__success">{editSuccess}</div>}

                        <div className="pf-modal__grid">
                            <div className="pf-modal__section">
                                <h4 className="pf-modal__section-title">Личные данные</h4>

                                <div className="pf-form-group">
                                    <label className="pf-label">Имя <span className="pf-required">*</span></label>
                                    <input
                                        type="text"
                                        className={`pf-input ${validationErrors.firstName ? 'pf-input--error' : ''}`}
                                        value={userData.firstName}
                                        onChange={e => setUserData({...userData, firstName: e.target.value})}
                                        placeholder="Введите имя"
                                        maxLength={50}
                                    />
                                    {validationErrors.firstName && (
                                        <span className="pf-error-msg">{validationErrors.firstName}</span>
                                    )}
                                </div>

                                <div className="pf-form-group">
                                    <label className="pf-label">Фамилия <span className="pf-required">*</span></label>
                                    <input
                                        type="text"
                                        className={`pf-input ${validationErrors.lastName ? 'pf-input--error' : ''}`}
                                        value={userData.lastName}
                                        onChange={e => setUserData({...userData, lastName: e.target.value})}
                                        placeholder="Введите фамилию"
                                        maxLength={50}
                                    />
                                    {validationErrors.lastName && (
                                        <span className="pf-error-msg">{validationErrors.lastName}</span>
                                    )}
                                </div>

                                <div className="pf-form-group">
                                    <label className="pf-label">Email <span className="pf-required">*</span></label>
                                    <input
                                        type="email"
                                        className={`pf-input ${validationErrors.email ? 'pf-input--error' : ''}`}
                                        value={userData.email}
                                        onChange={e => setUserData({...userData, email: e.target.value})}
                                        placeholder="example@email.com"
                                        maxLength={100}
                                    />
                                    {validationErrors.email && (
                                        <span className="pf-error-msg">{validationErrors.email}</span>
                                    )}
                                </div>

                                <div className="pf-form-group">
                                    <label className="pf-label">Телефон</label>
                                    <input
                                        type="tel"
                                        className={`pf-input ${validationErrors.phone ? 'pf-input--error' : ''}`}
                                        value={userData.phone}
                                        onChange={e => {
                                            const formatted = formatPhone(e.target.value);
                                            setUserData({...userData, phone: formatted});
                                        }}
                                        placeholder="+375 (29) 123-45-67"
                                        maxLength={19}
                                    />
                                    {validationErrors.phone && (
                                        <span className="pf-error-msg">{validationErrors.phone}</span>
                                    )}
                                    <span className="pf-hint">Формат: +375 (29) 123-45-67</span>
                                </div>
                            </div>

                            <div className="pf-modal__section">
                                <h4 className="pf-modal__section-title">Смена пароля</h4>
                                <span className="pf-hint">Заполните, только если хотите изменить пароль</span>

                                <div className="pf-form-group">
                                    <label className="pf-label">Текущий пароль</label>
                                    <input
                                        type="password"
                                        className={`pf-input ${validationErrors.currentPassword ? 'pf-input--error' : ''}`}
                                        value={passwordData.currentPassword}
                                        onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                        placeholder="••••••••"
                                        maxLength={100}
                                        autoComplete="current-password"
                                    />
                                    <span className="pf-hint">Введите пароль для подтверждения изменений</span>
                                    {validationErrors.currentPassword && (
                                        <span className="pf-error-msg">{validationErrors.currentPassword}</span>
                                    )}
                                </div>

                                <div className="pf-form-group">
                                    <label className="pf-label">Новый пароль</label>
                                    <input
                                        type="password"
                                        className={`pf-input ${validationErrors.newPassword ? 'pf-input--error' : ''}`}
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                        placeholder="••••••••"
                                        maxLength={100}
                                        autoComplete="new-password"
                                    />
                                    {validationErrors.newPassword && (
                                        <span className="pf-error-msg">{validationErrors.newPassword}</span>
                                    )}
                                    {passwordData.newPassword && !validationErrors.newPassword && (
                                        <span className="pf-success-msg">✓ Надёжный пароль</span>
                                    )}
                                </div>

                                <div className="pf-form-group">
                                    <label className="pf-label">Подтвердите пароль</label>
                                    <input
                                        type="password"
                                        className={`pf-input ${validationErrors.confirmPassword ? 'pf-input--error' : ''}`}
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                        placeholder="••••••••"
                                        maxLength={100}
                                        autoComplete="new-password"
                                    />
                                    {validationErrors.confirmPassword && (
                                        <span className="pf-error-msg">{validationErrors.confirmPassword}</span>
                                    )}
                                    {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && !validationErrors.confirmPassword && (
                                        <span className="pf-success-msg">✓ Пароли совпадают</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pf-modal__actions">
                            <button className="pf-btn pf-btn--ghost" onClick={() => setEditProfileModal(false)}>Отмена</button>
                            <button
                                className={`pf-btn pf-btn--primary ${!canSaveProfile() ? 'pf-btn--disabled' : ''}`}
                                onClick={handleEditProfile}
                                disabled={!canSaveProfile()}
                            >
                                Сохранить изменения
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

                    {/* === ОБЕРТКА ДЛЯ ЗАГОЛОВКА И КНОПКИ === */}
                    <div className="pf-hero__row">
                        <h1 className="pf-title">Мои лоты</h1>

                        <button
                            className="pf-btn pf-btn--edit-profile"
                            onClick={() => setEditProfileModal(true)}
                            type="button"
                        >
                            <svg className="pf-btn__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Редактировать
                        </button>
                    </div>

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