import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import AuctionCard from './components/AuctionCard';
import AuctionDetails from './pages/AuctionDetails/AuctionDetails';
import CreateAuction from './pages/CreateAuction/CreateAuction';
import Profile from './pages/Profile/Profile';
import Login from './pages/Login/Login';
import Register from "./pages/Register/Register";
import AdminPage from './pages/AdminPage/AdminPage'; // Импорт страницы админки
import './App.css';

function AppContent() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);

  // === СПРАВОЧНИКИ (Dropdown Data) ===
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  // === ФИЛЬТРЫ (State) ===
  const [filters, setFilters] = useState({
    brandId: '',
    modelId: '',
    fuelTypeId: '',
    transmissionId: '',
    regionId: '',
    cityId: '',
    yearFrom: '',
    yearTo: '',
    priceFrom: '',
    priceTo: '',
    mileageFrom: '',
    mileageTo: ''
  });

  const location = useLocation();

  // 1. Загрузка основных справочников (один раз при старте)
  useEffect(() => {
    axios.get('http://localhost:8080/api/brands').then(res => setBrands(res.data)).catch(err => console.error(err));
    axios.get('http://localhost:8080/api/fuel-types').then(res => setFuelTypes(res.data)).catch(err => console.error(err));
    axios.get('http://localhost:8080/api/transmissions').then(res => setTransmissions(res.data)).catch(err => console.error(err));
    axios.get('http://localhost:8080/api/regions').then(res => setRegions(res.data)).catch(err => console.error(err));
  }, []);

  // 2. Загрузка аукционов при первом входе (Показать всё)
  useEffect(() => {
    if (location.pathname === "/") {
      handleSearch(); // Вызываем поиск (с пустыми фильтрами = показать всё)
    }
  }, [location.pathname]);

  // 3. Подгрузка моделей при смене бренда
  useEffect(() => {
    if (filters.brandId) {
      axios.get(`http://localhost:8080/api/models/by-brand?brandId=${filters.brandId}`)
        .then(res => setModels(res.data))
        .catch(() => setModels([]));
    } else {
      setModels([]);
      // Если сбросили бренд, сбрасываем и модель в стейте
      setFilters(prev => ({ ...prev, modelId: '' }));
    }
  }, [filters.brandId]);

  // 4. Подгрузка городов при смене области
  useEffect(() => {
    if (filters.regionId) {
      axios.get(`http://localhost:8080/api/cities/by-region?regionId=${filters.regionId}`)
        .then(res => setCities(res.data))
        .catch(() => setCities([]));
    } else {
      setCities([]);
      setFilters(prev => ({ ...prev, cityId: '' }));
    }
  }, [filters.regionId]);

  // === ФУНКЦИЯ ПОИСКА (Универсальная) ===
  // Если передаем newFilters, используем их. Если нет - берем текущие из state.
  const handleSearch = (newFilters = null) => {
    setLoading(true);

    // Определяем, какие фильтры отправлять
    const activeFilters = newFilters || filters;

    const params = {};
    Object.keys(activeFilters).forEach(key => {
      if (activeFilters[key]) params[key] = activeFilters[key];
    });

    axios.get('http://localhost:8080/api/auctions/search', { params })
      .then(response => {
        setAuctions(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Ошибка поиска:', error);
        setLoading(false);
      });
  };

  // Обработчик изменения инпутов
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Сброс всех фильтров
  const resetFilters = () => {
    // 1. Создаем объект с пустыми значениями
    const emptyFilters = {
      brandId: '', modelId: '', fuelTypeId: '', transmissionId: '',
      regionId: '', cityId: '', yearFrom: '', yearTo: '',
      priceFrom: '', priceTo: '', mileageFrom: '', mileageTo: ''
    };

    // 2. Очищаем поля в интерфейсе
    setFilters(emptyFilters);

    // 3. Очищаем зависимые списки
    setModels([]);
    setCities([]);

    // 4. Вызываем поиск с пустыми параметрами НАПРЯМУЮ
    handleSearch(emptyFilters);
  };

  return (
    <Layout>
      <Routes>
        <Route path="/" element={
          <>
            {/* === БЛОК ФИЛЬТРОВ === */}
            <div className="filter-bar" style={{flexDirection: 'column', alignItems: 'flex-start'}}>

              {/* Ряд 1: Основные характеристики */}
              <div style={{display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap'}}>
                <select name="brandId" value={filters.brandId} onChange={handleFilterChange}>
                  <option value="">Марка</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>

                <select name="modelId" value={filters.modelId} onChange={handleFilterChange} disabled={!filters.brandId}>
                  <option value="">Модель</option>
                  {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>

                <select name="transmissionId" value={filters.transmissionId} onChange={handleFilterChange}>
                  <option value="">КПП</option>
                  {transmissions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>

                <select name="fuelTypeId" value={filters.fuelTypeId} onChange={handleFilterChange}>
                  <option value="">Топливо</option>
                  {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              {/* Ряд 2: Локация */}
              <div style={{display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap'}}>
                 <select name="regionId" value={filters.regionId} onChange={handleFilterChange}>
                  <option value="">Область</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>

                <select name="cityId" value={filters.cityId} onChange={handleFilterChange} disabled={!filters.regionId}>
                  <option value="">Город</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Ряд 3: Диапазоны */}
              <div style={{display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center'}}>
                  <div className="range-group">
                      <label>Цена ($):</label>
                      <input type="number" name="priceFrom" placeholder="От" value={filters.priceFrom} onChange={handleFilterChange} style={{width: '80px'}} />
                      <input type="number" name="priceTo" placeholder="До" value={filters.priceTo} onChange={handleFilterChange} style={{width: '80px'}} />
                  </div>

                  <div className="range-group">
                      <label>Год:</label>
                      <input type="number" name="yearFrom" placeholder="От" value={filters.yearFrom} onChange={handleFilterChange} style={{width: '70px'}} />
                      <input type="number" name="yearTo" placeholder="До" value={filters.yearTo} onChange={handleFilterChange} style={{width: '70px'}} />
                  </div>

                  <div className="range-group">
                      <label>Пробег:</label>
                      <input type="number" name="mileageFrom" placeholder="От" value={filters.mileageFrom} onChange={handleFilterChange} style={{width: '80px'}} />
                      <input type="number" name="mileageTo" placeholder="До" value={filters.mileageTo} onChange={handleFilterChange} style={{width: '80px'}} />
                  </div>
              </div>

              {/* Кнопки управления */}
              <div style={{display: 'flex', gap: '10px'}}>
                <button className="btn-search" onClick={() => handleSearch()} style={{backgroundColor: '#2980b9', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'}}>
                  🔍 Найти
                </button>
                <button className="btn-reset" onClick={resetFilters}>
                  Сбросить
                </button>
              </div>
            </div>

            {/* Состояние загрузки и карточки */}
            {loading ? (
               <div className="loading-spinner">Поиск...</div>
            ) : (
              <div className="auction-grid">
                {auctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
                {auctions.length === 0 && <p style={{textAlign: 'center', width: '100%'}}>Ничего не найдено.</p>}
              </div>
            )}
          </>
        } />

        {/* Остальные роуты */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create" element={<CreateAuction />} />
        <Route path="/auction/:id" element={<AuctionDetails />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}