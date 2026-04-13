import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './CreateAuction.css';
import BynIcon from '../../components/BynIcon.jsx';

const Field = ({ label, required, children }) => (
    <div className="ca-field">
      <label className={`ca-label${required ? ' required' : ''}`}>{label}</label>
      {children}
    </div>
);

function CreateAuction() {
  const [formData, setFormData] = useState({
    sellerId: null, brandId: '', modelId: '', year: '', mileage: '',
    transmissionId: '', fuelTypeId: '', cityId: '',
    description: '', startingPrice: '', minBidStep: '100', endTime: ''
  });

  const [brands,        setBrands]        = useState([]);
  const [models,        setModels]        = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [fuelTypes,     setFuelTypes]     = useState([]);
  const [regions,       setRegions]       = useState([]);
  const [cities,        setCities]        = useState([]);
  const [selectedBrand,  setSelectedBrand]  = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  const [files,          setFiles]          = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg,          setMsg]          = useState({ text: '', ok: true });

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) setFormData(p => ({ ...p, sellerId: parseInt(id) }));
  }, []);

  useEffect(() => {
    axios.get('http://localhost:8080/api/brands').then(r => setBrands(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/regions').then(r => setRegions(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/transmissions').then(r => setTransmissions(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/fuel-types').then(r => setFuelTypes(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      axios.get(`http://localhost:8080/api/models/by-brand?brandId=${selectedBrand}`)
          .then(r => setModels(r.data)).catch(() => setModels([]));
    } else { setModels([]); }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedRegion) {
      axios.get(`http://localhost:8080/api/cities/by-region?regionId=${selectedRegion}`)
          .then(r => setCities(r.data)).catch(() => setCities([]));
    } else { setCities([]); }
  }, [selectedRegion]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (e.target.tagName === 'TEXTAREA') {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };

  // Обработчик для числовых полей (очистка от не-цифр)
  const handleNumericChange = e => {
    const { name, value } = e.target;
    const raw = value.replace(/\D/g, '');
    setFormData(p => ({ ...p, [name]: raw }));
  };

  // Минимальная дата/время — текущий момент
  const minDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);

  const handleFileChange = e => {
    if (e.target.files) setFiles(p => [...p, ...Array.from(e.target.files)]);
  };

  const removeFile = i => {
    setFiles(p => p.filter((_, idx) => idx !== i));
    if (mainImageIndex === i) setMainImageIndex(0);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // --- FRONTEND VALIDATION ---
    const newErrors = {};
    if (files.length === 0) newErrors.files = 'Добавьте хотя бы одно фото';
    if (!formData.brandId || !formData.modelId) newErrors.car = 'Выберите марку и модель';
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) newErrors.year = 'Укажите корректный год';
    if (!formData.mileage || formData.mileage < 0) newErrors.mileage = 'Укажите пробег';
    if (!formData.startingPrice || formData.startingPrice <= 0) newErrors.price = 'Цена должна быть больше 0';
    if (!formData.minBidStep || formData.minBidStep <= 0) newErrors.step = 'Шаг ставки должен быть больше 0';
    if (!formData.endTime) newErrors.endTime = 'Укажите время окончания';

    if (Object.keys(newErrors).length > 0) {
      setMsg({ text: Object.values(newErrors).join('. '), ok: false });
      return;
    }
    // ---------------------------

    setIsSubmitting(true);
    setMsg({ text: 'Загрузка фотографий (0/' + files.length + ')...', ok: true });

    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append('file', files[i]);
        const res = await axios.post('http://localhost:8080/api/files/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(res.data.url);
        setMsg({ text: `Загрузка фотографий (${i + 1}/${files.length})...`, ok: true });
      }

      setMsg({ text: 'Фото загружены. Отправка лота на модерацию...', ok: true });

      const sorted = [...uploadedUrls];
      if (mainImageIndex >= 0 && mainImageIndex < sorted.length) {
        const main = sorted.splice(mainImageIndex, 1)[0];
        sorted.unshift(main);
      }

      await axios.post('http://localhost:8080/api/auctions', { ...formData, imageUrls: sorted });

      setMsg({ text: 'Лот успешно отправлен на модерацию!', ok: true });
      setTimeout(() => { window.location.href = '/profile'; }, 2000);

    } catch (err) {
      setMsg({ text: 'Ошибка: ' + (err.response?.data || err.message), ok: false });
      setIsSubmitting(false);
    }
  };

  // Форматирование для отображения
  const formatSpaces = v => v ? Number(v).toLocaleString('ru-RU') : '';

  return (
      <div className="ca">

        {/* Hero */}
        <div className="ca-hero">
          <div className="ca-container">
            <p className="ca-eyebrow">Новый лот</p>
            <h1 className="ca-title">Выставить автомобиль<br />на аукцион</h1>
          </div>
        </div>

        {/* Form */}
        <main className="ca-container ca-body">
          <div className="ca-form-wrap">
            <form onSubmit={handleSubmit} className="ca-form">

              {/* ── Автомобиль ── */}
              <section className="ca-section">
                <p className="ca-section__title">Автомобиль</p>
                <div className="ca-grid ca-grid--2">
                  <Field label="Марка" required>
                    <select className="ca-select" name="brandId" value={formData.brandId} required
                            onChange={e => { setSelectedBrand(e.target.value); handleChange(e); }}>
                      <option value="">Выберите марку...</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Модель" required>
                    <select className="ca-select" name="modelId" value={formData.modelId} required
                            onChange={handleChange} disabled={!selectedBrand}>
                      <option value="">Выберите модель...</option>
                      {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Год выпуска" required>
                    <input className="ca-input" type="number" name="year"
                           placeholder="2022" value={formData.year} onChange={handleChange} required />
                  </Field>

                  <Field label="Пробег (км)" required>
                    <input className="ca-input" type="text" inputMode="numeric" name="mileage"
                           placeholder="50 000" value={formatSpaces(formData.mileage)} onChange={handleNumericChange} required />
                  </Field>

                  <Field label="КПП" required>
                    <select className="ca-select" name="transmissionId" value={formData.transmissionId}
                            onChange={handleChange} required>
                      <option value="">Выберите КПП...</option>
                      {transmissions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Тип топлива" required>
                    <select className="ca-select" name="fuelTypeId" value={formData.fuelTypeId}
                            onChange={handleChange} required>
                      <option value="">Выберите топливо...</option>
                      {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </Field>
                </div>
              </section>

              {/* ── Местоположение ── */}
              <section className="ca-section">
                <p className="ca-section__title">Местоположение</p>
                <div className="ca-grid ca-grid--2">
                  <Field label="Область" required>
                    <select className="ca-select" value={selectedRegion}
                            onChange={e => setSelectedRegion(e.target.value)} required>
                      <option value="">Выберите область...</option>
                      {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Город" required>
                    <select className="ca-select" name="cityId" value={formData.cityId}
                            onChange={handleChange} required disabled={!selectedRegion}>
                      <option value="">Выберите город...</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                </div>
              </section>

              {/* ── Параметры торгов ── */}
              <section className="ca-section">
                <p className="ca-section__title">Параметры торгов</p>
                <div className="ca-grid ca-grid--3">
                  <Field label={<>Начальная цена (<BynIcon className="ca-label-icon" />)</>} required>
                    <input className="ca-input" type="text" inputMode="numeric" name="startingPrice"
                           placeholder="10 000" value={formatSpaces(formData.startingPrice)} onChange={handleNumericChange} required />
                  </Field>

                  <Field label={<>Минимальный шаг (<BynIcon className="ca-label-icon" />)</>} required>
                    <input className="ca-input" type="text" inputMode="numeric" name="minBidStep"
                           placeholder="100" value={formatSpaces(formData.minBidStep)} onChange={handleNumericChange} required />
                  </Field>
                  <Field label="Дата и время окончания" required>
                    <input className="ca-input" type="datetime-local" name="endTime"
                           value={formData.endTime} onChange={handleChange}
                           min={minDateTime} max="2099-12-31T23:59"
                           required />
                  </Field>
                </div>
              </section>

              {/* ── Описание ── */}
              <section className="ca-section">
                <p className="ca-section__title">Описание</p>
                <Field label="Подробно опишите состояние автомобиля" required>
                  <textarea className="ca-textarea" name="description" rows="4"
                            placeholder="Состояние кузова, салона, техническое обслуживание..."
                            value={formData.description} onChange={handleChange} required />
                </Field>
              </section>

              {/* ── Фотографии ── */}
              <section className="ca-section">
                <p className="ca-section__title">Фотографии</p>
                <p className="ca-section__hint">
                  Кликните на фото, чтобы сделать его главным — оно будет отображаться на карточке в каталоге.
                </p>

                <div className="ca-dropzone"
                     onClick={() => document.getElementById('ca-file-input').click()}>
                  <span className="ca-dropzone__icon">+</span>
                  <p className="ca-dropzone__text">Нажмите для выбора фотографий</p>
                  <p className="ca-dropzone__hint">JPG · PNG · WEBP</p>
                  <input id="ca-file-input" type="file" onChange={handleFileChange}
                         accept="image/*" multiple style={{ display: 'none' }} />
                </div>

                {files.length > 0 && (
                    <div className="ca-preview">
                      {files.map((file, i) => (
                          <div key={i}
                               className={`ca-thumb${i === mainImageIndex ? ' ca-thumb--main' : ''}`}
                               onClick={() => setMainImageIndex(i)}
                               title="Сделать главным">
                            <img src={URL.createObjectURL(file)} alt="" />
                            {i === mainImageIndex && <span className="ca-thumb__badge">Главное</span>}
                            <button type="button" className="ca-thumb__remove"
                                    onClick={e => { e.stopPropagation(); removeFile(i); }}>×</button>
                          </div>
                      ))}
                    </div>
                )}
              </section>

              {/* ── Submit ── */}
              <div className="ca-submit">
                {msg.text && (
                    <p className={`ca-msg${msg.ok ? ' ca-msg--ok' : ' ca-msg--err'}`}>{msg.text}</p>
                )}
                <button type="submit"
                        className={`ca-btn ca-btn--gold ca-btn--lg ca-btn--full${isSubmitting ? ' ca-btn--disabled' : ''}`}
                        disabled={isSubmitting}>
                  {isSubmitting ? 'Отправка...' : 'Опубликовать лот'}
                </button>
              </div>

            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="ca-footer">
          <div className="ca-footer__grid">
            <div>
              <p className="ca-footer__wordmark">BiDrive</p>
              <p className="ca-footer__desc">Платформа онлайн-аукционов автомобилей.</p>
            </div>
            <div>
              <p className="ca-footer__col-title">Навигация</p>
              <ul className="ca-footer__list">
                <li><Link to="/catalog">Каталог</Link></li>
              </ul>
            </div>
            <div>
              <p className="ca-footer__col-title">Контакты</p>
              <ul className="ca-footer__list">
                <li><a href="mailto:support@bidrive.by">support@bidrive.by</a></li>
              </ul>
            </div>
          </div>
          <div className="ca-footer__bottom">
            <p>© 2026 BiDrive. Дипломный проект.</p>
          </div>
        </footer>

      </div>
  );
}

export default CreateAuction;