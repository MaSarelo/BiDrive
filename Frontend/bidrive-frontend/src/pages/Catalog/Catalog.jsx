import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AuctionCard from '../../components/AuctionCard';
import AuctionCardSkeleton from '../../components/AuctionCardSkeleton';
import BynIcon from '../../components/BynIcon';
import './Catalog.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const ITEMS_PER_PAGE = 12;

const EMPTY = {
  brandId: '', modelId: '', fuelTypeId: '', transmissionId: '',
  regionId: '', cityId: '', yearFrom: '', yearTo: '',
  priceFrom: '', priceTo: '', mileageFrom: '', mileageTo: '',
};

function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // === Инициализация sortBy из URL ===
  const [sortBy, setSortBy] = useState(() => {
    const param = searchParams.get('sortBy');
    return param || 'default';
  });

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  // === Инициализация фильтров из URL ===
  const [filters, setFilters] = useState(() => {
    const initial = { ...EMPTY };
    for (let key in EMPTY) {
      const param = searchParams.get(key);
      if (param) initial[key] = param;
    }
    return initial;
  });

  // === ПРИМЕНЁННЫЕ ФИЛЬТРЫ (обновляются только кнопкой "Найти") ===
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const initial = { ...EMPTY };
    for (let key in EMPTY) {
      const param = searchParams.get(key);
      if (param) initial[key] = param;
    }
    return initial;
  });

  // Ref для хранения актуальных применённых фильтров
  const appliedFiltersRef = useRef(appliedFilters);
  useEffect(() => {
    appliedFiltersRef.current = appliedFilters;
  }, [appliedFilters]);

  // === ФУНКЦИЯ ЗАГРУЗКИ ДАННЫХ ===
  const fetchAuctions = useCallback((filtersToApply) => {
    setLoading(true);
    const paramsToSend = filtersToApply || appliedFiltersRef.current;

    const cleanParams = Object.fromEntries(
        Object.entries(paramsToSend).filter(([, v]) => v !== '')
    );

    axios.get(`${API_URL}/api/auctions/search`, { params: cleanParams })
        .then(r => {
          setAuctions(r.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
  }, []);

  // === ПЕРВИЧНАЯ ЗАГРУЗКА СПРАВОЧНИКОВ ===
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
      } catch (err) {
        if (err.name !== 'CanceledError') console.error(err);
      }
    };

    fetchDictionaries();

    const hasUrlParams = Object.values(filters).some(v => v !== '');
    if (hasUrlParams) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAuctions(filters);
    } else {
      axios.get(`${API_URL}/api/auctions/search`)
          .then(r => {
            setAuctions(r.data);
            setLoading(false);
          })
          .catch(() => setLoading(false));
    }

    return () => controller.abort();
  }, []);

  // === AUTO-REFRESH КАТАЛОГА (использует ПРИМЕНЁННЫЕ фильтры) ===
  useEffect(() => {
    const intervalId = setInterval(() => {
      const cleanParams = Object.fromEntries(
          Object.entries(appliedFiltersRef.current).filter(([, v]) => v !== '')
      );
      axios.get(`${API_URL}/api/auctions/search`, { params: cleanParams })
          .then(r => setAuctions(r.data))
          .catch(() => {});
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // === ЗАВИСИМЫЕ СПИСКИ: МОДЕЛИ ПО МАРКЕ ===
  useEffect(() => {
    if (filters.brandId) {
      axios.get(`${API_URL}/api/models/by-brand?brandId=${filters.brandId}`)
          .then(r => setModels(r.data))
          .catch(() => setModels([]));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModels([]);
      if (filters.modelId !== '') {
        setFilters(p => ({ ...p, modelId: '' }));
      }
    }
  }, [filters.brandId]);

  // === ЗАВИСИМЫЕ СПИСКИ: ГОРОДА ПО ОБЛАСТИ ===
  useEffect(() => {
    if (filters.regionId) {
      axios.get(`${API_URL}/api/cities/by-region?regionId=${filters.regionId}`)
          .then(r => setCities(r.data))
          .catch(() => setCities([]));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCities([]);
      if (filters.cityId !== '') {
        setFilters(p => ({ ...p, cityId: '' }));
      }
    }
  }, [filters.regionId]);

  // === ОБРАБОТКА ИЗМЕНЕНИЙ ПОЛЕЙ + СИНХРОНИЗАЦИЯ С URL ===
  const handleChange = e => {
    const { name, value } = e.target;
    const numericFields = ['priceFrom', 'priceTo', 'yearFrom', 'yearTo', 'mileageFrom', 'mileageTo'];

    let processedValue = value;
    if (numericFields.includes(name)) {
      let raw = value.replace(/\D/g, '');
      if (name === 'yearFrom' || name === 'yearTo') {
        const currentYear = new Date().getFullYear();
        if (raw.length > 0) {
          const numVal = parseInt(raw, 10);
          if (numVal > currentYear) raw = String(currentYear);
        }
      }
      processedValue = raw;
    }

    // Обновляем состояние фильтров (только UI)
    const newFilters = { ...filters, [name]: processedValue };
    setFilters(newFilters);

    // === СИНХРОНИЗАЦИЯ С URL (отдельный вызов, не внутри setFilters) ===
    const newParams = new URLSearchParams(searchParams);
    if (processedValue) {
      newParams.set(name, processedValue);
    } else {
      newParams.delete(name);
    }
    setSearchParams(newParams, { replace: true });
  };

  // === ОБРАБОТКА ИЗМЕНЕНИЯ СОРТИРОВКИ ===
  const handleSortChange = (e) => {
    const newSort = e.target.value;

    const newParams = new URLSearchParams(searchParams);

    if (newSort === 'default') {
      newParams.delete('sortBy');
    } else {
      newParams.set('sortBy', newSort);
    }

    newParams.delete('page');

    setSearchParams(newParams, { replace: true });

    setSortBy(newSort);
    setCurrentPage(1);
  };

  // === ФУНКЦИЯ СОРТИРОВКИ ===
  const getSortedAuctions = () => {
    const sorted = [...auctions];

    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => a.currentPrice - b.currentPrice);
      case 'price_desc':
        return sorted.sort((a, b) => b.currentPrice - a.currentPrice);
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'mileage_asc':
        return sorted.sort((a, b) => a.mileage - b.mileage);
      case 'year_desc':
        return sorted.sort((a, b) => b.year - a.year);
      case 'year_asc':
        return sorted.sort((a, b) => a.year - b.year);
      default:
        return sorted;
    }
  };

  // === КНОПКА "НАЙТИ" ===
  const handleSearch = () => {
    setCurrentPage(1);
    setAppliedFilters(filters); // Применяем текущие фильтры
    fetchAuctions(filters);
  };

  // === СБРОС ФИЛЬТРОВ ===
  const reset = () => {
    setFilters(EMPTY);
    setAppliedFilters(EMPTY);
    setSearchParams({});
    setModels([]);
    setCities([]);
    setSortBy('default');
    fetchAuctions(EMPTY);
  };

  const activeCount = Object.values(appliedFilters).filter(Boolean).length;

  // === ПАГИНАЦИЯ ===
  const sortedAuctions = getSortedAuctions();
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentAuctions = sortedAuctions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedAuctions.length / ITEMS_PER_PAGE);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const lotsWord = n => {
    if (n % 10 === 1 && n % 100 !== 11) return 'лот';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'лота';
    return 'лотов';
  };

  // === СИНХРОНИЗАЦИЯ ПАГИНАЦИИ С URL ===
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam && parseInt(pageParam, 10) !== currentPage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(parseInt(pageParam, 10));
    }
  }, [searchParams]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', pageNumber.toString());
    setSearchParams(newParams, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              {activeCount > 0 && (
                  <button type="button" className="ct-sidebar__reset" onClick={reset}>
                    Сбросить
                  </button>
              )}
            </div>

            <div className="ct-group">
              <p className="ct-group__title">Автомобиль</p>
              <div className="ct-group__body">
                <div className="ct-field">
                  <label className="ct-label" htmlFor="brandId">Марка</label>
                  <select
                      id="brandId"
                      name="brandId"
                      value={filters.brandId}
                      onChange={handleChange}
                      className="ct-select"
                  >
                    <option value="">{brands.length ? 'Все марки' : 'Загрузка...'}</option>
                    {brands.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="ct-field">
                  <label className="ct-label" htmlFor="modelId">Модель</label>
                  <select
                      id="modelId"
                      name="modelId"
                      value={filters.modelId}
                      onChange={handleChange}
                      className="ct-select"
                      disabled={!filters.brandId}
                  >
                    <option value="">Все модели</option>
                    {models.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="ct-group">
              <p className="ct-group__title">Характеристики</p>
              <div className="ct-group__body">
                <div className="ct-field">
                  <label className="ct-label" htmlFor="transmissionId">КПП</label>
                  <select
                      id="transmissionId"
                      name="transmissionId"
                      value={filters.transmissionId}
                      onChange={handleChange}
                      className="ct-select"
                  >
                    <option value="">{transmissions.length ? 'Любая' : 'Загрузка...'}</option>
                    {transmissions.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="ct-field">
                  <label className="ct-label" htmlFor="fuelTypeId">Топливо</label>
                  <select
                      id="fuelTypeId"
                      name="fuelTypeId"
                      value={filters.fuelTypeId}
                      onChange={handleChange}
                      className="ct-select"
                  >
                    <option value="">{fuelTypes.length ? 'Любое' : 'Загрузка...'}</option>
                    {fuelTypes.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="ct-group">
              <p className="ct-group__title">Местоположение</p>
              <div className="ct-group__body">
                <div className="ct-field">
                  <label className="ct-label" htmlFor="regionId">Область</label>
                  <select
                      id="regionId"
                      name="regionId"
                      value={filters.regionId}
                      onChange={handleChange}
                      className="ct-select"
                  >
                    <option value="">{regions.length ? 'Все области' : 'Загрузка...'}</option>
                    {regions.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="ct-field">
                  <label className="ct-label" htmlFor="cityId">Город</label>
                  <select
                      id="cityId"
                      name="cityId"
                      value={filters.cityId}
                      onChange={handleChange}
                      className="ct-select"
                      disabled={!filters.regionId}
                  >
                    <option value="">Все города</option>
                    {cities.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="ct-group">
              <p className="ct-group__title">Параметры</p>
              <div className="ct-group__body">
                <div className="ct-field">
                  <label className="ct-label">
                    Цена (<BynIcon className="ct-label-icon" />)
                  </label>
                  <div className="ct-range">
                    <input
                        className="ct-input"
                        type="text"
                        inputMode="numeric"
                        name="priceFrom"
                        id="priceFrom"
                        placeholder="От"
                        value={
                          filters.priceFrom
                              ? Number(filters.priceFrom).toLocaleString('ru-RU')
                              : ''
                        }
                        onChange={handleChange}
                    />
                    <span className="ct-range__sep">—</span>
                    <input
                        className="ct-input"
                        type="text"
                        inputMode="numeric"
                        name="priceTo"
                        id="priceTo"
                        placeholder="До"
                        value={
                          filters.priceTo
                              ? Number(filters.priceTo).toLocaleString('ru-RU')
                              : ''
                        }
                        onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="ct-field">
                  <label className="ct-label">Год выпуска</label>
                  <div className="ct-range">
                    <input
                        className="ct-input"
                        type="text"
                        inputMode="numeric"
                        name="yearFrom"
                        id="yearFrom"
                        placeholder="От"
                        value={filters.yearFrom}
                        onChange={handleChange}
                    />
                    <span className="ct-range__sep">—</span>
                    <input
                        className="ct-input"
                        type="text"
                        inputMode="numeric"
                        name="yearTo"
                        id="yearTo"
                        placeholder="До"
                        value={filters.yearTo}
                        onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="ct-field">
                  <label className="ct-label">Пробег (км)</label>
                  <div className="ct-range">
                    <input
                        className="ct-input"
                        type="text"
                        inputMode="numeric"
                        name="mileageFrom"
                        id="mileageFrom"
                        placeholder="От"
                        value={
                          filters.mileageFrom
                              ? Number(filters.mileageFrom).toLocaleString('ru-RU')
                              : ''
                        }
                        onChange={handleChange}
                    />
                    <span className="ct-range__sep">—</span>
                    <input
                        className="ct-input"
                        type="text"
                        inputMode="numeric"
                        name="mileageTo"
                        id="mileageTo"
                        placeholder="До"
                        value={
                          filters.mileageTo
                              ? Number(filters.mileageTo).toLocaleString('ru-RU')
                              : ''
                        }
                        onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="ct-sidebar__actions">
              <button
                  type="button"
                  className="ct-btn ct-btn--primary ct-btn--full"
                  onClick={handleSearch}
              >
                Найти
              </button>
              <button
                  type="button"
                  className="ct-btn ct-btn--ghost ct-btn--full"
                  onClick={reset}
              >
                Сбросить всё
              </button>
            </div>
          </aside>

          <section className="ct-results">
            <div className="ct-results__head">
              <p className="ct-results__count">
                {loading
                    ? 'Поиск...'
                    : (
                        <>
                          <span>{sortedAuctions.length}</span>{' '}
                          {lotsWord(sortedAuctions.length)} найдено
                        </>
                    )}
              </p>

              {/* СОРТИРОВКА */}
              <div className="ct-sort">
                <label htmlFor="sortBy" className="ct-sort__label">Сначала:</label>
                <select
                    id="sortBy"
                    value={sortBy}
                    onChange={handleSortChange}
                    className="ct-select ct-select--sort"
                >
                  <option value="default">Актуальные</option>
                  <option value="price_asc">Дешёвые</option>
                  <option value="price_desc">Дорогие</option>
                  <option value="newest">Новые объявления</option>
                  <option value="oldest">Старые объявления</option>
                  <option value="mileage_asc">С наименьшим пробегом</option>
                  <option value="year_desc">Новые по году</option>
                  <option value="year_asc">Старые по году</option>
                </select>
              </div>
            </div>

            {loading ? (
                <div className="ct-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                      <AuctionCardSkeleton key={i} />
                  ))}
                </div>
            ) : sortedAuctions.length > 0 ? (
                <>
                  <div className="ct-grid">
                    {currentAuctions.map(a => (
                        <AuctionCard key={a.id} auction={a} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                      <nav className="ct-pagination">
                        <button
                            className="ct-pagination__btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                          ‹
                        </button>
                        {pageNumbers.map(number => (
                            <button
                                key={number}
                                className={`ct-pagination__btn ${
                                    currentPage === number ? 'active' : ''
                                }`}
                                onClick={() => handlePageChange(number)}
                            >
                              {number}
                            </button>
                        ))}
                        <button
                            className="ct-pagination__btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                          ›
                        </button>
                      </nav>
                  )}
                </>
            ) : (
                <div className="ct-empty">
                  <div className="ct-empty__icon">◎</div>
                  <p className="ct-empty__title">Лоты не найдены</p>
                  <p className="ct-empty__sub">Попробуйте изменить параметры фильтра</p>
                  <button
                      type="button"
                      className="ct-btn ct-btn--ghost"
                      onClick={reset}
                  >
                    Сбросить фильтры
                  </button>
                </div>
            )}
          </section>
        </main>

        <footer className="ct-footer">
          <div className="ct-footer__grid">
            <div>
              <p className="ct-footer__wordmark">BiDrive</p>
              <p className="ct-footer__desc">
                Платформа онлайн-аукционов автомобилей.
              </p>
            </div>
            <div>
              <p className="ct-footer__col-title">Навигация</p>
              <ul className="ct-footer__list">
                <li><Link to="/catalog">Каталог</Link></li>
                <li><Link to="/rules">Правила платформы</Link></li>
              </ul>
            </div>
            <div>
              <p className="ct-footer__col-title">Контакты</p>
              <ul className="ct-footer__list">
                <li>
                  <a href="mailto:support@bidrive.by">support@bidrive.by</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="ct-footer__bottom">
            <p>© 2026 BiDrive. Дипломный проект.</p>
          </div>
        </footer>
      </div>
  );
}

export default Catalog;