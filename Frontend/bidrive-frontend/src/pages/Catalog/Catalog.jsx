import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AuctionCard from '../../components/AuctionCard';
import AuctionCardSkeleton from '../../components/AuctionCardSkeleton';
import BynIcon from '../../components/BynIcon';
import './Catalog.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const EMPTY = {
  brandId: '', modelId: '', fuelTypeId: '', transmissionId: '',
  regionId: '', cityId: '', yearFrom: '', yearTo: '',
  priceFrom: '', priceTo: '', mileageFrom: '', mileageTo: '',
};

function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  const [filters, setFilters] = useState(() => {
    const initial = { ...EMPTY };
    for (let key in EMPTY) {
      const param = searchParams.get(key);
      if (param) initial[key] = param;
    }
    return initial;
  });

  // === ИСПРАВЛЕНО: Добавляем filters в зависимости ===
  const fetchAuctions = useCallback((paramsToSend) => {
    setLoading(true);

    // Если параметры не переданы, берем текущий state (для надежности)
    const currentParams = paramsToSend || filters;

    const cleanParams = Object.fromEntries(Object.entries(currentParams).filter(([, v]) => v !== ''));
    setSearchParams(cleanParams);

    axios.get(`${API_URL}/api/auctions/search`, { params: cleanParams })
        .then(r => { setAuctions(r.data); setLoading(false); })
        .catch(() => setLoading(false));
  }, [setSearchParams, filters]); // Зависимости обновлены

  useEffect(() => {
    const controller = new AbortController();
    const fetchDictionaries = async () => {
      try {
        const config = { signal: controller.signal };
        const [br, ft, tr, rg] = await Promise.all([
          axios.get(`${API_URL}/api/brands`, config),
          axios.get(`${API_URL}/api/fuel-types`, config),
          axios.get(`${API_URL}/api/transmissions`, config),
          axios.get(`${API_URL}/api/regions`, config)
        ]);
        setBrands(br.data);
        setFuelTypes(ft.data);
        setTransmissions(tr.data);
        setRegions(rg.data);

        const initialBrand = searchParams.get('brandId');
        if (initialBrand) {
          const md = await axios.get(`${API_URL}/api/models/by-brand?brandId=${initialBrand}`, config);
          setModels(md.data);
        }
        const initialRegion = searchParams.get('regionId');
        if (initialRegion) {
          const ct = await axios.get(`${API_URL}/api/cities/by-region?regionId=${initialRegion}`, config);
          setCities(ct.data);
        }

        // Загружаем аукционы с параметрами из URL
        const initialFilters = getInitialFilters();
        // Вызываем fetchAuctions с явными параметрами
        fetchAuctions(initialFilters);

      } catch (err) {
        if (err.name !== 'CanceledError') console.error(err);
      }
    };
    fetchDictionaries();
    return () => controller.abort();
  }, []); // Пустой массив зависимостей - запускаем 1 раз при монтировании

  const getInitialFilters = () => {
    const initial = { ...EMPTY };
    for (let key in EMPTY) {
      const param = searchParams.get(key);
      if (param) initial[key] = param;
    }
    return initial;
  };

  useEffect(() => {
    if (filters.brandId) {
      axios.get(`${API_URL}/api/models/by-brand?brandId=${filters.brandId}`)
          .then(r => setModels(r.data)).catch(() => setModels([]));
    } else {
      setModels([]);
      setFilters(p => ({ ...p, modelId: '' }));
    }
  }, [filters.brandId]);

  useEffect(() => {
    if (filters.regionId) {
      axios.get(`${API_URL}/api/cities/by-region?regionId=${filters.regionId}`)
          .then(r => setCities(r.data)).catch(() => setCities([]));
    } else {
      setCities([]);
      setFilters(p => ({ ...p, cityId: '' }));
    }
  }, [filters.regionId]);

  const handleChange = e => {
    const { name, value } = e.target;
    const numericFields = ['priceFrom', 'priceTo', 'yearFrom', 'yearTo', 'mileageFrom', 'mileageTo'];
    if (numericFields.includes(name)) {
      const raw = value.replace(/\D/g, '');
      setFilters(p => ({ ...p, [name]: raw }));
    } else {
      setFilters(p => ({ ...p, [name]: value }));
    }
  };

  const reset = () => {
    setFilters(EMPTY);
    setSearchParams({});
    setModels([]);
    setCities([]);
    fetchAuctions(EMPTY); // Явно передаем EMPTY
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  const lotsWord = n => {
    if (n % 10 === 1 && n % 100 !== 11) return 'лот';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'лота';
    return 'лотов';
  };

  return (
      <div className="ct">
        <div className="ct-hero">
          <p className="ct-hero__eyebrow">Торги открыты</p>
          <h1 className="ct-hero__title">Каталог автомобилей</h1>
          <p className="ct-hero__sub">Выбирайте из проверенных лотов и делайте ставки в режиме реального времени.</p>
        </div>

        <main className="ct-main">
          <aside className="ct-sidebar">
            <div className="ct-sidebar__header">
              <span className="ct-sidebar__title">Фильтры {activeCount > 0 && <span className="ct-badge">{activeCount}</span>}</span>
              {activeCount > 0 && <button type="button" className="ct-sidebar__reset" onClick={reset}>Сбросить</button>}
            </div>

            <div className="ct-group">
              <p className="ct-group__title">Автомобиль</p>
              <div className="ct-group__body">
                <div className="ct-field">
                  <label className="ct-label" htmlFor="brandId">Марка</label>
                  <select id="brandId" name="brandId" value={filters.brandId} onChange={handleChange} className="ct-select">
                    <option value="">{brands.length ? 'Все марки' : 'Загрузка...'}</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="ct-field">
                  <label className="ct-label" htmlFor="modelId">Модель</label>
                  <select id="modelId" name="modelId" value={filters.modelId} onChange={handleChange} className="ct-select" disabled={!filters.brandId}>
                    <option value="">Все модели</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="ct-group">
              <p className="ct-group__title">Характеристики</p>
              <div className="ct-group__body">
                <div className="ct-field">
                  <label className="ct-label" htmlFor="transmissionId">КПП</label>
                  <select id="transmissionId" name="transmissionId" value={filters.transmissionId} onChange={handleChange} className="ct-select">
                    <option value="">{transmissions.length ? 'Любая' : 'Загрузка...'}</option>
                    {transmissions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="ct-field">
                  <label className="ct-label" htmlFor="fuelTypeId">Топливо</label>
                  <select id="fuelTypeId" name="fuelTypeId" value={filters.fuelTypeId} onChange={handleChange} className="ct-select">
                    <option value="">{fuelTypes.length ? 'Любое' : 'Загрузка...'}</option>
                    {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="ct-group">
              <p className="ct-group__title">Местоположение</p>
              <div className="ct-group__body">
                <div className="ct-field">
                  <label className="ct-label" htmlFor="regionId">Область</label>
                  <select id="regionId" name="regionId" value={filters.regionId} onChange={handleChange} className="ct-select">
                    <option value="">{regions.length ? 'Все области' : 'Загрузка...'}</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="ct-field">
                  <label className="ct-label" htmlFor="cityId">Город</label>
                  <select id="cityId" name="cityId" value={filters.cityId} onChange={handleChange} className="ct-select" disabled={!filters.regionId}>
                    <option value="">Все города</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="ct-group">
              <p className="ct-group__title">Параметры</p>
              <div className="ct-group__body">
                <div className="ct-field">
                  <label className="ct-label">Цена (<BynIcon className="ct-label-icon" />)</label>
                  <div className="ct-range">
                    <input className="ct-input" type="text" inputMode="numeric" name="priceFrom" id="priceFrom" placeholder="От" value={filters.priceFrom ? Number(filters.priceFrom).toLocaleString('ru-RU') : ''} onChange={handleChange} />
                    <span className="ct-range__sep">—</span>
                    <input className="ct-input" type="text" inputMode="numeric" name="priceTo" id="priceTo" placeholder="До" value={filters.priceTo ? Number(filters.priceTo).toLocaleString('ru-RU') : ''} onChange={handleChange} />
                  </div>
                </div>
                <div className="ct-field">
                  <label className="ct-label">Год выпуска</label>
                  <div className="ct-range">
                    <input className="ct-input" type="text" inputMode="numeric" name="yearFrom" id="yearFrom" placeholder="От" value={filters.yearFrom ? Number(filters.yearFrom).toLocaleString('ru-RU') : ''} onChange={handleChange} />
                    <span className="ct-range__sep">—</span>
                    <input className="ct-input" type="text" inputMode="numeric" name="yearTo" id="yearTo" placeholder="До" value={filters.yearTo ? Number(filters.yearTo).toLocaleString('ru-RU') : ''} onChange={handleChange} />
                  </div>
                </div>
                <div className="ct-field">
                  <label className="ct-label">Пробег (км)</label>
                  <div className="ct-range">
                    <input className="ct-input" type="text" inputMode="numeric" name="mileageFrom" id="mileageFrom" placeholder="От" value={filters.mileageFrom ? Number(filters.mileageFrom).toLocaleString('ru-RU') : ''} onChange={handleChange} />
                    <span className="ct-range__sep">—</span>
                    <input className="ct-input" type="text" inputMode="numeric" name="mileageTo" id="mileageTo" placeholder="До" value={filters.mileageTo ? Number(filters.mileageTo).toLocaleString('ru-RU') : ''} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            <div className="ct-sidebar__actions">
              {/* ИСПРАВЛЕНО: Явно передаем filters в функцию */}
              <button type="button" className="ct-btn ct-btn--primary ct-btn--full" onClick={() => fetchAuctions(filters)}>Найти</button>
              <button type="button" className="ct-btn ct-btn--ghost ct-btn--full" onClick={reset}>Сбросить всё</button>
            </div>
          </aside>

          <section className="ct-results">
            <div className="ct-results__head">
              <p className="ct-results__count">
                {loading ? 'Поиск...' : <><span>{auctions.length}</span>{' '}{lotsWord(auctions.length)} найдено</>}
              </p>
            </div>

            {loading ? (
                <div className="ct-grid">{Array.from({ length: 6 }).map((_, i) => <AuctionCardSkeleton key={i} />)}</div>
            ) : auctions.length > 0 ? (
                <div className="ct-grid">{auctions.map(a => <AuctionCard key={a.id} auction={a} />)}</div>
            ) : (
                <div className="ct-empty">
                  <div className="ct-empty__icon">◎</div>
                  <p className="ct-empty__title">Лоты не найдены</p>
                  <p className="ct-empty__sub">Попробуйте изменить параметры фильтра</p>
                  <button type="button" className="ct-btn ct-btn--ghost" onClick={reset}>Сбросить фильтры</button>
                </div>
            )}
          </section>
        </main>

        <footer className="ct-footer">
          <div className="ct-footer__grid">
            <div><p className="ct-footer__wordmark">BiDrive</p><p className="ct-footer__desc">Платформа онлайн-аукционов автомобилей.</p></div>
            <div><p className="ct-footer__col-title">Навигация</p><ul className="ct-footer__list"><li><Link to="/catalog">Каталог</Link></li></ul></div>
            <div><p className="ct-footer__col-title">Контакты</p><ul className="ct-footer__list"><li><a href="mailto:support@bidrive.by">support@bidrive.by</a></li></ul></div>
          </div>
          <div className="ct-footer__bottom"><p>© 2026 BiDrive. Дипломный проект.</p></div>
        </footer>
      </div>
  );
}

export default Catalog;