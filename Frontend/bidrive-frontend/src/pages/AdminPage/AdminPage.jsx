import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BynIcon from '../../components/BynIcon';
import './AdminPage.css';

const API_URL = 'http://localhost:8080';

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
    const [loading, setLoading] = useState(true);

    // === СОСТОЯНИЯ ДЛЯ ОТКЛОНЕНИЯ ===
    const [rejectingId, setRejectingId] = useState(null); // ID лота, который отклоняем
    const [rejectReason, setRejectReason] = useState('');
    const [rejectError, setRejectError] = useState('');
    // ================================

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

    // === СОСТОЯНИЯ ДЛЯ МОДАЛКИ УДАЛЕНИЯ/РЕДАКТИРОВАНИЯ ===
    const [modal, setModal] = useState({ isOpen: false, type: '', id: null, name: '' });
    const [modalError, setModalError] = useState('');

    // === СОСТОЯНИЯ ДЛЯ РЕДАКТИРОВАНИЯ ===
    const [editingBrandId, setEditingBrandId] = useState(null);
    const [editingBrandName, setEditingBrandName] = useState('');
    const [editingModelId, setEditingModelId] = useState(null);
    const [editingModelName, setEditingModelName] = useState('');
    // =====================================

    useEffect(() => {
        fetchAuctions();
        fetchUsers();
        fetchStats();
        fetchReferenceData();
        setLoading(false);

        const intervalId = setInterval(() => {
            fetchAuctions();
            fetchStats();
        }, 10000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchAuctions = () => {
        axios.get(`${API_URL}/api/auctions/pending`)
            .then(r => setAuctions(r.data))
            .catch(err => console.error(err));
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

    // === ДЕЙСТВИЯ АДМИНА ===

    const handleApprove = (id) => {
        axios.put(`${API_URL}/api/auctions/${id}/approve`)
            .then(() => setAuctions(prev => prev.filter(a => a.id !== id)))
            .catch(err => console.error(err));
    };

    // === ИЗМЕНЕННАЯ ЛОГИКА ОТКЛОНЕНИЯ ===
    const handleRejectInit = (id) => {
        setRejectingId(id);
        setRejectReason('');
        setRejectError('');
    };

    const handleRejectConfirm = () => {
        if (!rejectReason.trim()) {
            setRejectError('Укажите причину отклонения');
            return;
        }
        setRejectError('');

        axios.post(`${API_URL}/api/auctions/${rejectingId}/reject`, null, { params: { reason: rejectReason } })
            .then(() => {
                setAuctions(prev => prev.filter(a => a.id !== rejectingId));
                // Закрываем модалку и сбрасываем состояние
                setRejectingId(null);
                setRejectReason('');
            })
            .catch(err => console.error(err));
    };
    // =====================================

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

    // ... (Функции справочников: openDeleteModal, closeModal, handleConfirmDelete, handleAdd... остаются без изменений)

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
                setModalError(err.response?.data || "Ошибка удаления");
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

    // === Логика редактирования (из предыдущего ответа) ===
    const startEditBrand = (brand) => {
        setEditingBrandId(brand.id);
        setEditingBrandName(brand.name);
    };
    const cancelEditBrand = () => { setEditingBrandId(null); setEditingBrandName(''); };
    const saveBrand = (id) => {
        if (!editingBrandName.trim()) return;
        axios.put(`${API_URL}/api/admin/data/brands/${id}`, { name: editingBrandName })
            .then(() => { fetchReferenceData(); cancelEditBrand(); })
            .catch(err => console.error(err));
    };

    const startEditModel = (model) => {
        setEditingModelId(model.id);
        setEditingModelName(model.name);
    };
    const cancelEditModel = () => { setEditingModelId(null); setEditingModelName(''); };
    const saveModel = (id) => {
        if (!editingModelName.trim()) return;
        axios.put(`${API_URL}/api/admin/data/models/${id}`, null, { params: { name: editingModelName } })
            .then(() => { fetchReferenceData(); cancelEditModel(); })
            .catch(err => console.error(err));
    };
    // =====================================

    const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(searchBrand.toLowerCase()));
    const filteredModels = models.filter(m => m.name.toLowerCase().includes(searchModel.toLowerCase()) || m.brand?.name.toLowerCase().includes(searchModel.toLowerCase()));
    const filteredCities = cities.filter(c => c.name.toLowerCase().includes(searchCity.toLowerCase()) || c.region?.name.toLowerCase().includes(searchCity.toLowerCase()));
    const sortedUsers = [...users].sort(({ roleId: a }, { roleId: b }) => (b === 2 ? 1 : 0) - (a === 2 ? 1 : 0));

    if (loading) return <div className="ap-loading">Загрузка...</div>;

    return (
        <div className="ap">

            {/* === МОДАЛКА ДЛЯ ОТКЛОНЕНИЯ ЛОТА === */}
            {rejectingId && (
                <div className="ap-modal-overlay" onClick={() => setRejectingId(null)}>
                    <div className="ap-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="ap-modal__title">Отклонение лота</h3>
                        <p className="ap-modal__text">
                            Укажите причину отклонения. Это поможет пользователю исправить ошибки.
                        </p>

                        {/* ТЕКСТАРИЯ ВМЕСТО INPUT */}
                        <textarea
                            className="ap-modal__textarea"
                            placeholder="Например: Не указан год выпуска или загружены нечеткие фото."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            autoFocus
                        />

                        {rejectError && <div className="ap-modal__error">{rejectError}</div>}

                        <div className="ap-modal__actions">
                            <button className="ap-btn ap-btn--ghost" onClick={() => setRejectingId(null)}>Отмена</button>
                            <button className="ap-btn ap-btn--red" onClick={handleRejectConfirm}>Подтвердить</button>
                        </div>
                    </div>
                </div>
            )}
            {/* ==================================== */}

            {/* Модалка удаления */}
            {modal.isOpen && (
                <div className="ap-modal-overlay" onClick={closeModal}>
                    <div className="ap-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="ap-modal__title">Подтверждение</h3>
                        <p className="ap-modal__text">Удалить <strong>"{modal.name}"</strong>?</p>
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
                {/* Stats Section */}
                <section className="ap-section">
                    <p className="ap-section-heading">Статистика платформы</p>
                    {stats ? (
                        <div className="ap-stats-grid">
                            {(({ totalUsers, activeAuctions, totalBids, totalTurnover }) => (
                                <>
                                    <div className="ap-stat-card"><span className="ap-stat-card__value">{totalUsers}</span><span className="ap-stat-card__label">Пользователей</span></div>
                                    <div className="ap-stat-card"><span className="ap-stat-card__value">{activeAuctions}</span><span className="ap-stat-card__label">Активных</span></div>
                                    <div className="ap-stat-card"><span className="ap-stat-card__value">{totalBids}</span><span className="ap-stat-card__label">Ставок</span></div>
                                    <div className="ap-stat-card">
                                        <span className="ap-stat-card__value">{totalTurnover?.toLocaleString('ru-RU')}<BynIcon className="ap-currency-icon" /></span>
                                        <span className="ap-stat-card__label">Оборот</span>
                                    </div>
                                </>
                            ))(stats)}
                        </div>
                    ) : ( <div className="ap-loading ap-loading--inline">Загрузка...</div> )}
                </section>

                {/* Moderation Section */}
                <section className="ap-section">
                    <p className="ap-section-heading">Модерация лотов</p>
                    {auctions.length === 0 ? (
                        <div className="ap-empty"><div className="ap-empty__icon">✓</div><p>Все лоты проверены</p></div>
                    ) : (
                        <div className="ap-list">
                            {auctions.map(a => (
                                <article key={a.id} className="ap-card">
                                    <div className="ap-card__left">
                                        {a.mainImageUrl ? <img src={`${API_URL}${a.mainImageUrl}`} alt="Фото" className="ap-card__img" /> : <div className="ap-card__img ap-card__img--empty">Нет фото</div>}
                                    </div>
                                    <div className="ap-card__body">
                                        <h3 className="ap-card__title">{a.brand?.name} {a.model?.name}</h3>
                                        <div className="ap-card__meta">
                                            <span>Год: {a.year}</span>
                                            <span>Пробег: {a.mileage?.toLocaleString()} км</span>
                                            <span>Продавец: {a.seller?.firstName}</span>
                                        </div>
                                        <p className="ap-card__price">Старт: {a.startingPrice?.toLocaleString()} BYN</p>
                                    </div>
                                    <div className="ap-card__actions">
                                        <button className="ap-btn ap-btn--green" onClick={() => handleApprove(a.id)}>Одобрить</button>

                                        {/* ИЗМЕНЕНО: Кнопка просто открывает модалку */}
                                        <button className="ap-btn ap-btn--red" onClick={() => handleRejectInit(a.id)}>Отклонить</button>

                                        <Link to={`/auction/${a.id}`} className="ap-btn ap-btn--ghost">Смотреть</Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* Users Section */}
                <section className="ap-section">
                    <p className="ap-section-heading">Пользователи</p>
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
                                    u.isBlocked ? <button className="ap-btn ap-btn--unblock" onClick={() => handleUnblock(u.id)}>Разблокировать</button>
                                        : <button className="ap-btn ap-btn--block" onClick={() => handleBlock(u.id)}>Заблокировать</button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Reference Data Section */}
                <section className="ap-section">
                    <p className="ap-section-heading">Справочники</p>
                    <div className="ap-reference">

                        {/* Brands Column */}
                        <div className="ap-ref-col">
                            <h3 className="ap-ref-col__title">Марки автомобилей</h3>
                            <form className="ap-ref-form" onSubmit={handleAddBrand}>
                                <input type="text" placeholder="Новая марка" value={newBrand} onChange={e => setNewBrand(e.target.value)} className="ap-ref-input" />
                                <button type="submit" className="ap-btn ap-btn--primary">+</button>
                            </form>
                            <input type="text" placeholder="Поиск..." value={searchBrand} onChange={e => setSearchBrand(e.target.value)} className="ap-ref-search" />
                            <ul className="ap-ref-list">
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
                                                    <button className="ap-ref-edit-btn" onClick={() => startEditBrand(b)} title="Редактировать">✎</button>
                                                    <button className="ap-ref-del" onClick={() => openDeleteModal('brand', b.id, b.name)}>×</button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Models Column */}
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
                                                    <button className="ap-ref-edit-btn" onClick={() => startEditModel(m)} title="Редактировать">✎</button>
                                                    <button className="ap-ref-del" onClick={() => openDeleteModal('model', m.id, m.name)}>×</button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Cities Column */}
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
                                        <span>{c.name} <small>({c.region?.name})</small></span>
                                        <button className="ap-ref-del" onClick={() => openDeleteModal('city', c.id, c.name)}>×</button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </section>

            </main>
        </div>
    );
}

export default AdminPage;