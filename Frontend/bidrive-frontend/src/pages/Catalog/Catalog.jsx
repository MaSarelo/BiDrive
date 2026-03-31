import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuctionCard from '../../components/AuctionCard';
import './Catalog.css';

const EMPTY = {
  brandId: '', modelId: '', fuelTypeId: '', transmissionId: '',
  regionId: '', cityId: '', yearFrom: '', yearTo: '',
  priceFrom: '', priceTo: '', mileageFrom: '', mileageTo: '',
};

function Catalog() {
  const [auctions,      setAuctions]      = useState([]);
  const [loading,       setLoading]       = useState(false);

  const [brands,        setBrands]        = useState([]);
  const [models,        setModels]        = useState([]);
  const [fuelTypes,     setFuelTypes]     = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [regions,       setRegions]       = useState([]);
  const [cities,        setCities]        = useState([]);

  const [filters, setFilters] = useState(EMPTY);

  useEffect(() => {
    axios.get('http://localhost:8080/api/brands').then(r => setBrands(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/fuel-types').then(r => setFuelTypes(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/transmissions').then(r => setTransmissions(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/regions').then(r => setRegions(r.data)).catch(console.error);
    fetchAuctions(EMPTY);
  }, []);

  useEffect(() => {
    if (filters.brandId) {
      axios.get(`http://localhost:8080/api/models/by-brand?brandId=${filters.brandId}`)
          .then(r => setModels(r.data)).catch(() => setModels([]));
    } else {
      setModels([]);
      setFilters(p => ({ ...p, modelId: '' }));
    }
  }, [filters.brandId]);

  useEffect(() => {
    if (filters.regionId) {
      axios.get(`http://localhost:8080/api/cities/by-region?regionId=${filters.regionId}`)
          .then(r => setCities(r.data)).catch(() => setCities([]));
    } else {
      setCities([]);
      setFilters(p => ({ ...p, cityId: '' }));
    }
  }, [filters.regionId]);

  const fetchAuctions = (f = filters) => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
    axios.get('http://localhost:8080/api/auctions/search', { params })
        .then(r => { setAuctions(r.data); setLoading(false); })
        .catch(() => setLoading(false));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFilters(p => ({ ...p, [name]: value }));
  };

  const reset = () => {
    setFilters(EMPTY);
    setModels([]);
    setCities([]);
    fetchAuctions(EMPTY);
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  const lotsWord = n => {
    if (n % 10 === 1 && n % 100 !== 11) return 'лот';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'лота';
    return 'лотов';
  };

  return (
      <div className="ct">

        {/* ── PAGE HERO ── */}
        <div className="ct-hero">
          <p className="ct-hero__eyebrow">Торги открыты</p>
          <h1 className="ct-hero__title">Каталог автомобилей</h1>
          <p className="ct-hero__sub">
            Выбирайте из проверенных лотов и делайте ставки в режиме реального времени.
          </p>
        </div>

        {/* ── MAIN GRID ── */}
        <main className="ct-main">

          {/* ── Sidebar ── */}
          <aside className="ct-sidebar">
            <div className="ct-sidebar__header">
              <span className="ct-sidebar__title">
                Фильтры
                {activeCount > 0 && <span className="ct-badge">{activeCount}</span>}
              </span>
              {activeCount > 0 && (
                  <button className="ct-sidebar__reset" onClick={reset}>Сбросить</button>
              )}
            </div>

            {/* Car */}
            <div className="ct-group">
              <p className="ct-group__title">Автомобиль</p>
              <div className="ct-group__body">
                <div className="ct-field">
                  <label className="ct-label">Марка</label>
                  <select name="brandId" value={filters.brandId} onChange={handleChange} className="ct-select">
                    <option value="">Все марки</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="ct-field">
                  <label className="ct-label">Модель</label>
                  <select name="modelId" value={filters.modelId} onChange={handleChange} className="ct-select"
                          disabled={!filters.brandId}>
                    <option value="">Все модели</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Specs */}
            <div className="ct-group">
              <p className="ct-group__title">Характеристики</p>
              <div className="ct-group__body">
                <div className="ct-field">
                  <label className="ct-label">КПП</label>
                  <select name="transmissionId" value={filters.transmissionId} onChange={handleChange} className="ct-select">
                    <option value="">Любая</option>
                    {transmissions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="ct-field">
                  <label className="ct-label">Топливо</label>
                  <select name="fuelTypeId" value={filters.fuelTypeId} onChange={handleChange} className="ct-select">
                    <option value="">Любое</option>
                    {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="ct-group">
              <p className="ct-group__title">Местоположение</p>
              <div className="ct-group__body">
                <div className="ct-field">
                  <label className="ct-label">Область</label>
                  <select name="regionId" value={filters.regionId} onChange={handleChange} className="ct-select">
                    <option value="">Все области</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="ct-field">
                  <label className="ct-label">Город</label>
                  <select name="cityId" value={filters.cityId} onChange={handleChange} className="ct-select"
                          disabled={!filters.regionId}>
                    <option value="">Все города</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Ranges */}
            <div className="ct-group">
              <p className="ct-group__title">Параметры</p>
              <div className="ct-group__body">
                <div className="ct-field">
                  <label className="ct-label">Цена (BYN)</label>
                  <div className="ct-range">
                    <input className="ct-input" type="number" name="priceFrom"   placeholder="От" value={filters.priceFrom}   onChange={handleChange} />
                    <span className="ct-range__sep">—</span>
                    <input className="ct-input" type="number" name="priceTo"     placeholder="До" value={filters.priceTo}     onChange={handleChange} />
                  </div>
                </div>
                <div className="ct-field">
                  <label className="ct-label">Год выпуска</label>
                  <div className="ct-range">
                    <input className="ct-input" type="number" name="yearFrom"    placeholder="От" value={filters.yearFrom}    onChange={handleChange} />
                    <span className="ct-range__sep">—</span>
                    <input className="ct-input" type="number" name="yearTo"      placeholder="До" value={filters.yearTo}      onChange={handleChange} />
                  </div>
                </div>
                <div className="ct-field">
                  <label className="ct-label">Пробег (км)</label>
                  <div className="ct-range">
                    <input className="ct-input" type="number" name="mileageFrom" placeholder="От" value={filters.mileageFrom} onChange={handleChange} />
                    <span className="ct-range__sep">—</span>
                    <input className="ct-input" type="number" name="mileageTo"   placeholder="До" value={filters.mileageTo}   onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="ct-sidebar__actions">
              <button className="ct-btn ct-btn--primary ct-btn--full" onClick={() => fetchAuctions()}>
                Найти
              </button>
              <button className="ct-btn ct-btn--ghost ct-btn--full" onClick={reset}>
                Сбросить всё
              </button>
            </div>
          </aside>

          {/* ── Results ── */}
          <section className="ct-results">
            <div className="ct-results__head">
              <p className="ct-results__count">
                {loading
                    ? 'Поиск...'
                    : <><span>{auctions.length}</span> {lotsWord(auctions.length)} найдено</>
                }
              </p>
            </div>

            {loading ? (
                <div className="ct-skel-grid">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="ct-skel" />)}
                </div>
            ) : auctions.length > 0 ? (
                <div className="ct-grid">
                  {auctions.map(a => <AuctionCard key={a.id} auction={a} />)}
                </div>
            ) : (
                <div className="ct-empty">
                  <div className="ct-empty__icon">◎</div>
                  <p className="ct-empty__title">Лоты не найдены</p>
                  <p className="ct-empty__sub">Попробуйте изменить параметры фильтра</p>
                  <button className="ct-btn ct-btn--ghost" onClick={reset}>Сбросить фильтры</button>
                </div>
            )}
          </section>
        </main>

        {/* ── FOOTER ── */}
        <footer className="ct-footer">
          <div className="ct-footer__grid">
            <div>
              <p className="ct-footer__wordmark">BiDrive</p>
              <p className="ct-footer__desc">Платформа онлайн-аукционов автомобилей. Прозрачно и безопасно.</p>
            </div>
            <div>
              <p className="ct-footer__col-title">Навигация</p>
              <ul className="ct-footer__list">
                <li><Link to="/catalog">Каталог</Link></li>
                <li><Link to="/register">Регистрация</Link></li>
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