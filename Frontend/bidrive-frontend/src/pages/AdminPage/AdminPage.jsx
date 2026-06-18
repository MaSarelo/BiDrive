import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BynIcon from '../../components/BynIcon';
import './AdminPage.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = 'http://localhost:8080';

const Field = ({ label, required, children }) => (
    <div className="ca-field">
        <label className={`ca-label${required ? ' required' : ''}`}>{label}</label>
        {children}
    </div>
);

function AdminPage() {
    const [auctions, setAuctions] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [brandStats, setBrandStats] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // === ПАГИНАЦИЯ ЗАПРОСОВ ===
    const [requestPage, setRequestPage] = useState(1);
    const REQUESTS_PER_PAGE = 10;

    // === ПАГИНАЦИЯ МОДЕРАЦИИ ===
    const [moderationPage, setModerationPage] = useState(1);
    const MODERATION_PER_PAGE = 10;

    // === TOAST ===
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // === THEME ===
    const [isLightTheme, setIsLightTheme] = useState(() =>
        document.documentElement.classList.contains('light-theme') || localStorage.getItem('theme') === 'light'
    );
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsLightTheme(document.documentElement.classList.contains('light-theme'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const axisColor = isLightTheme ? '#1F2328' : '#F0F6FC';
    const gridColor = isLightTheme ? 'rgba(31, 35, 40, 0.15)' : '#30363D';
    const tooltipBg = isLightTheme ? '#FFFFFF' : '#161B22';
    const tooltipBorder = isLightTheme ? 'rgba(31, 35, 40, 0.15)' : '#30363D';
    const cursorColor = isLightTheme ? '#F6F8FA' : '#21262D';
    const legendColor = isLightTheme ? '#656D76' : '#8B949E';

    // === MODALS ===
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectError, setRejectError] = useState('');
    const [modal, setModal] = useState({ isOpen: false, type: '', id: null, name: '' });
    const [viewingAuction, setViewingAuction] = useState(null);
    const [roleModal, setRoleModal] = useState({ isOpen: false, userId: null, newRoleId: null });

    // === REFERENCES ===
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [cities, setCities] = useState([]);
    const [regions, setRegions] = useState([]);
    const [newBrand, setNewBrand] = useState('');
    const [newModel, setNewModel] = useState({ name: '', brandId: '' });
    const [newCity, setNewCity] = useState({ name: '', regionId: '' });
    const [searchBrand, setSearchBrand] = useState('');
    const [searchModel, setSearchModel] = useState('');
    const [searchCity, setSearchCity] = useState('');
    const [editingBrandId, setEditingBrandId] = useState(null);
    const [editingBrandName, setEditingBrandName] = useState('');
    const [editingModelId, setEditingModelId] = useState(null);
    const [editingModelName, setEditingModelName] = useState('');
    const [editingCityId, setEditingCityId] = useState(null);
    const [editingCityName, setEditingCityName] = useState('');
    const [editingCityRegionId, setEditingCityRegionId] = useState('');

    // === USERS ===
    const [searchUser, setSearchUser] = useState('');
    const [userPage, setUserPage] = useState(1);
    const USERS_PER_PAGE = 10;

    // === DATA LOADING ===
    useEffect(() => {
        // eslint-disable-next-line react-hooks/immutability
        fetchAuctions();
        // eslint-disable-next-line react-hooks/immutability
        fetchUsers();
        // eslint-disable-next-line react-hooks/immutability
        fetchStats();
        // eslint-disable-next-line react-hooks/immutability
        fetchReferenceData();
        // eslint-disable-next-line react-hooks/immutability
        fetchRequests();
        setLoading(false);

        const intervalId = setInterval(() => {
            fetchStats();
            fetchRequests();
        }, 30000);
        return () => clearInterval(intervalId);
    }, []);

    const fetchAuctions = () => axios.get(`${API_BASE}/api/auctions/pending`).then(r => setAuctions(r.data)).catch(console.error);
    const fetchUsers = () => axios.get(`${API_BASE}/api/users`).then(r => setUsers(r.data)).catch(console.error);

    const fetchStats = async () => {
        try {
            const statsRes = await axios.get(`${API_BASE}/api/admin/stats`);
            setStats(statsRes.data);
            const [activeRes, pendingRes] = await Promise.all([
                axios.get(`${API_BASE}/api/auctions`).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/api/auctions/pending`).catch(() => ({ data: [] }))
            ]);
            const allAuctions = [...(activeRes.data || []), ...(pendingRes.data || [])];
            const brandCount = {};
            allAuctions.forEach(a => { const name = a.brand?.name || 'Без марки'; brandCount[name] = (brandCount[name] || 0) + 1; });
            const sorted = Object.entries(brandCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
            const top5 = sorted.slice(0, 5);
            const othersValue = sorted.slice(5).reduce((s, i) => s + i.value, 0);
            setBrandStats([...top5, ...(othersValue > 0 ? [{ name: 'Другие', value: othersValue }] : [])]);
        } catch (err) { console.error('Ошибка статистики:', err); }
    };

    const fetchRequests = () => {
        axios.get(`${API_BASE}/api/admin/requests`)
            .then(r => {
                setRequests(r.data);
                setRequestPage(1);
            })
            .catch(err => console.error('Ошибка загрузки запросов:', err));
    };

    const fetchReferenceData = () => {
        axios.get(`${API_BASE}/api/admin/data/brands`).then(r => setBrands(r.data));
        axios.get(`${API_BASE}/api/admin/data/models`).then(r => setModels(r.data));
        axios.get(`${API_BASE}/api/admin/data/cities`).then(r => setCities(r.data));
        axios.get(`${API_BASE}/api/admin/data/regions`).then(r => setRegions(r.data));
    };

    // === ACTIONS ===
    const handleApprove = (id) => {
        axios.put(`${API_BASE}/api/auctions/${id}/approve`)
            .then(() => { setAuctions(p => p.filter(a => a.id !== id)); fetchStats(); showToast('Лот одобрен', 'success'); })
            .catch(() => showToast('Ошибка при одобрении', 'error'));
    };

    const handleRejectInit = (id) => { setRejectingId(id); setRejectReason(''); setRejectError(''); };
    const handleRejectConfirm = () => {
        if (!rejectReason.trim()) { setRejectError('Укажите причину'); return; }
        axios.post(`${API_BASE}/api/auctions/${rejectingId}/reject`, null, { params: { reason: rejectReason } })
            .then(() => { setAuctions(p => p.filter(a => a.id !== rejectingId)); setRejectingId(null); fetchStats(); showToast('Лот отклонён', 'success'); })
            .catch(() => showToast('Ошибка при отклонении', 'error'));
    };

    const handleBlock = (userId, isBlocked) => {
        axios.put(`${API_BASE}/api/users/${userId}/block`, null, { params: { isBlocked } })
            .then(() => { setUsers(p => p.map(u => u.id === userId ? { ...u, isBlocked } : u)); fetchStats(); showToast(`Пользователь ${isBlocked ? 'заблокирован' : 'разблокирован'}`, 'success'); })
            .catch(() => showToast('Ошибка при изменении статуса', 'error'));
    };

    const openRoleModal = (userId, newRoleId) => setRoleModal({ isOpen: true, userId, newRoleId });
    const confirmRoleChange = () => {
        const { userId, newRoleId } = roleModal;
        if (!userId || !newRoleId) return;
        axios.put(`${API_BASE}/api/users/${userId}/role`, null, { params: { roleId: newRoleId } })
            .then(() => {
                setUsers(p => p.map(u => u.id === userId ? { ...u, roleId: newRoleId } : u));
                fetchStats();
                showToast('Роль пользователя успешно изменена', 'success');
                setRoleModal({ isOpen: false, userId: null, newRoleId: null });
            })
            .catch(err => {
                showToast(err.response?.data || 'Ошибка при смене роли', 'error');
                fetchUsers();
                setRoleModal({ isOpen: false, userId: null, newRoleId: null });
            });
    };

    const openDeleteModal = (type, id, name) => setModal({ isOpen: true, type, id, name });
    const closeModal = () => setModal({ isOpen: false, type: '', id: null, name: '' });

    // === УДАЛЕНИЕ С УЛУЧШЕННОЙ ОБРАБОТКОЙ ОШИБОК ===
    const handleConfirmDelete = () => {
        const { type, id, name } = modal;
        let request;
        let typeName = '';
        if (type === 'brand') { request = axios.delete(`${API_BASE}/api/admin/data/brands/${id}`); typeName = 'марка'; }
        if (type === 'model') { request = axios.delete(`${API_BASE}/api/admin/data/models/${id}`); typeName = 'модель'; }
        if (type === 'city') { request = axios.delete(`${API_BASE}/api/admin/data/cities/${id}`); typeName = 'город'; }
        if (request) {
            request.then(() => {
                fetchReferenceData();
                closeModal();
                fetchStats();
                showToast(`${typeName.charAt(0).toUpperCase() + typeName.slice(1)} "${name}" удалена`, 'success');
            })
                .catch(err => {
                    // Пытаемся получить сообщение от сервера
                    const serverMsg = err.response?.data;
                    let message;
                    if (typeof serverMsg === 'string') {
                        message = serverMsg;
                    } else if (type === 'brand') {
                        message = `Невозможно удалить марку "${name}": она используется в лотах`;
                    } else if (type === 'model') {
                        message = `Невозможно удалить модель "${name}": она используется в лотах`;
                    } else if (type === 'city') {
                        message = `Невозможно удалить город "${name}": он используется в лотах`;
                    } else {
                        message = 'Ошибка при удалении';
                    }
                    showToast(message, 'error');
                });
        }
    };

    // === ДОБАВЛЕНИЕ С ВАЛИДАЦИЕЙ ===
    const handleAddBrand = (e) => {
        e.preventDefault();
        if (!newBrand.trim()) {
            showToast('Введите название марки', 'error');
            return;
        }
        axios.post(`${API_BASE}/api/admin/data/brands`, { name: newBrand })
            .then(() => {
                setNewBrand('');
                fetchReferenceData();
                fetchStats();
                showToast('Марка добавлена', 'success');
            })
            .catch(() => showToast('Ошибка при добавлении марки', 'error'));
    };

    const handleAddModel = (e) => {
        e.preventDefault();
        if (!newModel.name || !newModel.brandId) {
            showToast('Заполните все поля', 'error');
            return;
        }
        axios.post(`${API_BASE}/api/admin/data/models`, null, { params: newModel })
            .then(() => {
                setNewModel({ name: '', brandId: '' });
                fetchReferenceData();
                fetchStats();
                showToast('Модель добавлена', 'success');
            })
            .catch(() => showToast('Ошибка при добавлении модели', 'error'));
    };

    const handleAddCity = (e) => {
        e.preventDefault();
        if (!newCity.name || !newCity.regionId) {
            showToast('Заполните все поля', 'error');
            return;
        }
        axios.post(`${API_BASE}/api/admin/data/cities`, null, { params: newCity })
            .then(() => {
                setNewCity({ name: '', regionId: '' });
                fetchReferenceData();
                fetchStats();
                showToast('Город добавлен', 'success');
            })
            .catch(() => showToast('Ошибка при добавлении города', 'error'));
    };

    // === РЕДАКТИРОВАНИЕ С ВАЛИДАЦИЕЙ ===
    const startEditBrand = (b) => { setEditingBrandId(b.id); setEditingBrandName(b.name); };
    const cancelEditBrand = () => { setEditingBrandId(null); setEditingBrandName(''); };
    const saveBrand = (id) => {
        if (!editingBrandName.trim()) {
            showToast('Название марки не может быть пустым', 'error');
            return;
        }
        axios.put(`${API_BASE}/api/admin/data/brands/${id}`, { name: editingBrandName })
            .then(() => {
                fetchReferenceData();
                cancelEditBrand();
                fetchStats();
                showToast('Марка обновлена', 'success');
            })
            .catch(() => showToast('Ошибка при обновлении марки', 'error'));
    };

    const startEditModel = (m) => { setEditingModelId(m.id); setEditingModelName(m.name); };
    const cancelEditModel = () => { setEditingModelId(null); setEditingModelName(''); };
    const saveModel = (id) => {
        if (!editingModelName.trim()) {
            showToast('Название модели не может быть пустым', 'error');
            return;
        }
        axios.put(`${API_BASE}/api/admin/data/models/${id}`, null, { params: { name: editingModelName } })
            .then(() => {
                fetchReferenceData();
                cancelEditModel();
                fetchStats();
                showToast('Модель обновлена', 'success');
            })
            .catch(() => showToast('Ошибка при обновлении модели', 'error'));
    };

    const startEditCity = (c) => {
        setEditingCityId(c.id);
        setEditingCityName(c.name);
        setEditingCityRegionId(c.region?.id || '');
    };
    const cancelEditCity = () => {
        setEditingCityId(null);
        setEditingCityName('');
        setEditingCityRegionId('');
    };
    const saveCity = (id) => {
        if (!editingCityName.trim()) {
            showToast('Название города не может быть пустым', 'error');
            return;
        }
        if (!editingCityRegionId) {
            showToast('Выберите область', 'error');
            return;
        }
        axios.put(`${API_BASE}/api/admin/data/cities/${id}`, null, {
            params: { name: editingCityName, regionId: editingCityRegionId }
        })
            .then(() => {
                fetchReferenceData();
                cancelEditCity();
                fetchStats();
                showToast('Город обновлён', 'success');
            })
            .catch(() => showToast('Ошибка при обновлении города', 'error'));
    };

    // === FILTERS & PAGINATION ===
    const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(searchBrand.toLowerCase()));
    const filteredModels = models.filter(m => m.name.toLowerCase().includes(searchModel.toLowerCase()) || m.brand?.name.toLowerCase().includes(searchModel.toLowerCase()));
    const filteredCities = cities.filter(c => c.name.toLowerCase().includes(searchCity.toLowerCase()) || c.region?.name.toLowerCase().includes(searchCity.toLowerCase()));
    const sortedUsers = [...users].sort(({ roleId: a }, { roleId: b }) => (b === 2 ? 1 : 0) - (a === 2 ? 1 : 0));
    const searchedUsers = sortedUsers.filter(u => {
        const q = searchUser.toLowerCase();
        return u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });
    const paginatedUsers = searchedUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);
    const totalPages = Math.ceil(searchedUsers.length / USERS_PER_PAGE);

    // === ПАГИНАЦИЯ ЗАПРОСОВ ===
    const paginatedRequests = requests.slice(
        (requestPage - 1) * REQUESTS_PER_PAGE,
        requestPage * REQUESTS_PER_PAGE
    );
    const totalRequestPages = Math.ceil(requests.length / REQUESTS_PER_PAGE);

    // === ПАГИНАЦИЯ МОДЕРАЦИИ ===
    const paginatedAuctions = auctions.slice(
        (moderationPage - 1) * MODERATION_PER_PAGE,
        moderationPage * MODERATION_PER_PAGE
    );
    const totalModerationPages = Math.ceil(auctions.length / MODERATION_PER_PAGE);

    useEffect(() => { setUserPage(1); }, [searchUser]);

    // Сброс страницы модерации при изменении количества лотов
    useEffect(() => { setModerationPage(1); }, [auctions.length]);

    if (loading) return <div className="ap-loading">Загрузка...</div>;

    return (
        <div className="ap">
            {/* === MODALS === */}
            {viewingAuction && (
                <div className="ap-modal-overlay" onClick={() => setViewingAuction(null)}>
                    <div className="ap-modal ap-modal--large" onClick={e => e.stopPropagation()}>
                        <div className="ap-modal__header">
                            <h3 className="ap-modal__title">Детали лота #{viewingAuction.id}</h3>
                            <button className="ap-modal__close" onClick={() => setViewingAuction(null)}>×</button>
                        </div>
                        <div className="ap-modal__content">
                            <div className="ap-auction-detail">
                                <div className="ap-auction-detail__images">
                                    {viewingAuction.imageUrls?.length > 0 ? viewingAuction.imageUrls.map((url, idx) => (
                                        <img key={idx} src={url} alt={`Фото ${idx + 1}`} className="ap-auction-detail__img" />
                                    )) : <div className="ap-auction-detail__no-img">Нет фото</div>}
                                </div>
                                <div className="ap-auction-detail__info">
                                    <h4>{viewingAuction.brand?.name} {viewingAuction.model?.name}</h4>
                                    <div className="ap-auction-detail__grid">
                                        <div><strong>Год:</strong> {viewingAuction.year}</div>
                                        <div><strong>Пробег:</strong> {viewingAuction.mileage?.toLocaleString()} км</div>
                                        <div><strong>КПП:</strong> {viewingAuction.transmission?.name}</div>
                                        <div><strong>Топливо:</strong> {viewingAuction.fuelType?.name}</div>
                                        <div><strong>VIN:</strong> {viewingAuction.vin || 'Не указан'}</div>
                                        <div><strong>Город:</strong> {viewingAuction.city?.name}</div>
                                    </div>
                                    <div className="ap-auction-detail__price"><strong>Начальная цена:</strong> {viewingAuction.startingPrice?.toLocaleString()} BYN</div>
                                    <div className="ap-auction-detail__price"><strong>Шаг ставки:</strong> {viewingAuction.minBidStep?.toLocaleString()} BYN</div>
                                    <div className="ap-auction-detail__time"><strong>Окончание:</strong> {new Date(viewingAuction.endTime).toLocaleString('ru-RU')}</div>
                                    {viewingAuction.description && <div className="ap-auction-detail__desc"><strong>Описание:</strong><p>{viewingAuction.description}</p></div>}
                                    <div className="ap-auction-detail__seller"><strong>Продавец:</strong> {viewingAuction.seller?.firstName} {viewingAuction.seller?.lastName}</div>
                                </div>
                            </div>
                        </div>
                        <div className="ap-modal__actions">
                            <button className="ap-btn ap-btn--ghost" onClick={() => setViewingAuction(null)}>Закрыть</button>
                            <button className="ap-btn ap-btn--green" onClick={() => { handleApprove(viewingAuction.id); setViewingAuction(null); }}>Одобрить</button>
                            <button className="ap-btn ap-btn--red" onClick={() => { setViewingAuction(null); handleRejectInit(viewingAuction.id); }}>Отклонить</button>
                        </div>
                    </div>
                </div>
            )}

            {rejectingId && (
                <div className="ap-modal-overlay" onClick={() => setRejectingId(null)}>
                    <div className="ap-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="ap-modal__title">Отклонение лота</h3>
                        <textarea className="ap-modal__textarea" placeholder="Причина отклонения..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} autoFocus />
                        {rejectError && <div className="ap-modal__error">{rejectError}</div>}
                        <div className="ap-modal__actions">
                            <button className="ap-btn ap-btn--ghost" onClick={() => setRejectingId(null)}>Отмена</button>
                            <button className="ap-btn ap-btn--red" onClick={handleRejectConfirm}>Подтвердить</button>
                        </div>
                    </div>
                </div>
            )}

            {modal.isOpen && (
                <div className="ap-modal-overlay" onClick={closeModal}>
                    <div className="ap-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="ap-modal__title">Удалить "{modal.name}"?</h3>
                        <div className="ap-modal__actions">
                            <button className="ap-btn ap-btn--ghost" onClick={closeModal}>Отмена</button>
                            <button className="ap-btn ap-btn--red" onClick={handleConfirmDelete}>Удалить</button>
                        </div>
                    </div>
                </div>
            )}

            {roleModal.isOpen && (
                <div className="ap-modal-overlay" onClick={() => setRoleModal({ isOpen: false, userId: null, newRoleId: null })}>
                    <div className="ap-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="ap-modal__title">Изменить роль?</h3>
                        <p className="ap-modal__text">
                            Пользователю будут назначены права <strong>{roleModal.newRoleId === 2 ? 'администратора' : 'обычного пользователя'}</strong>.
                        </p>
                        <div className="ap-modal__actions">
                            <button className="ap-btn ap-btn--ghost" onClick={() => setRoleModal({ isOpen: false, userId: null, newRoleId: null })}>Отмена</button>
                            <button className="ap-btn ap-btn--primary" onClick={confirmRoleChange}>Подтвердить</button>
                        </div>
                    </div>
                </div>
            )}

            <header className="ap-header">
                <div className="ap-header__inner">
                    <h1 className="ap-title">Панель администратора</h1>
                    <Link to="/" className="ap-back">← На главную</Link>
                </div>
            </header>

            <main className="ap-main">
                {/* === STATS === */}
                <section className="ap-section">
                    <p className="ap-section-heading">Статистика платформы</p>
                    {stats && (
                        <>
                            <div className="ap-stats-grid">
                                <div className="ap-stat-card"><span className="ap-stat-card__value">{stats.totalUsers}</span><span className="ap-stat-card__label">Пользователей</span></div>
                                <div className="ap-stat-card"><span className="ap-stat-card__value">{stats.activeAuctions}</span><span className="ap-stat-card__label">Активных аукционов</span></div>
                                <div className="ap-stat-card"><span className="ap-stat-card__value">{stats.totalBids}</span><span className="ap-stat-card__label">Всего ставок</span></div>
                                <div className="ap-stat-card"><span className="ap-stat-card__value">{stats.totalTurnover?.toLocaleString('ru-RU')}<BynIcon className="ap-currency-icon" /></span><span className="ap-stat-card__label">Оборот</span></div>
                            </div>
                            <div className="ap-chart-container">
                                <h3 className="ap-chart-title">Топ-5 марок автомобилей на платформе</h3>
                                {brandStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={brandStats} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                                            <XAxis type="number" stroke={axisColor} allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" stroke={axisColor} width={70} />
                                            <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '6px', color: axisColor }} cursor={{ fill: cursorColor }} />
                                            <Legend wrapperStyle={{ color: legendColor, fontSize: '0.75rem' }} />
                                            <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={30} name="Количество лотов" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B949E' }}>Нет данных</div>}
                            </div>
                        </>
                    )}
                </section>

                {/* === ЗАПРОСЫ НА ПРОДЛЕНИЕ (С ПАГИНАЦИЕЙ) === */}
                {requests.length > 0 && (
                    <section className="ap-section">
                        <p className="ap-section-heading">Запросы на рассмотрение ({requests.length})</p>

                        <div className="ap-requests-list">
                            {paginatedRequests.map(req => (
                                <div key={req.id} className="ap-request-card">
                                    <div className="ap-request-card__info">
                                        <h4>{req.carName}</h4>
                                        <p className="ap-request-card__meta">
                                            Продавец: <strong>{req.sellerName}</strong>
                                        </p>
                                        <p className="ap-request-card__meta">
                                            Причина: {req.reason || "Не указана"}
                                        </p>
                                        <p className="ap-request-card__meta">
                                            Запрошено: {new Date(req.createdAt).toLocaleString('ru-RU')}
                                        </p>
                                        <Link
                                            to={`/auctions/${req.auctionId}?from=admin`}
                                            className="ap-btn ap-btn--ghost"
                                            style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', textDecoration: 'none' }}
                                        >
                                            👁 Просмотреть лот
                                        </Link>
                                    </div>
                                    <div className="ap-request-card__actions">
                                        <button
                                            className="ap-btn ap-btn--green"
                                            onClick={() => {
                                                axios.post(`${API_BASE}/api/admin/requests/${req.id}/approve`)
                                                    .then(() => { fetchRequests(); showToast('Аукцион продлён на 24 часа', 'success'); })
                                                    .catch(() => showToast('Ошибка при одобрении', 'error'));
                                            }}
                                        >
                                            ✔ Одобрить
                                        </button>
                                        <button
                                            className="ap-btn ap-btn--red"
                                            onClick={() => {
                                                axios.post(`${API_BASE}/api/admin/requests/${req.id}/reject`)
                                                    .then(() => { fetchRequests(); showToast('Запрос отклонён', 'success'); })
                                                    .catch(() => showToast('Ошибка при отклонении', 'error'));
                                            }}
                                        >
                                            ✕ Отклонить
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalRequestPages > 1 && (
                            <div className="ap-pagination">
                                <button
                                    onClick={() => setRequestPage(p => Math.max(1, p - 1))}
                                    disabled={requestPage === 1}
                                    className="ap-pagination-btn"
                                >
                                    ← Назад
                                </button>
                                <span className="ap-pagination-info">
                                    Страница {requestPage} из {totalRequestPages}
                                </span>
                                <button
                                    onClick={() => setRequestPage(p => Math.min(totalRequestPages, p + 1))}
                                    disabled={requestPage >= totalRequestPages}
                                    className="ap-pagination-btn"
                                >
                                    Вперёд →
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* === MODERATION === */}
                <section className="ap-section">
                    <p className="ap-section-heading">Модерация лотов ({auctions.length})</p>
                    {auctions.length === 0 ? (
                        <div className="ap-empty"><div className="ap-empty__icon">✓</div><p>Нет лотов на проверке</p></div>
                    ) : (
                        <>
                            <div className="ap-list">
                                {paginatedAuctions.map(a => (
                                    <article key={a.id} className="ap-card">
                                        <div className="ap-card__left">
                                            {a.mainImageUrl ? <img src={a.mainImageUrl} alt="Фото" className="ap-card__img" /> : <div className="ap-card__img ap-card__img--empty">Нет фото</div>}
                                        </div>
                                        <div className="ap-card__body">
                                            <h3 className="ap-card__title">{a.brand?.name} {a.model?.name}</h3>
                                            <div className="ap-card__meta"><span>Год: {a.year}</span><span>Пробег: {a.mileage?.toLocaleString()} км</span></div>
                                            <p className="ap-card__price">Старт: {a.startingPrice?.toLocaleString()} BYN</p>
                                        </div>
                                        <div className="ap-card__actions">
                                            <Link to={`/auctions/${a.id}`} className="ap-btn ap-btn--primary">Просмотреть</Link>
                                            <button className="ap-btn ap-btn--green" onClick={() => handleApprove(a.id)}>Одобрить</button>
                                            <button className="ap-btn ap-btn--red" onClick={() => handleRejectInit(a.id)}>Отклонить</button>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {totalModerationPages > 1 && (
                                <div className="ap-pagination">
                                    <button
                                        onClick={() => setModerationPage(p => Math.max(1, p - 1))}
                                        disabled={moderationPage === 1}
                                        className="ap-pagination-btn"
                                    >
                                        ← Назад
                                    </button>
                                    <span className="ap-pagination-info">
                                        Страница {moderationPage} из {totalModerationPages}
                                    </span>
                                    <button
                                        onClick={() => setModerationPage(p => Math.min(totalModerationPages, p + 1))}
                                        disabled={moderationPage >= totalModerationPages}
                                        className="ap-pagination-btn"
                                    >
                                        Вперёд →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* === USERS === */}
                <section className="ap-section">
                    <div className="ap-section-header">
                        <p className="ap-section-heading">Пользователи</p>
                        <div className={`ap-search-box ${searchUser ? 'has-value' : ''}`}>
                            <input type="text" placeholder="Поиск пользователя..." value={searchUser} onChange={e => setSearchUser(e.target.value)} className="ap-search-input" />
                            <svg className="ap-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                            {searchUser && <button onClick={() => setSearchUser('')} className="ap-search-clear">×</button>}
                        </div>
                    </div>
                    {searchedUsers.length > USERS_PER_PAGE && (
                        <div className="ap-pagination">
                            <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="ap-pagination-btn">← Назад</button>
                            <span className="ap-pagination-info">Страница {userPage} из {totalPages} ({searchedUsers.length} найдено)</span>
                            <button onClick={() => setUserPage(p => Math.min(totalPages, p + 1))} disabled={userPage >= totalPages} className="ap-pagination-btn">Вперёд →</button>
                        </div>
                    )}
                    <div className="ap-users">
                        {paginatedUsers.length === 0 ? <p className="ap-empty">Пользователи не найдены</p> : paginatedUsers.map(u => (
                            <div key={u.id} className="ap-user">
                                <div className="ap-user__info">
                                    <span className="ap-user__name">{u.firstName} {u.lastName}</span>
                                    <span className="ap-user__email">{u.email}</span>
                                    <div className="ap-user__tags">
                                        {u.roleId === 2 && <span className="ap-tag ap-tag--admin">Админ</span>}
                                        {u.isBlocked && <span className="ap-tag ap-tag--blocked">Заблокирован</span>}
                                    </div>
                                </div>
                                <div className="ap-user__actions">
                                    {u.roleId !== 2 && (
                                        u.isBlocked ? (
                                            <button className="ap-user__unblock-btn" onClick={() => handleBlock(u.id, false)}>
                                                Разблокировать
                                            </button>
                                        ) : (
                                            <button className="ap-user__block-btn" onClick={() => handleBlock(u.id, true)}>Заблокировать</button>
                                        )
                                    )}
                                    {u.id.toString() !== localStorage.getItem('userId') && (
                                        <select className="ap-user__role-select" value={u.roleId} onChange={e => openRoleModal(u.id, parseInt(e.target.value))}>
                                            <option value={1}>Пользователь</option>
                                            <option value={2}>Администратор</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* === REFERENCES === */}
                <section className="ap-section">
                    <p className="ap-section-heading">Справочники</p>
                    <div className="ap-reference">
                        <div className="ap-ref-col">
                            <h3 className="ap-ref-col__title">Марки автомобилей</h3>
                            <form className="ap-ref-form" onSubmit={handleAddBrand}>
                                <input type="text" placeholder="Новая марка" value={newBrand} onChange={e => setNewBrand(e.target.value)} className="ap-ref-input" />
                                <button type="submit" className="ap-btn ap-btn--primary">+</button>
                            </form>
                            <input type="text" placeholder="Поиск..." value={searchBrand} onChange={e => setSearchBrand(e.target.value)} className="ap-ref-search" />
                            <ul className="ap-ref-list ap-ref-list--brands">
                                {filteredBrands.map(b => (
                                    <li key={b.id} className="ap-ref-item">
                                        {editingBrandId === b.id ? (
                                            <div className="ap-ref-edit">
                                                <input value={editingBrandName} onChange={e => setEditingBrandName(e.target.value)} className="ap-ref-input ap-ref-input--edit" autoFocus />
                                                <button className="ap-ref-save" onClick={() => saveBrand(b.id)}>✓</button>
                                                <button className="ap-ref-cancel" onClick={cancelEditBrand}>×</button>
                                            </div>
                                        ) : (
                                            <>
                                                <span>{b.name}</span>
                                                <div className="ap-ref-actions">
                                                    <button className="ap-ref-edit-btn" onClick={() => startEditBrand(b)}>✎</button>
                                                    <button className="ap-ref-del" onClick={() => openDeleteModal('brand', b.id, b.name)}>×</button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="ap-ref-col">
                            <h3 className="ap-ref-col__title">Модели</h3>
                            <form className="ap-ref-form" onSubmit={handleAddModel}>
                                <select value={newModel.brandId} onChange={e => setNewModel({ ...newModel, brandId: e.target.value })} className="ap-ref-select">
                                    <option value="">Марка...</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                <input type="text" placeholder="Модель" value={newModel.name} onChange={e => setNewModel({ ...newModel, name: e.target.value })} className="ap-ref-input" />
                                <button type="submit" className="ap-btn ap-btn--primary">+</button>
                            </form>
                            <input type="text" placeholder="Поиск..." value={searchModel} onChange={e => setSearchModel(e.target.value)} className="ap-ref-search" />
                            <ul className="ap-ref-list">
                                {filteredModels.map(m => (
                                    <li key={m.id} className="ap-ref-item">
                                        {editingModelId === m.id ? (
                                            <div className="ap-ref-edit">
                                                <input value={editingModelName} onChange={e => setEditingModelName(e.target.value)} className="ap-ref-input ap-ref-input--edit" autoFocus />
                                                <button className="ap-ref-save" onClick={() => saveModel(m.id)}>✓</button>
                                                <button className="ap-ref-cancel" onClick={cancelEditModel}>×</button>
                                            </div>
                                        ) : (
                                            <>
                                                <span>{m.brand?.name} {m.name}</span>
                                                <div className="ap-ref-actions">
                                                    <button className="ap-ref-edit-btn" onClick={() => startEditModel(m)}>✎</button>
                                                    <button className="ap-ref-del" onClick={() => openDeleteModal('model', m.id, m.name)}>×</button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="ap-ref-col">
                            <h3 className="ap-ref-col__title">Города</h3>
                            <form className="ap-ref-form" onSubmit={handleAddCity}>
                                <select value={newCity.regionId} onChange={e => setNewCity({ ...newCity, regionId: e.target.value })} className="ap-ref-select">
                                    <option value="">Область...</option>
                                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                                <input type="text" placeholder="Город" value={newCity.name} onChange={e => setNewCity({ ...newCity, name: e.target.value })} className="ap-ref-input" />
                                <button type="submit" className="ap-btn ap-btn--primary">+</button>
                            </form>
                            <input type="text" placeholder="Поиск..." value={searchCity} onChange={e => setSearchCity(e.target.value)} className="ap-ref-search" />
                            <ul className="ap-ref-list">
                                {filteredCities.map(c => (
                                    <li key={c.id} className="ap-ref-item">
                                        {editingCityId === c.id ? (
                                            <div className="ap-ref-edit ap-ref-edit--vertical">
                                                <div className="ap-ref-edit__row">
                                                    <select
                                                        value={editingCityRegionId}
                                                        onChange={e => setEditingCityRegionId(e.target.value)}
                                                        className="ap-ref-select"
                                                    >
                                                        <option value="">Область...</option>
                                                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="ap-ref-edit__row ap-ref-edit__row--actions">
                                                    <input
                                                        value={editingCityName}
                                                        onChange={e => setEditingCityName(e.target.value)}
                                                        className="ap-ref-input ap-ref-input--edit"
                                                        placeholder="Город"
                                                        autoFocus
                                                    />
                                                    <button className="ap-ref-save" onClick={() => saveCity(c.id)}>✓</button>
                                                    <button className="ap-ref-cancel" onClick={cancelEditCity}>×</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <span>{c.name} <small>({c.region?.name})</small></span>
                                                <div className="ap-ref-actions">
                                                    <button className="ap-ref-edit-btn" onClick={() => startEditCity(c)}>✎</button>
                                                    <button className="ap-ref-del" onClick={() => openDeleteModal('city', c.id, c.name)}>×</button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            </main>

            {/* === TOAST === */}
            {toast.show && (
                <div className={`ap-toast ap-toast--${toast.type}`}>
                    <span className="ap-toast__icon">{toast.type === 'success' ? '✓' : '✕'}</span>
                    <span className="ap-toast__message">{toast.message}</span>
                    <button className="ap-toast__close" onClick={() => setToast({ ...toast, show: false })}>×</button>
                </div>
            )}
        </div>
    );
}

export default AdminPage;