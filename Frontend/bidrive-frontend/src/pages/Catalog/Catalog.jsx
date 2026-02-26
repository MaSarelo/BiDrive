import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuctionCard from '../../components/AuctionCard';
import './Catalog.css';

const EMPTY_FILTERS = {
  brandId: '', modelId: '', fuelTypeId: '', transmissionId: '',
  regionId: '', cityId: '', yearFrom: '', yearTo: '',
  priceFrom: '', priceTo: '', mileageFrom: '', mileageTo: ''
};

function Catalog() {
  const [auctions,      setAuctions]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [filtersOpen,   setFiltersOpen]   = useState(true);

  // Справочники
  const [brands,        setBrands]        = useState([]);
  const [models,        setModels]        = useState([]);
  const [fuelTypes,     setFuelTypes]     = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [regions,       setRegions]       = useState([]);
  const [cities,        setCities]        = useState([]);

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Dictionaries
  useEffect(() => {
    axios.get('http://localhost:8080/api/brands').then(r => setBrands(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/fuel-types').then(r => setFuelTypes(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/transmissions').then(r => setTransmissions(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/regions').then(r => setRegions(r.data)).catch(console.error);
    handleSearch(EMPTY_FILTERS);
  }, []);

  // Models by brand
  useEffect(() => {
    if (filters.brandId) {
      axios.get(`http://localhost:8080/api/models/by-brand?brandId=${filters.brandId}`)
        .then(r => setModels(r.data)).catch(() => setModels([]));
    } else {
      setModels([]);
      setFilters(prev => ({ ...prev, modelId: '' }));
    }
  }, [filters.brandId]);

  // Cities by region
  useEffect(() => {
    if (filters.regionId) {
      axios.get(`http://localhost:8080/api/cities/by-region?regionId=${filters.regionId}`)
        .then(r => setCities(r.data)).catch(() => setCities([]));
    } else {
      setCities([]);
      setFilters(prev => ({ ...prev, cityId: '' }));
    }
  }, [filters.regionId]);

  const handleSearch = (active = null) => {
    setLoading(true);
    const f = active || filters;
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
    axios.get('http://localhost:8080/api/auctions/search', { params })
      .then(r => { setAuctions(r.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setModels([]);
    setCities([]);
    handleSearch(EMPTY_FILTERS);
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="ct">

      {/* ── PAGE HEAD ── */}
      <div className="ct-hero">
        <div className="ct-hero__overlay" aria-hidden="true" />
        <div className="ct-container ct-hero__content">
          <p className="ct-eyebrow">Торги открыты</p>
          <h1 className="ct-title">Каталог автомобилей</h1>
          <div className="ct-divider" aria-hidden="true" />
          <p className="ct-subtitle">
            Выбирайте из проверенных лотов и делайте ставки в режиме реального времени.
          </p>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="ct-main ct-container">

        {/* Filter panel */}
        <aside className="ct-filters">
          <button
            className="ct-filters__toggle"
            onClick={() => setFiltersOpen(v => !v)}
          >
            <span className="ct-filters__toggle-label">
              Фильтры
              {activeCount > 0 && (
                <span className="ct-badge">{activeCount}</span>
              )}
            </span>
            <span className={`ct-filters__arrow${filtersOpen ? ' ct-filters__arrow--open' : ''}`}>
              ↓
            </span>
          </button>

          <div className={`ct-filters__body${filtersOpen ? ' ct-filters__body--open' : ''}`}>

            {/* Марка / Модель */}
            <div className="ct-filter-group">
              <p className="ct-filter-group__title">Автомобиль</p>
              <div className="ct-filter-row">
                <div className="ct-filter-field">
                  <label className="ct-filter-label">Марка</label>
                  <select name="brandId" value={filters.brandId} onChange={handleChange} className="ct-select">
                    <option value="">Все марки</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="ct-filter-field">
                  <label className="ct-filter-label">Модель</label>
                  <select name="modelId" value={filters.modelId} onChange={handleChange} className="ct-select" disabled={!filters.brandId}>
                    <option value="">Все модели</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Характеристики */}
            <div className="ct-filter-group">
              <p className="ct-filter-group__title">Характеристики</p>
              <div className="ct-filter-row">
                <div className="ct-filter-field">
                  <label className="ct-filter-label">КПП</label>
                  <select name="transmissionId" value={filters.transmissionId} onChange={handleChange} className="ct-select">
                    <option value="">Любая</option>
                    {transmissions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="ct-filter-field">
                  <label className="ct-filter-label">Топливо</label>
                  <select name="fuelTypeId" value={filters.fuelTypeId} onChange={handleChange} className="ct-select">
                    <option value="">Любое</option>
                    {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Локация */}
            <div className="ct-filter-group">
              <p className="ct-filter-group__title">Местоположение</p>
              <div className="ct-filter-row">
                <div className="ct-filter-field">
                  <label className="ct-filter-label">Область</label>
                  <select name="regionId" value={filters.regionId} onChange={handleChange} className="ct-select">
                    <option value="">Все области</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="ct-filter-field">
                  <label className="ct-filter-label">Город</label>
                  <select name="cityId" value={filters.cityId} onChange={handleChange} className="ct-select" disabled={!filters.regionId}>
                    <option value="">Все города</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Диапазоны */}
            <div className="ct-filter-group">
              <p className="ct-filter-group__title">Параметры</p>

              <div className="ct-range-field">
                <label className="ct-filter-label">Цена (BYN)</label>
                <div className="ct-range">
                  <input className="ct-input" type="number" name="priceFrom"   placeholder="От"   value={filters.priceFrom}   onChange={handleChange} />
                  <span className="ct-range__sep">—</span>
                  <input className="ct-input" type="number" name="priceTo"     placeholder="До"   value={filters.priceTo}     onChange={handleChange} />
                </div>
              </div>

              <div className="ct-range-field">
                <label className="ct-filter-label">Год выпуска</label>
                <div className="ct-range">
                  <input className="ct-input" type="number" name="yearFrom"    placeholder="От"   value={filters.yearFrom}    onChange={handleChange} />
                  <span className="ct-range__sep">—</span>
                  <input className="ct-input" type="number" name="yearTo"      placeholder="До"   value={filters.yearTo}      onChange={handleChange} />
                </div>
              </div>

              <div className="ct-range-field">
                <label className="ct-filter-label">Пробег (км)</label>
                <div className="ct-range">
                  <input className="ct-input" type="number" name="mileageFrom" placeholder="От"   value={filters.mileageFrom} onChange={handleChange} />
                  <span className="ct-range__sep">—</span>
                  <input className="ct-input" type="number" name="mileageTo"   placeholder="До"   value={filters.mileageTo}   onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="ct-filter-actions">
              <button className="ct-btn ct-btn--gold ct-btn--full" onClick={() => handleSearch()}>
                Найти
              </button>
              <button className="ct-btn ct-btn--ghost ct-btn--full" onClick={resetFilters}>
                Сбросить
              </button>
            </div>

          </div>
        </aside>

        {/* Results */}
        <section className="ct-results">
          <div className="ct-results__head">
            <p className="ct-results__count">
              {loading ? 'Поиск...' : `Найдено: ${auctions.length} лот${auctions.length === 1 ? '' : auctions.length >= 2 && auctions.length <= 4 ? 'а' : 'ов'}`}
            </p>
          </div>

          {loading ? (
            <div className="ct-skeleton-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="ct-skeleton" />
              ))}
            </div>
          ) : auctions.length > 0 ? (
            <div className="ct-grid">
              {auctions.map(a => <AuctionCard key={a.id} auction={a} />)}
            </div>
          ) : (
            <div className="ct-empty">
              <p className="ct-empty__title">Лоты не найдены</p>
              <p className="ct-empty__sub">Попробуйте изменить параметры фильтра</p>
              <button className="ct-btn ct-btn--ghost" onClick={resetFilters}>
                Сбросить фильтры
              </button>
            </div>
          )}
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="ct-footer">
        <div className="ct-container ct-footer__grid">
          <div>
            <p className="ct-footer__wordmark">BiDrive</p>
            <p className="ct-footer__desc">Платформа онлайн-аукционов автомобилей. Прозрачно и безопасно.</p>
          </div>
          <div>
            <p className="ct-footer__col-title">Навигация</p>
            <ul className="ct-footer__list">
              <li><Link to="/catalog">Каталог</Link></li>
              <li><Link to="/register">Регистрация</Link></li>
              <li><a href="#">Правила участия</a></li>
            </ul>
          </div>
          <div>
            <p className="ct-footer__col-title">Контакты</p>
            <ul className="ct-footer__list">
              <li><a href="mailto:support@bidrive.by">support@bidrive.by</a></li>
              <li><a href="https://t.me/bidrive_bot" target="_blank" rel="noopener noreferrer">Telegram</a></li>
              <li>+375 (29) 123-45-67</li>
            </ul>
          </div>
        </div>
        <div className="ct-footer__bottom">
          <p>© 2026 BiDrive. Дипломный проект. Все права защищены.</p>
        </div>
      </footer>

    </div>
  );
}

export default Catalog;