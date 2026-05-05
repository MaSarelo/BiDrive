import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateAuction.css';
import BynIcon from '../../components/BynIcon';

const Field = ({ label, required, children }) => (
    <div className="ca-field">
      <label className={`ca-label${required ? ' required' : ''}`}>{label}</label>
      {children}
    </div>
);

function CreateAuction() {
  const [searchParams, setSearchParams] = useSearchParams();

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

  const navigate = useNavigate();
  const copyIdRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const yearsList = [];
  for (let y = currentYear + 1; y >= 1980; y--) {
    yearsList.push(y);
  }

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
    const processParams = async () => {
      const copyId = searchParams.get('copyId');
      if (copyId) {
        copyIdRef.current = copyId;
        try {
          const res = await axios.get(`http://localhost:8080/api/auctions/${copyId}`);
          const a = res.data;
          setFormData({
            sellerId: parseInt(localStorage.getItem('userId')),
            brandId: a.brand?.id || '',
            modelId: a.model?.id || '',
            year: a.year || '',
            mileage: String(a.mileage || ''),
            transmissionId: a.transmission?.id || '',
            fuelTypeId: a.fuelType?.id || '',
            cityId: a.city?.id || '',
            description: a.description || '',
            startingPrice: String(a.startingPrice || ''),
            minBidStep: String(a.minBidStep || '100'),
            endTime: ''
          });
          if (a.brand?.id) setSelectedBrand(String(a.brand.id));
          if (a.city?.region?.id) setSelectedRegion(String(a.city.region.id));
          setSearchParams({}, { replace: true });
        } catch (err) {
          console.error("Ошибка копирования", err);
          alert("Не удалось загрузить данные.");
        }
      }
    };
    processParams();
  }, [searchParams]);

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

  const updateFormState = (name, value) => {
    setFormData(p => ({ ...p, [name]: value }));
    const newParams = new URLSearchParams(searchParams);
    if (value) { newParams.set(name, value); } else { newParams.delete(name); }
    setSearchParams(newParams, { replace: true });
  };

  const handleChange = e => {
    const { name, value } = e.target;
    updateFormState(name, value);
    if (e.target.tagName === 'TEXTAREA') {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };

  const handleNumericChange = e => {
    const { name, value } = e.target;
    if (name === 'mileage') {
      const raw = value.replace(/\D/g, '');
      updateFormState(name, raw);
    } else {
      let val = value.replace(',', '.').replace(/[^\d.]/g, '');
      const parts = val.split('.');
      if (parts.length > 1) val = parts[0] + '.' + parts[1].slice(0, 2);
      updateFormState(name, val);
    }
  };

  const handleSelectChangeWithTrigger = (e, triggerSetter) => {
    const { name, value } = e.target;
    updateFormState(name, value);
    triggerSetter(value);
  };

  const minDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const handleFileChange = e => {
    if (e.target.files) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const newFiles = [];
      Array.from(e.target.files).forEach(file => {
        if (!validTypes.includes(file.type) || file.size > 10 * 1024 * 1024) return;
        newFiles.push(file);
      });
      if (newFiles.length > 0) {
        setFiles(p => [...p, ...newFiles]);
        setMsg({ text: '', ok: true });
      }
    }
  };

  const removeFile = i => {
    setFiles(p => p.filter((_, idx) => idx !== i));
    if (mainImageIndex === i) setMainImageIndex(0);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.sellerId) { setMsg({ text: 'Войдите в аккаунт', ok: false }); return; }

    const newErrors = {};
    if (files.length === 0) newErrors.files = 'Добавьте фото';
    if (!formData.brandId) newErrors.brand = 'Выберите марку';
    if (!formData.modelId) newErrors.model = 'Выберите модель';
    if (!formData.year) newErrors.year = 'Выберите год';
    if (!formData.mileage) newErrors.mileage = 'Укажите пробег';
    else if (parseInt(formData.mileage) < 0) newErrors.mileage = 'Пробег >= 0';
    if (!formData.transmissionId) newErrors.transmission = 'Выберите КПП';
    if (!formData.fuelTypeId) newErrors.fuel = 'Выберите топливо';
    if (!selectedRegion) newErrors.region = 'Выберите область';
    if (!formData.cityId) newErrors.city = 'Выберите город';

    const price = parseFloat(formData.startingPrice);
    const step = parseFloat(formData.minBidStep);
    if (!formData.startingPrice) newErrors.price = 'Укажите цену';
    else if (isNaN(price) || price <= 0) newErrors.price = 'Цена > 0';
    if (!formData.minBidStep) newErrors.step = 'Укажите шаг';
    else if (isNaN(step) || step <= 0) newErrors.step = 'Шаг > 0';
    if (!formData.endTime) newErrors.endTime = 'Укажите время';
    else if (new Date(formData.endTime) <= new Date()) newErrors.endTime = 'Время в будущем';
    if (!formData.description || formData.description.trim().length < 10) newErrors.description = 'Описание >= 10 символов';

    if (Object.keys(newErrors).length > 0) {
      setMsg({ text: Object.values(newErrors).join('. '), ok: false });
      return;
    }

    setIsSubmitting(true);
    setMsg({ text: 'Загрузка фото...', ok: true });

    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append('file', files[i]);
        const res = await axios.post('http://localhost:8080/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploadedUrls.push(res.data.url);
      }

      const sorted = [...uploadedUrls];
      if (mainImageIndex >= 0 && mainImageIndex < sorted.length) {
        const main = sorted.splice(mainImageIndex, 1)[0];
        sorted.unshift(main);
      }

      const payload = { ...formData, regionId: selectedRegion, imageUrls: sorted };
      await axios.post('http://localhost:8080/api/auctions', payload);

      if (copyIdRef.current) {
        try { await axios.delete(`http://localhost:8080/api/auctions/${copyIdRef.current}`, { params: { userId: formData.sellerId } }); } catch (e) {}
        copyIdRef.current = null;
      }

      setMsg({ text: 'Лот отправлен на модерацию!', ok: true });
      setTimeout(() => { window.location.href = '/profile'; }, 2000);
    } catch (err) {
      setMsg({ text: 'Ошибка: ' + (err.response?.data || err.message), ok: false });
      setIsSubmitting(false);
    }
  };

  const formatSpaces = v => {
    if (!v) return '';
    if (v.indexOf('.') === -1) return parseInt(v).toLocaleString('ru-RU') || v;
    const parts = v.split('.');
    return (parseInt(parts[0]) || 0).toLocaleString('ru-RU') + (parts[1] !== undefined ? ',' + parts[1] : '');
  };

  return (
      <div className="ca">
        <div className="ca-hero">
          <div className="ca-container">
            <p className="ca-eyebrow">Новый лот</p>
            <h1 className="ca-title">Выставить автомобиль<br />на аукцион</h1>
          </div>
        </div>

        <main className="ca-container ca-body">
          <div className="ca-form-wrap">
            <form onSubmit={handleSubmit} className="ca-form">

              <section className="ca-section">
                <p className="ca-section__title">Автомобиль</p>

                <p className="ca-section__hint" style={{marginTop: '-1rem', marginBottom: '1rem', color: 'var(--text-3)'}}>
                  Если вы не нашли нужную марку или модель в списке, выберите <strong>«Другое»</strong> и укажите подробности в описании.
                </p>

                <div className="ca-grid ca-grid--2">

                  {/* БЛОК МАРКИ - Просто Select */}
                  <Field label="Марка" required>
                    <select className="ca-select" name="brandId" value={formData.brandId}
                            onChange={e => handleSelectChangeWithTrigger(e, setSelectedBrand)}>
                      <option value="">Выберите марку...</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </Field>

                  {/* БЛОК МОДЕЛИ - Просто Select */}
                  <Field label="Модель" required>
                    <select className="ca-select" name="modelId" value={formData.modelId}
                            onChange={handleChange} disabled={!selectedBrand}>
                      <option value="">Выберите модель...</option>
                      {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Год выпуска" required>
                    <select className="ca-select" name="year" value={formData.year} onChange={handleChange}>
                      <option value="">Выберите год...</option>
                      {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </Field>

                  <Field label="Пробег (км)" required>
                    <input className="ca-input" type="text" inputMode="numeric" name="mileage"
                           placeholder="50 000" value={formatSpaces(formData.mileage)} onChange={handleNumericChange} />
                  </Field>

                  <Field label="КПП" required>
                    <select className="ca-select" name="transmissionId" value={formData.transmissionId} onChange={handleChange}>
                      <option value="">Выберите КПП...</option>
                      {transmissions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Тип топлива" required>
                    <select className="ca-select" name="fuelTypeId" value={formData.fuelTypeId} onChange={handleChange}>
                      <option value="">Выберите топливо...</option>
                      {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </Field>
                </div>
              </section>

              {/* Местоположение */}
              <section className="ca-section">
                <p className="ca-section__title">Местоположение</p>
                <div className="ca-grid ca-grid--2">
                  <Field label="Область" required>
                    <select className="ca-select" name="regionId" value={selectedRegion}
                            onChange={e => handleSelectChangeWithTrigger(e, setSelectedRegion)}>
                      <option value="">Выберите область...</option>
                      {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Город" required>
                    <select className="ca-select" name="cityId" value={formData.cityId}
                            onChange={handleChange} disabled={!selectedRegion}>
                      <option value="">Выберите город...</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                </div>
              </section>

              {/* Параметры торгов */}
              <section className="ca-section">
                <p className="ca-section__title">Параметры торгов</p>
                <div className="ca-grid ca-grid--3">
                  <Field label={<>Начальная цена (<BynIcon className="ca-label-icon" />)</>} required>
                    <input className="ca-input" type="text" inputMode="decimal" name="startingPrice"
                           placeholder="10 000" value={formatSpaces(formData.startingPrice)} onChange={handleNumericChange} />
                  </Field>
                  <Field label={<>Минимальный шаг (<BynIcon className="ca-label-icon" />)</>} required>
                    <input className="ca-input" type="text" inputMode="decimal" name="minBidStep"
                           placeholder="100" value={formatSpaces(formData.minBidStep)} onChange={handleNumericChange} />
                  </Field>
                  <Field label="Дата и время окончания" required>
                    <input className="ca-input" type="datetime-local" name="endTime"
                           value={formData.endTime} onChange={handleChange}
                           min={minDateTime} max="2099-12-31T23:59" />
                  </Field>
                </div>
              </section>

              {/* Описание */}
              <section className="ca-section">
                <p className="ca-section__title">Описание</p>
                <Field label="Подробно опишите состояние автомобиля" required>
                  <textarea className="ca-textarea" name="description" rows="4"
                            placeholder="Состояние кузова, салона, техническое обслуживание..."
                            value={formData.description} onChange={handleChange} />
                </Field>
              </section>

              {/* Фотографии */}
              <section className="ca-section">
                <p className="ca-section__title">Фотографии</p>
                <p className="ca-section__hint">Кликните на фото, чтобы сделать его главным.<span className="hint-required"> *</span></p>
                <div className="ca-dropzone" onClick={() => document.getElementById('ca-file-input').click()}>
                  <span className="ca-dropzone__icon">+</span>
                  <p className="ca-dropzone__text">Нажмите для выбора фотографий</p>
                  <p className="ca-dropzone__hint">JPG · PNG · WEBP</p>
                  <input id="ca-file-input" type="file" onChange={handleFileChange} accept="image/*" multiple style={{ display: 'none' }} />
                </div>
                {files.length > 0 && (
                    <div className="ca-preview">
                      {files.map((file, i) => (
                          <div key={i} className={`ca-thumb${i === mainImageIndex ? ' ca-thumb--main' : ''}`}
                               onClick={() => setMainImageIndex(i)} title="Сделать главным">
                            <img src={URL.createObjectURL(file)} alt="" />
                            {i === mainImageIndex && <span className="ca-thumb__badge">Главное</span>}
                            <button type="button" className="ca-thumb__remove" onClick={e => { e.stopPropagation(); removeFile(i); }}>×</button>
                          </div>
                      ))}
                    </div>
                )}
              </section>

              {/* Submit */}
              <div className="ca-submit">
                {msg.text && (<p className={`ca-msg${msg.ok ? ' ca-msg--ok' : ' ca-msg--err'}`}>{msg.text}</p>)}
                <button type="submit" className={`ca-btn ca-btn--gold ca-btn--lg ca-btn--full${isSubmitting ? ' ca-btn--disabled' : ''}`} disabled={isSubmitting}>
                  {isSubmitting ? 'Отправка...' : 'Опубликовать лот'}
                </button>
              </div>

            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="ca-footer">
          <div className="ca-footer__grid">
            <div><p className="ca-footer__wordmark">BiDrive</p><p className="ca-footer__desc">Платформа онлайн-аукционов автомобилей.</p></div>
            <div><p className="ca-footer__col-title">Навигация</p><ul className="ca-footer__list"><li><Link to="/catalog">Каталог</Link></li> <li><Link to="/rules">Правила платформы</Link></li></ul></div>
            <div><p className="ca-footer__col-title">Контакты</p><ul className="ca-footer__list"><li><a href="mailto:support@bidrive.by">support@bidrive.by</a></li></ul></div>
          </div>
          <div className="ca-footer__bottom"><p>© 2026 BiDrive. Дипломный проект.</p></div>
        </footer>
      </div>
  );
}

export default CreateAuction;