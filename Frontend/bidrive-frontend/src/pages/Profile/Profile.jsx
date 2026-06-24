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
    if (!phone || phone.trim() === '' || phone === '+375 (') return null;
    const fullMask = /^\+375 \(\d{2}\) \d{3}-\d{2}-\d{2}$/;
    if (!fullMask.test(phone)) {
        return 'Введите полный номер: +375 (XX) XXX-XX-XX';
    }
    return null;
};

const validatePassword = (password, isConfirm = false, currentPassword = '') => {
    if (!password) return null;
    if (isConfirm) {
        if (!currentPassword) return 'Введите текущий пароль';
        if (password !== currentPassword) return 'Пароли не совпадают';
    } else {
        if (password.length < 6) return 'Минимум 6 символов';
        if (password.length > 100) return 'Максимум 100 символов';
    }
    return null;
};

function Profile() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = localStorage.getItem('userId');
    const navigate = useNavigate();

    const [finishModal, setFinishModal] = useState({ open: false, id: null, error: '' });
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
    const [editProfileModal, setEditProfileModal] = useState(false);

    const [savedUserData, setSavedUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '+375 ('
    });

    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '+375 ('
    });

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

    const loadAuctions = (isAutoRefresh = false) => {
        if (!currentUserId) return;

        if (!isAutoRefresh) {
            setLoading(true);
        }

        axios.get(`${API_BASE}/api/auctions/my?sellerId=${currentUserId}`)
            .then(r => {
                setAuctions(r.data);
                setLoading(false);
            })
            .catch(err => {
                if (!isAutoRefresh || auctions.length === 0) {
                    console.error(err);
                }
                setLoading(false);
            });
    };

    const loadUserData = () => {
        if (!currentUserId) return;
        axios.get(`${API_BASE}/api/users/${currentUserId}`)
            .then(r => {
                const phone = r.data.phone || '';
                const digitsOnly = phone.replace(/\D/g, '');
                // eslint-disable-next-line react-hooks/immutability
                const formattedPhone = digitsOnly ? formatPhone(digitsOnly) : '+375 (';
                const data = {
                    firstName: r.data.firstName || '',
                    lastName: r.data.lastName || '',
                    email: r.data.email || '',
                    phone: formattedPhone
                };
                setSavedUserData(data);
                setUserData(data);
            })
            .catch(console.error);
    };

    useEffect(() => {
        loadAuctions(false);
        loadUserData();
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId) return;

        const intervalId = setInterval(() => {
            loadAuctions(true);
        }, 10000);

        return () => clearInterval(intervalId);
    }, [currentUserId]);

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

    const canSaveProfile = () => {
        const hasProfileChanges = userData.firstName.trim() || userData.lastName.trim() || userData.email.trim();
        const hasPasswordChanges = passwordData.newPassword || passwordData.confirmPassword;
        const profileValid = !validationErrors.firstName && !validationErrors.lastName && !validationErrors.email && !validationErrors.phone;
        const passwordValid = !hasPasswordChanges || (
            !validationErrors.currentPassword && !validationErrors.newPassword && !validationErrors.confirmPassword &&
            passwordData.currentPassword && passwordData.newPassword
        );
        return (hasProfileChanges || hasPasswordChanges) && profileValid && passwordValid;
    };

    const openDeleteModal = (id) => setDeleteModal({ open: true, id });
    const closeDeleteModal = () => setDeleteModal({ open: false, id: null });

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            await axios.delete(`${API_BASE}/api/auctions/${deleteModal.id}`, { params: { userId: currentUserId } });
            setAuctions(p => p.filter(a => a.id !== deleteModal.id));
            closeDeleteModal();
        } catch (err) {
            setDeleteModal({ open: true, id: deleteModal.id, error: err.response?.data || 'Ошибка при удалении' });
        }
    };

    const openFinishModal = (id) => setFinishModal({ open: true, id, error: '' });
    const closeFinishModal = () => setFinishModal({ open: false, id: null, error: '' });

    const confirmFinish = async () => {
        if (!finishModal.id) return;
        try {
            await axios.put(`${API_BASE}/api/auctions/${finishModal.id}/finish`, null, { params: { userId: currentUserId } });
            setAuctions(p => p.map(a => a.id === finishModal.id ? { ...a, status: 'FINISHED' } : a));
            closeFinishModal();
        } catch (err) {
            const errorMsg = err.response?.data || '';
            let userMessage = '';

            if (errorMsg.includes('ставк')) {
                userMessage = 'Вы не можете завершить торги, так как на лот уже есть ставки. Дождитесь окончания времени аукциона или обратитесь в поддержку.';
            } else if (errorMsg.includes('прав') || errorMsg.includes('owner')) {
                userMessage = 'Только владелец лота может завершить торги';
            } else {
                userMessage = 'Не удалось завершить торги: ' + (errorMsg || 'Вы не можете завершить торги, так как на лот уже есть ставки. Дождитесь окончания времени аукциона.');
            }

            setFinishModal({ open: true, id: finishModal.id, error: userMessage });
        }
    };

    const openEditProfileModal = () => {
        setUserData(savedUserData);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setEditError('');
        setEditSuccess('');
        setEditProfileModal(true);
    };

    const handleEditProfile = async () => {
        setEditError('');
        setEditSuccess('');
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

        if (Object.values(errors).some(err => err)) {
            setEditError('Исправьте ошибки в форме');
            return;
        }

        try {
            const rawPhone = userData.phone.replace(/\D/g, '');
            await axios.put(`${API_BASE}/api/users/${currentUserId}`, {
                firstName: userData.firstName.trim(),
                lastName: userData.lastName.trim(),
                phone: rawPhone || '',
                email: userData.email.trim()
            });

            if (passwordData.newPassword && passwordData.currentPassword) {
                await axios.put(`${API_BASE}/api/users/${currentUserId}/password`, {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                });
            }

            setSavedUserData({
                firstName: userData.firstName.trim(),
                lastName: userData.lastName.trim(),
                email: userData.email.trim(),
                phone: userData.phone
            });

            setEditSuccess('✅ Профиль успешно обновлён!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => { setEditProfileModal(false); setEditSuccess(''); }, 1500);
        } catch (err) {
            setEditError(err.response?.data || 'Ошибка при обновлении профиля');
        }
    };

    const formatPhone = (value) => {
        const digits = value.replace(/\D/g, '');
        if (!digits) return '+375 (';

        let numberPart = digits;
        if (digits.startsWith('375')) numberPart = digits.slice(3);
        else if (digits.startsWith('80')) numberPart = digits.slice(2);
        else if (digits.startsWith('7')) numberPart = digits.slice(1);

        const limited = numberPart.slice(0, 9);
        let result = '+375 (';

        if (limited.length === 0) return result;
        if (limited.length === 1) return `${result}${limited[0]}`;
        if (limited.length === 2) return `${result}${limited[0]}${limited[1]})`;
        if (limited.length === 3) return `${result}${limited[0]}${limited[1]}) ${limited[2]}`;
        if (limited.length === 4) return `${result}${limited[0]}${limited[1]}) ${limited[2]}${limited[3]}`;
        if (limited.length === 5) return `${result}${limited[0]}${limited[1]}) ${limited[2]}${limited[3]}${limited[4]}`;
        if (limited.length === 6) return `${result}${limited[0]}${limited[1]}) ${limited[2]}${limited[3]}${limited[4]}-${limited[5]}`;
        if (limited.length === 7) return `${result}${limited[0]}${limited[1]}) ${limited[2]}${limited[3]}${limited[4]}-${limited[5]}${limited[6]}`;
        if (limited.length === 8) return `${result}${limited[0]}${limited[1]}) ${limited[2]}${limited[3]}${limited[4]}-${limited[5]}${limited[6]}-${limited[7]}`;
        if (limited.length >= 9) return `${result}${limited[0]}${limited[1]}) ${limited[2]}${limited[3]}${limited[4]}-${limited[5]}${limited[6]}-${limited[7]}${limited[8]}`;

        return result;
    };

    const handleRelist = (auction) => navigate(`/create?copyId=${auction.id}`);
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
            {editProfileModal && (
                <div className="pf-modal-overlay" onClick={() => setEditProfileModal(false)}>
                    <div className="pf-modal pf-modal--wide" onClick={e => e.stopPropagation()}>
                        <h3 className="pf-modal__title">Настройки профиля</h3>
                        {editError && <div className="pf-modal__error">{editError}</div>}
                        {editSuccess && <div className="pf-modal__success">{editSuccess}</div>}

                        <div className="pf-modal__grid">
                            <div className="pf-modal__section">
                                <h4 className="pf-modal__section-title">Личные данные</h4>
                                <div className="pf-form-group">
                                    <label className="pf-label">Имя <span className="pf-required">*</span></label>
                                    <input type="text" className={`pf-input ${validationErrors.firstName ? 'pf-input--error' : ''}`} value={userData.firstName} onChange={e => setUserData({...userData, firstName: e.target.value})} placeholder="Введите имя" maxLength={50} />
                                    {validationErrors.firstName && <span className="pf-error-msg">{validationErrors.firstName}</span>}
                                </div>
                                <div className="pf-form-group">
                                    <label className="pf-label">Фамилия <span className="pf-required">*</span></label>
                                    <input type="text" className={`pf-input ${validationErrors.lastName ? 'pf-input--error' : ''}`} value={userData.lastName} onChange={e => setUserData({...userData, lastName: e.target.value})} placeholder="Введите фамилию" maxLength={50} />
                                    {validationErrors.lastName && <span className="pf-error-msg">{validationErrors.lastName}</span>}
                                </div>
                                <div className="pf-form-group">
                                    <label className="pf-label">Email <span className="pf-required">*</span></label>
                                    <input type="email" className={`pf-input ${validationErrors.email ? 'pf-input--error' : ''}`} value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} placeholder="example@email.com" maxLength={100} />
                                    {validationErrors.email && <span className="pf-error-msg">{validationErrors.email}</span>}
                                </div>
                                <div className="pf-form-group">
                                    <label className="pf-label">Телефон</label>
                                    <input
                                        type="tel"
                                        className={`pf-input ${validationErrors.phone ? 'pf-input--error' : ''}`}
                                        value={userData.phone}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val.length < userData.phone.length) {
                                                const min = '+375 (';
                                                setUserData({...userData, phone: val.length < min.length ? min : val});
                                                return;
                                            }
                                            setUserData({...userData, phone: formatPhone(val)});
                                        }}
                                        placeholder="+375 (29) 123-45-67"
                                        maxLength={19}
                                        inputMode="tel"
                                    />
                                    {validationErrors.phone && <span className="pf-error-msg">{validationErrors.phone}</span>}
                                    <span className="pf-hint">Формат: +375 (29) 123-45-67</span>
                                </div>
                            </div>

                            <div className="pf-modal__section">
                                <h4 className="pf-modal__section-title">Смена пароля</h4>
                                <span className="pf-hint">Заполните, только если хотите изменить пароль</span>
                                <div className="pf-form-group">
                                    <label className="pf-label">Текущий пароль</label>
                                    <input type="password" className={`pf-input ${validationErrors.currentPassword ? 'pf-input--error' : ''}`} value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} placeholder="••••••••" maxLength={100} autoComplete="current-password" />
                                    <span className="pf-hint">Введите пароль для подтверждения изменений</span>
                                    {validationErrors.currentPassword && <span className="pf-error-msg">{validationErrors.currentPassword}</span>}
                                </div>
                                <div className="pf-form-group">
                                    <label className="pf-label">Новый пароль</label>
                                    <input type="password" className={`pf-input ${validationErrors.newPassword ? 'pf-input--error' : ''}`} value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} placeholder="••••••••" maxLength={100} autoComplete="new-password" />
                                    {validationErrors.newPassword && <span className="pf-error-msg">{validationErrors.newPassword}</span>}
                                    {passwordData.newPassword && !validationErrors.newPassword && <span className="pf-success-msg">✓ Надёжный пароль</span>}
                                </div>
                                <div className="pf-form-group">
                                    <label className="pf-label">Подтвердите пароль</label>
                                    <input type="password" className={`pf-input ${validationErrors.confirmPassword ? 'pf-input--error' : ''}`} value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} placeholder="••••••••" maxLength={100} autoComplete="new-password" />
                                    {validationErrors.confirmPassword && <span className="pf-error-msg">{validationErrors.confirmPassword}</span>}
                                    {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && !validationErrors.confirmPassword && <span className="pf-success-msg">✓ Пароли совпадают</span>}
                                </div>
                            </div>
                        </div>

                        <div className="pf-modal__actions">
                            <button className="pf-btn pf-btn--ghost" onClick={() => setEditProfileModal(false)}>Отмена</button>
                            <button className={`pf-btn pf-btn--primary ${!canSaveProfile() ? 'pf-btn--disabled' : ''}`} onClick={handleEditProfile} disabled={!canSaveProfile()}>Сохранить изменения</button>
                        </div>
                    </div>
                </div>
            )}

            {finishModal.open && (
                <div className="pf-modal-overlay" onClick={closeFinishModal}>
                    <div className="pf-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="pf-modal__title">Завершить торги?</h3>

                        {finishModal.error && (
                            <div className="pf-modal__error" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '4px', color: '#c53030', fontSize: '0.9rem' }}>
                                ⚠️ {finishModal.error}
                            </div>
                        )}

                        <p className="pf-modal__text">
                            {finishModal.error
                                ? ''
                                : 'Вы подтверждаете досрочное завершение торгов. Лот перейдёт в статус «Завершён», новые ставки приниматься не будут.'
                            }
                        </p>
                        <div className="pf-modal__actions">
                            <button className="pf-btn pf-btn--ghost" onClick={closeFinishModal}>
                                Закрыть
                            </button>
                            {!finishModal.error && (
                                <button className="pf-btn pf-btn--finish" onClick={confirmFinish}>Завершить</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                    <div className="pf-hero__row">
                        <h1 className="pf-title">Мои лоты</h1>
                        <button className="pf-btn pf-btn--edit-profile" onClick={openEditProfileModal} type="button">
                            <svg className="pf-btn__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Настройки профиля
                        </button>
                    </div>
                </div>
            </div>

            <div className="pf-wrap pf-body">
                <div className="pf-stats">
                    <div className="pf-stat"><span className="pf-stat__num">{auctions.length}</span><span className="pf-stat__label">Всего лотов</span></div>
                    <div className="pf-stat"><span className="pf-stat__num">{active}</span><span className="pf-stat__label">Активных</span></div>
                    <div className="pf-stat"><span className="pf-stat__num">{finished}</span><span className="pf-stat__label">Завершённых</span></div>
                </div>

                <div className="pf-divider"></div>

                {auctions.length === 0 ? (
                    <div className="pf-empty">
                        <p className="pf-empty__title">У вас пока нет лотов</p>
                        <p className="pf-empty__sub">
                            <Link to="/create" className="pf-link">Выставьте первый автомобиль</Link>, чтобы начать продажи
                        </p>
                    </div>
                ) : (
                    <div className="pf-grid">
                        {auctions.map(a => {
                            const st = STATUS_MAP[a.status] ?? { label: a.status, cls: '' };
                            const img = a.mainImageUrl || null;
                            const canRelist = (a.status === 'FINISHED' || a.status === 'COMPLETED') && !a.winner;
                            const canDelete = a.status !== 'ACTIVE';
                            // ✅ Кнопка редактировать только для PENDING и ACTIVE (без REJECTED)
                            const canEdit = (a.status === 'PENDING' || a.status === 'ACTIVE') && !a.hasBids;
                            return (
                                <div key={a.id} className="pf-card">
                                    <div className="pf-card__photo">{img ? <img src={img} alt={`${a.brand?.name} ${a.model?.name}`} loading="lazy" /> : <div className="pf-card__photo-empty">Нет фото</div>}</div>
                                    <div className="pf-card__body">
                                        <div className="pf-card__head">
                                            <h3 className="pf-card__name">{a.brand?.name} {a.model?.name}</h3>
                                            <span className={`pf-badge ${st.cls}`}>{st.label}</span>
                                        </div>

                                        <div className="pf-card__meta">
                                            <div className="pf-card__meta-item"><span className="pf-card__meta-label">Год</span><span className="pf-card__meta-val">{a.year ?? '—'}</span></div>
                                            <div className="pf-card__meta-item"><span className="pf-card__meta-label">Пробег</span><span className="pf-card__meta-val">{a.mileage ? `${a.mileage.toLocaleString()} км` : '—'}</span></div>
                                            <div className="pf-card__meta-item"><span className="pf-card__meta-label">Создан</span><span className="pf-card__meta-val">{new Date(a.createdAt).toLocaleDateString('ru-RU')}</span></div>
                                            <div className="pf-card__meta-item"><span className="pf-card__meta-label">КПП</span><span className="pf-card__meta-val">{a.transmission?.name ?? '—'}</span></div>
                                        </div>
                                        <div className="pf-card__price"><span className="pf-card__price-val">{a.currentPrice?.toLocaleString()}</span><span className="pf-card__price-cur">BYN</span></div>
                                    </div>
                                    <div className="pf-card__actions">
                                        <Link to={`/auction/${a.id}`} className="pf-btn pf-btn--view">Смотреть детали</Link>
                                        {a.status === 'ACTIVE' && <button className="pf-btn pf-btn--finish" onClick={() => openFinishModal(a.id)}>Завершить торги</button>}
                                        {canEdit && <button className="pf-btn pf-btn--edit" onClick={() => navigate(`/create?editId=${a.id}`)} title="Редактировать лот">✎ Редактировать</button>}
                                        {canRelist && <button className="pf-btn pf-btn--publish" onClick={() => handleRelist(a)}>Выставить повторно</button>}
                                        {canDelete && <button className="pf-btn pf-btn--delete" onClick={() => openDeleteModal(a.id)}>Удалить</button>}
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