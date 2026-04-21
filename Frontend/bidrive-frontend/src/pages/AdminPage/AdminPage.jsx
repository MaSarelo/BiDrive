import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BynIcon from '../../components/BynIcon';
import './AdminPage.css';

const API_URL = 'http://localhost:8080';

function AdminPage() {
    // === Auctions & Users State ===
    const [auctions, setAuctions] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectError, setRejectError] = useState('');

    // === Reference Data State ===
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [cities, setCities] = useState([]);
    const [regions, setRegions] = useState([]);

    // === Forms State ===
    const [newBrand, setNewBrand] = useState('');
    const [newModel, setNewModel] = useState({ name: '', brandId: '' });
    const [newCity, setNewCity] = useState({ name: '', regionId: '' });

    // === Search State ===
    const [searchBrand, setSearchBrand] = useState('');
    const [searchModel, setSearchModel] = useState('');
    const [searchCity, setSearchCity] = useState('');

    // === Modal State ===
    const [modal, setModal] = useState({ isOpen: false, type: '', id: null, name: '' });
    const [modalError, setModalError] = useState(''); // Состояние для ошибки в модальном окне

    useEffect(() => {
        fetchAuctions();
        fetchUsers();
        fetchStats();
        fetchReferenceData();
    }, []);

    // === Fetch Functions ===

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

    const fetchReferenceData = () => {
        axios.get(`${API_URL}/api/admin/data/brands`).then(r => setBrands(r.data));
        axios.get(`${API_URL}/api/admin/data/models`).then(r => setModels(r.data));
        axios.get(`${API_URL}/api/admin/data/cities`).then(r => setCities(r.data));
        axios.get(`${API_URL}/api/admin/data/regions`).then(r => setRegions(r.data));
    };

    // === Auction Actions ===

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
            setRejectError('Укажите причину отклонения');
            return;
        }
        setRejectError('');
        axios.post(`${API_URL}/api/auctions/${id}/reject`, null, { params: { reason: rejectReason } })
            .then(() => {
                setAuctions(prev => prev.filter(a => a.id !== id));
                setRejectingId(null);
            })
            .catch(err => console.error(err));
    };

    // === User Actions ===

    const handleBlock = (userId) => {
        axios.put(`${API_URL}/api/users/${userId}/block`, null, { params: { isBlocked: true } })
            .then(() => setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: true } : u)))
            .catch(err => console.error(err));
    };

    const handleUnblock = (userId) => {
        axios.put(`${API_URL}/api/users/${userId}/block`, null, { params: { isBlocked: false } })
            .then(() => setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: false } : u)))
            .catch(err => console.error(err));
    };

    // === Reference Data Actions ===

    const openDeleteModal = (type, id, name) => {
        setModal({ isOpen: true, type, id, name });
        setModalError('');
    };

    const closeModal = () => {
        setModal({ isOpen: false, type: '', id: null, name: '' });
        setModalError('');
    };

    const handleConfirmDelete = () => {
        const { type, id } = modal;
        let request;

        if (type === 'brand') request = axios.delete(`${API_URL}/api/admin/data/brands/${id}`);
        if (type === 'model') request = axios.delete(`${API_URL}/api/admin/data/models/${id}`);
        if (type === 'city') request = axios.delete(`${API_URL}/api/admin/data/cities/${id}`);
        if (type === 'region') request = axios.delete(`${API_URL}/api/admin/data/regions/${id}`);

        if (request) {
            request.then(() => {
                fetchReferenceData();
                closeModal();
            }).catch(err => {
                const msg = err.response?.data || "Ошибка удаления";
                setModalError(msg);
            });
        }
    };

    const handleAddBrand = (e) => {
        e.preventDefault();
        if (!newBrand.trim()) return;
        axios.post(`${API_URL}/api/admin/data/brands`, { name: newBrand })
            .then(() => { setNewBrand(''); fetchReferenceData(); });
    };

    const handleAddModel = (e) => {
        e.preventDefault();
        if (!newModel.name || !newModel.brandId) return;
        axios.post(`${API_URL}/api/admin/data/models`, null, { params: newModel })
            .then(() => { setNewModel({ name: '', brandId: '' }); fetchReferenceData(); });
    };

    const handleAddCity = (e) => {
        e.preventDefault();
        if (!newCity.name || !newCity.regionId) return;
        axios.post(`${API_URL}/api/admin/data/cities`, null, { params: newCity })
            .then(() => { setNewCity({ name: '', regionId: '' }); fetchReferenceData(); });
    };

    // === Filtering Logic ===

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(searchBrand.toLowerCase())
    );

    const filteredModels = models.filter(m =>
        m.name.toLowerCase().includes(searchModel.toLowerCase()) ||
        m.brand?.name.toLowerCase().includes(searchModel.toLowerCase())
    );

    const filteredCities = cities.filter(c =>
        c.name.toLowerCase().includes(searchCity.toLowerCase()) ||
        c.region?.name.toLowerCase().includes(searchCity.toLowerCase())
    );

    // ИСПРАВЛЕНО: Деструктуризация для устранения "Unresolved variable"
    const sortedUsers = [...users].sort(({ roleId: a }, { roleId: b }) => (b === 2 ? 1 : 0) - (a === 2 ? 1 : 0));

    if (loading) return <div className="ap-loading">Загрузка...</div>;

    return (
        <div className="ap">
            {/* Modal */}
            {modal.isOpen && (
                <div className="ap-modal-overlay" onClick={closeModal}>
                    <div className="ap-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="ap-modal__title">Подтверждение</h3>
                        <p className="ap-modal__text">
                            Вы уверены, что хотите удалить <strong>"{modal.name}"</strong>?
                            {modal.type === 'brand' && ' Все связанные модели также будут удалены.'}
                        </p>

                        {modalError && <div className="ap-modal__error">{modalError}</div>}

                        <div className="ap-modal__actions">
                            <button className="ap-btn ap-btn--ghost" onClick={closeModal}>Отмена</button>
                            <button className="ap-btn ap-btn--red" onClick={handleConfirmDelete}>Удалить</button>
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
                {/* Stats */}
                <section className="ap-section">
                    <p className="ap-section-heading">Статистика платформы</p>
                    {stats ? (
                        <div className="ap-stats-grid">
                            {/* ИСПРАВЛЕНО: Деструктуризация stats */}
                            {(({ totalUsers, activeAuctions, totalBids, totalTurnover }) => (
                                <>
                                    <div className="ap-stat-card">
                                        <span className="ap-stat-card__value">{totalUsers}</span>
                                        <span className="ap-stat-card__label">Пользователей</span>
                                    </div>
                                    <div className="ap-stat-card">
                                        <span className="ap-stat-card__value">{activeAuctions}</span>
                                        <span className="ap-stat-card__label">Активных аукционов</span>
                                    </div>
                                    <div className="ap-stat-card">
                                        <span className="ap-stat-card__value">{totalBids}</span>
                                        <span className="ap-stat-card__label">Всего ставок</span>
                                    </div>
                                    <div className="ap-stat-card">
                                        <span className="ap-stat-card__value">
                                            {totalTurnover?.toLocaleString('ru-RU')}
                                            <BynIcon className="ap-currency-icon" />
                                        </span>
                                        <span className="ap-stat-card__label">Общий оборот</span>
                                    </div>
                                </>
                            ))(stats)}
                        </div>
                    ) : (
                        <div className="ap-loading ap-loading--inline">Загрузка статистики...</div>
                    )}
                </section>

                {/* Moderation */}
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
                                // ИСПРАВЛЕНО: Деструктуризация a
                                (({ id, mainImageUrl, brand, model, seller, year, mileage, startingPrice }) => (
                                    <article key={id} className="ap-card">
                                        <div className="ap-card__left">
                                            {mainImageUrl ? (
                                                <img src={`${API_URL}${mainImageUrl}`} alt="Фото" className="ap-card__img" />
                                            ) : (
                                                <div className="ap-card__img ap-card__img--empty">Нет фото</div>
                                            )}
                                        </div>
                                        <div className="ap-card__body">
                                            <h3 className="ap-card__title">{brand?.name} {model?.name}</h3>
                                            <div className="ap-card__meta">
                                                <span>Год: {year}</span>
                                                <span>Пробег: {mileage?.toLocaleString()} км</span>
                                                <span>Продавец: {seller?.firstName}</span>
                                            </div>
                                            <p className="ap-card__price">Старт: {startingPrice?.toLocaleString()} BYN</p>
                                        </div>
                                        <div className="ap-card__actions">
                                            <button type="button" className="ap-btn ap-btn--green" onClick={() => handleApprove(id)}>Одобрить</button>
                                            {rejectingId === id ? (
                                                <div className="ap-reject-form">
                                                    <input
                                                        type="text"
                                                        placeholder="Причина отклонения"
                                                        value={rejectReason}
                                                        onChange={e => setRejectReason(e.target.value)}
                                                        className={`ap-reject-input ${rejectError ? 'input--error' : ''}`}
                                                    />
                                                    {rejectError && <span className="ap-reject-error">{rejectError}</span>}
                                                    <div className="ap-reject-actions">
                                                        <button type="button" className="ap-btn ap-btn--red" onClick={() => handleRejectConfirm(id)}>Отправить</button>
                                                        <button type="button" className="ap-btn ap-btn--ghost" onClick={() => setRejectingId(null)}>Отмена</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button type="button" className="ap-btn ap-btn--red" onClick={() => handleRejectInit(id)}>Отклонить</button>
                                            )}
                                            <Link to={`/auction/${id}`} className="ap-btn ap-btn--ghost">Смотреть</Link>
                                        </div>
                                    </article>
                                ))(a)
                            ))}
                        </div>
                    )}
                </section>

                {/* Users */}
                <section className="ap-section">
                    <p className="ap-section-heading">Управление пользователями</p>
                    <div className="ap-users">
                        {sortedUsers.map(u => (
                            // ИСПРАВЛЕНО: Деструктуризация u
                            (({ id, firstName, lastName, email, roleId, isBlocked }) => (
                                <div key={id} className="ap-user">
                                    <div className="ap-user__info">
                                        <span className="ap-user__name">{firstName} {lastName}</span>
                                        <span className="ap-user__email">{email}</span>
                                        <div className="ap-user__tags">
                                            {roleId === 2 && <span className="ap-tag ap-tag--admin">Админ</span>}
                                            {isBlocked && <span className="ap-tag ap-tag--blocked">Заблокирован</span>}
                                        </div>
                                    </div>
                                    {roleId !== 2 && (
                                        isBlocked ? (
                                            <button type="button" className="ap-btn ap-btn--unblock" onClick={() => handleUnblock(id)}>Разблокировать</button>
                                        ) : (
                                            <button type="button" className="ap-btn ap-btn--block" onClick={() => handleBlock(id)}>Заблокировать</button>
                                        )
                                    )}
                                </div>
                            ))(u)
                        ))}
                    </div>
                </section>

                {/* Reference Data */}
                <section className="ap-section">
                    <p className="ap-section-heading">Справочники</p>

                    <div className="ap-reference">
                        {/* Brands */}
                        <div className="ap-ref-col">
                            <h3 className="ap-ref-col__title">Марки автомобилей</h3>
                            <form className="ap-ref-form" onSubmit={handleAddBrand}>
                                <input type="text" placeholder="Название марки" value={newBrand} onChange={e => setNewBrand(e.target.value)} className="ap-ref-input" />
                                <button type="submit" className="ap-btn ap-btn--primary">Добавить</button>
                            </form>
                            <input type="text" placeholder="Поиск марки..." value={searchBrand} onChange={e => setSearchBrand(e.target.value)} className="ap-ref-search" />
                            <ul className="ap-ref-list">
                                {filteredBrands.map(b => (
                                    <li key={b.id} className="ap-ref-item">
                                        <span>{b.name}</span>
                                        <button className="ap-ref-del" onClick={() => openDeleteModal('brand', b.id, b.name)}>×</button>
                                    </li>
                                ))}
                                {filteredBrands.length === 0 && searchBrand && <li className="ap-ref-empty">Ничего не найдено</li>}
                            </ul>
                        </div>

                        {/* Models */}
                        <div className="ap-ref-col">
                            <h3 className="ap-ref-col__title">Модели</h3>
                            <form className="ap-ref-form" onSubmit={handleAddModel}>
                                <select value={newModel.brandId} onChange={e => setNewModel({ ...newModel, brandId: e.target.value })} className="ap-ref-select">
                                    <option value="">Выберите марку</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                <input type="text" placeholder="Название модели" value={newModel.name} onChange={e => setNewModel({ ...newModel, name: e.target.value })} className="ap-ref-input" />
                                <button type="submit" className="ap-btn ap-btn--primary">Добавить</button>
                            </form>
                            <input type="text" placeholder="Поиск модели или марки..." value={searchModel} onChange={e => setSearchModel(e.target.value)} className="ap-ref-search" />
                            <ul className="ap-ref-list">
                                {filteredModels.map(m => (
                                    <li key={m.id} className="ap-ref-item">
                                        <span>{m.brand?.name} {m.name}</span>
                                        <button className="ap-ref-del" onClick={() => openDeleteModal('model', m.id, m.name)}>×</button>
                                    </li>
                                ))}
                                {filteredModels.length === 0 && searchModel && <li className="ap-ref-empty">Ничего не найдено</li>}
                            </ul>
                        </div>

                        {/* Cities */}
                        <div className="ap-ref-col">
                            <h3 className="ap-ref-col__title">Города</h3>
                            <form className="ap-ref-form" onSubmit={handleAddCity}>
                                <select value={newCity.regionId} onChange={e => setNewCity({ ...newCity, regionId: e.target.value })} className="ap-ref-select">
                                    <option value="">Выберите область</option>
                                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                                <input type="text" placeholder="Название города" value={newCity.name} onChange={e => setNewCity({ ...newCity, name: e.target.value })} className="ap-ref-input" />
                                <button type="submit" className="ap-btn ap-btn--primary">Добавить</button>
                            </form>
                            <input type="text" placeholder="Поиск города или области..." value={searchCity} onChange={e => setSearchCity(e.target.value)} className="ap-ref-search" />
                            <ul className="ap-ref-list">
                                {filteredCities.map(c => (
                                    <li key={c.id} className="ap-ref-item">
                                        <span>{c.name} <small>({c.region?.name})</small></span>
                                        <button className="ap-ref-del" onClick={() => openDeleteModal('city', c.id, c.name)}>×</button>
                                    </li>
                                ))}
                                {filteredCities.length === 0 && searchCity && <li className="ap-ref-empty">Ничего не найдено</li>}
                            </ul>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}

export default AdminPage;