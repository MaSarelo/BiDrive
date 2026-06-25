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

// === КЛЮЧ ДЛЯ СОХРАНЕНИЯ ЧЕРНОВИКА ===
const DRAFT_KEY = 'auction_draft';

function CreateAuction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const editId = searchParams.get('editId');
  const copyId = searchParams.get('copyId');
  const isEditMode = !!editId;
  const isCopyMode = !!copyId;
  const isNormalMode = !isEditMode && !isCopyMode;

  const [formData, setFormData] = useState({
    sellerId: null,
    brandId: '',
    modelId: '',
    year: '',
    mileage: '',
    transmissionId: '',
    fuelTypeId: '',
    cityId: '',
    description: '',
    startingPrice: '',
    minBidStep: '100',
    endTime: '',
    vin: ''
  });

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  const [imageUrls, setImageUrls] = useState([]);
  const [files, setFiles] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModeLoading, setIsEditModeLoading] = useState(false);

  const copyDataLoadedRef = useRef(false);

  // === TOAST УВЕДОМЛЕНИЯ ===
  const [toasts, setToasts] = useState([]);

  // === МОДАЛКА ПОДТВЕРЖДЕНИЯ ОЧИСТКИ ===
  const [confirmClearModal, setConfirmClearModal] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearsList = [];
  for (let y = currentYear + 1; y >= 1980; y--) yearsList.push(y);

  // === ФУНКЦИЯ ДОБАВЛЕНИЯ TOAST ===
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  // === УДАЛЕНИЕ TOAST ===
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // === ИНИЦИАЛИЗАЦИЯ: загрузка черновика ===
  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) setFormData(p => ({ ...p, sellerId: parseInt(id) }));

    if (isNormalMode) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.formData) {
            setFormData(prev => ({
              ...prev,
              ...draft.formData,
              sellerId: parseInt(id)
            }));
          }
          if (draft.selectedBrand) setSelectedBrand(draft.selectedBrand);
          if (draft.selectedRegion) setSelectedRegion(draft.selectedRegion);
          if (draft.imageUrls && Array.isArray(draft.imageUrls)) {
            setImageUrls(draft.imageUrls);
          }
          if (typeof draft.mainImageIndex === 'number') {
            setMainImageIndex(draft.mainImageIndex);
          }
          // === TOAST О ВОССТАНОВЛЕНИИ ===
          addToast('📝 Черновик восстановлен', 'info');
        } catch (e) {
          console.error('Ошибка загрузки черновика:', e);
        }
      }
    }
  }, []);

  // === АВТОСОХРАНЕНИЕ ЧЕРНОВИКА ===
  useEffect(() => {
    if (!isNormalMode) return;

    const hasData = Object.entries(formData).some(([key, value]) => {
      if (key === 'sellerId') return false;
      if (key === 'minBidStep') return value !== '100' && value !== '';
      return value !== '' && value !== null && value !== undefined;
    }) || imageUrls.length > 0;

    if (!hasData) return;

    const timeoutId = setTimeout(() => {
      try {
        const draftData = {
          formData,
          selectedBrand,
          selectedRegion,
          imageUrls,
          mainImageIndex,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        // === TOAST О СОХРАНЕНИИ ===
        addToast('✅ Черновик сохранён', 'success');
      } catch (e) {
        console.error('Ошибка сохранения черновика:', e);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData, selectedBrand, selectedRegion, imageUrls, mainImageIndex, isNormalMode]);

  // Загрузка справочников
  useEffect(() => {
    axios.get('http://localhost:8080/api/brands').then(r => setBrands(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/regions').then(r => setRegions(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/transmissions').then(r => setTransmissions(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/fuel-types').then(r => setFuelTypes(r.data)).catch(console.error);
  }, []);

  // === ЗАГРУЗКА ДАННЫХ ПРИ КОПИРОВАНИИ ===
  useEffect(() => {
    if (!isCopyMode || !copyId || copyDataLoadedRef.current) return;

    const loadCopyData = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/auctions/${copyId}`);
        const a = res.data;

        setFormData({
          sellerId: parseInt(localStorage.getItem('userId')),
          brandId: a.brand?.id ? String(a.brand.id) : '',
          modelId: a.model?.id ? String(a.model.id) : '',
          year: a.year ?? '',
          mileage: a.mileage != null ? String(a.mileage) : '',
          transmissionId: a.transmission?.id ? String(a.transmission.id) : '',
          fuelTypeId: a.fuelType?.id ? String(a.fuelType.id) : '',
          cityId: a.city?.id ? String(a.city.id) : '',
          description: a.description ?? '',
          startingPrice: a.startingPrice != null ? String(a.startingPrice) : '',
          minBidStep: a.minBidStep != null ? String(a.minBidStep) : '100',
          endTime: '',
          vin: a.vin ?? ''
        });

        if (a.brand?.id) setSelectedBrand(String(a.brand.id));
        if (a.city?.region?.id) setSelectedRegion(String(a.city.region.id));

        if (a.imageUrls && a.imageUrls.length > 0) {
          setImageUrls(a.imageUrls);
        }

        copyDataLoadedRef.current = true;
      } catch (err) {
        console.error("Ошибка копирования лота", err);
        addToast("Не удалось загрузить данные для копирования", 'error');
      }
    };
    loadCopyData();
  }, [isCopyMode, copyId]);

  // === Загрузка моделей при изменении бренда ===
  useEffect(() => {
    if (selectedBrand) {
      axios.get(`http://localhost:8080/api/models/by-brand?brandId=${selectedBrand}`)
          .then(r => setModels(r.data))
          .catch(() => setModels([]));
    } else {
      setModels([]);
      if (formData.modelId) {
        setFormData(prev => ({ ...prev, modelId: '' }));
      }
    }
  }, [selectedBrand]);

  // === Загрузка городов при изменении региона ===
  useEffect(() => {
    if (selectedRegion) {
      axios.get(`http://localhost:8080/api/cities/by-region?regionId=${selectedRegion}`)
          .then(r => setCities(r.data))
          .catch(() => setCities([]));
    } else {
      setCities([]);
      if (formData.cityId) {
        setFormData(prev => ({ ...prev, cityId: '' }));
      }
    }
  }, [selectedRegion]);

  // === Загрузка данных при редактировании ===
  useEffect(() => {
    const loadEditData = async () => {
      if (!isEditMode || !editId) return;
      setIsEditModeLoading(true);
      try {
        const res = await axios.get(`http://localhost:8080/api/auctions/${editId}`);
        const a = res.data;
        if (a.seller?.id !== parseInt(localStorage.getItem('userId'))) {
          addToast('Вы не можете редактировать этот лот', 'error');
          setIsEditModeLoading(false); return;
        }
        if (a.status !== 'PENDING' && a.status !== 'ACTIVE') {
          addToast('Редактирование доступно только для лотов на модерации или активных', 'error');
          setIsEditModeLoading(false); return;
        }
        if (a.hasBids) {
          addToast('Нельзя редактировать лот, на который уже есть ставки', 'error');
          setIsEditModeLoading(false); return;
        }

        setFormData({
          sellerId: a.seller?.id ?? null,
          brandId: a.brand?.id != null ? String(a.brand.id) : '',
          modelId: a.model?.id != null ? String(a.model.id) : '',
          year: a.year ?? '',
          mileage: a.mileage != null ? String(a.mileage) : '',
          transmissionId: a.transmission?.id != null ? String(a.transmission.id) : '',
          fuelTypeId: a.fuelType?.id != null ? String(a.fuelType.id) : '',
          cityId: a.city?.id != null ? String(a.city.id) : '',
          description: a.description ?? '',
          startingPrice: a.startingPrice != null ? String(a.startingPrice) : '',
          minBidStep: a.minBidStep != null ? String(a.minBidStep) : '100',
          endTime: a.endTime ? a.endTime.slice(0, 16) : '',
          vin: a.vin ?? ''
        });

        if (a.brand?.id) setSelectedBrand(String(a.brand.id));
        if (a.city?.region?.id) setSelectedRegion(String(a.city.region.id));

        if (a.imageUrls && a.imageUrls.length > 0) {
          setImageUrls(a.imageUrls);
          setFiles([]);
        } else {
          setImageUrls([]);
        }
      } catch (err) {
        console.error("Ошибка загрузки лота", err);
        addToast("Не удалось загрузить данные лота", 'error');
        navigate('/profile');
      } finally {
        setIsEditModeLoading(false);
      }
    };
    loadEditData();
  }, [isEditMode, editId, navigate]);

  const updateFormState = (name, value) => {
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleChange = e => {
    const { name, value, tagName } = e.target;
    updateFormState(name, value);

    if (tagName === 'TEXTAREA') {
      const textarea = e.target;
      textarea.style.height = 'auto'; // Сбрасываем высоту
      textarea.style.height = `${textarea.scrollHeight}px`; // Устанавливаем по содержимому
    }
  };

  const handleNumericChange = e => {
    const { name, value } = e.target;
    if (name === 'mileage') {
      updateFormState(name, value.replace(/\D/g, ''));
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
      }
    }
  };

  const removeFile = i => {
    setFiles(p => p.filter((_, idx) => idx !== i));
  };

  const removeExistingImage = (indexToRemove) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (mainImageIndex === indexToRemove) setMainImageIndex(0);
    else if (mainImageIndex > indexToRemove) setMainImageIndex(prev => prev - 1);
  };

  const setAsMain = (index) => {
    setMainImageIndex(index);
  };

  // === ОТКРЫТИЕ МОДАЛКИ ПОДТВЕРЖДЕНИЯ ОЧИСТКИ ===
  const openClearConfirmModal = () => {
    setConfirmClearModal(true);
  };

  // === ЗАКРЫТИЕ МОДАЛКИ ===
  const closeClearConfirmModal = () => {
    setConfirmClearModal(false);
  };

  // === ОЧИСТКА ЧЕРНОВИКА ===
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData({
      sellerId: parseInt(localStorage.getItem('userId') || '0'),
      brandId: '',
      modelId: '',
      year: '',
      mileage: '',
      transmissionId: '',
      fuelTypeId: '',
      cityId: '',
      description: '',
      startingPrice: '',
      minBidStep: '100',
      endTime: '',
      vin: ''
    });
    setSelectedBrand('');
    setSelectedRegion('');
    setImageUrls([]);
    setFiles([]);
    setMainImageIndex(0);
    addToast('🗑️ Форма очищена', 'success');
    closeClearConfirmModal();
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.sellerId) { addToast('Войдите в аккаунт', 'error'); return; }

    const newErrors = {};
    if (imageUrls.length + files.length === 0) {
      newErrors.files = 'Добавьте хотя бы одно фото';
    }
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
      addToast(Object.values(newErrors).join('. '), 'error');
      return;
    }
    if (formData.vin && formData.vin.length !== 17) {
      addToast('VIN должен содержать ровно 17 символов', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let newUploadedUrls = [];
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const fd = new FormData();
          fd.append('file', files[i]);
          const res = await axios.post('http://localhost:8080/api/files/upload', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          newUploadedUrls.push(res.data.url);
        }
      }

      const finalImageUrls = [...imageUrls, ...newUploadedUrls];

      if (mainImageIndex >= 0 && mainImageIndex < finalImageUrls.length && mainImageIndex !== 0) {
        const main = finalImageUrls.splice(mainImageIndex, 1)[0];
        finalImageUrls.unshift(main);
      }

      const cleanPayload = (data) => {
        const cleaned = { ...data };
        ['year', 'mileage', 'transmissionId', 'fuelTypeId', 'cityId', 'brandId', 'modelId'].forEach(key => {
          const val = cleaned[key];
          if (val === '' || val === null || val === undefined) {
            cleaned[key] = null;
          } else {
            const num = Number(val);
            cleaned[key] = !isNaN(num) ? num : val;
          }
        });
        if (cleaned.startingPrice === '') cleaned.startingPrice = null;
        else if (cleaned.startingPrice !== null) cleaned.startingPrice = parseFloat(cleaned.startingPrice);
        if (cleaned.minBidStep === '') cleaned.minBidStep = null;
        else if (cleaned.minBidStep !== null) cleaned.minBidStep = parseFloat(cleaned.minBidStep);
        return cleaned;
      };

      const payload = cleanPayload({ ...formData, regionId: selectedRegion ? Number(selectedRegion) : null, imageUrls: finalImageUrls });

      if (isEditMode) {
        await axios.put(`http://localhost:8080/api/auctions/${editId}`, payload, {
          params: { userId: formData.sellerId }
        });
        addToast('✅ Лот успешно обновлён!', 'success');
      } else {
        await axios.post('http://localhost:8080/api/auctions', payload);
        localStorage.removeItem(DRAFT_KEY);

        if (copyDataLoadedRef.current && copyId) {
          try {
            await axios.delete(`http://localhost:8080/api/auctions/${copyId}`, {
              params: { userId: formData.sellerId }
            });
          } catch (e) {
            console.error('Не удалось удалить исходный лот:', e);
          }
        }
        addToast('✅ Лот отправлен на модерацию!', 'success');
      }
      setTimeout(() => { navigate('/profile'); }, 2000);

    } catch (err) {
      console.error('Ошибка при сохранении:', err.response?.data || err.message);
      addToast('Ошибка: ' + (err.response?.data || err.message), 'error');
      setIsSubmitting(false);
    }
  };

  const formatSpaces = v => {
    if (!v) return '';
    if (v.indexOf('.') === -1) return parseInt(v).toLocaleString('ru-RU') || v;
    const parts = v.split('.');
    return (parseInt(parts[0]) || 0).toLocaleString('ru-RU') + (parts[1] !== undefined ? ',' + parts[1] : '');
  };

  let pageTitle = 'Выставить автомобиль на аукцион';
  let pageEyebrow = 'Новый лот';
  if (isEditMode) {
    pageTitle = 'Редактирование лота';
    pageEyebrow = 'Редактирование';
  } else if (isCopyMode) {
    pageTitle = 'Выставить повторно';
    pageEyebrow = 'Копирование лота';
  }

  if ((isEditMode || isCopyMode) && isEditModeLoading) {
    return (
        <div className="ca">
          <div className="ca-hero"><div className="ca-container"><h1 className="ca-title">Загрузка...</h1></div></div>
          <main className="ca-container ca-body"><p style={{ textAlign: 'center' }}>Загружаем данные лота...</p></main>
        </div>
    );
  }

  return (
      <div className="ca">
        {/* === TOAST УВЕДОМЛЕНИЯ === */}
        <div className="ca-toasts">
          {toasts.map(toast => (
              <div key={toast.id} className={`ca-toast ca-toast--${toast.type}`}>
                <span>{toast.message}</span>
                <button className="ca-toast__close" onClick={() => removeToast(toast.id)}>×</button>
              </div>
          ))}
        </div>

        <div className="ca-hero">
          <div className="ca-container">
            <p className="ca-eyebrow">{pageEyebrow}</p>
            <h1 className="ca-title">{pageTitle}</h1>
          </div>
        </div>

        <main className="ca-container ca-body">
          <div className="ca-form-wrap">
            <form onSubmit={handleSubmit} className="ca-form">
              <section className="ca-section">
                <p className="ca-section__title">Автомобиль</p>
                <div className="ca-grid ca-grid--2">
                  <Field label="Марка" required>
                    <select
                        className="ca-select"
                        name="brandId"
                        value={formData.brandId || ''}
                        onChange={e => handleSelectChangeWithTrigger(e, setSelectedBrand)}
                        disabled={isEditMode}
                        key={`brand-select-${formData.brandId}`}
                    >
                      <option value="">Выберите марку...</option>
                      {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Модель" required>
                    <select
                        className="ca-select"
                        name="modelId"
                        value={formData.modelId || ''}
                        onChange={handleChange}
                        disabled={!selectedBrand || isEditMode}
                        key={`model-select-${selectedBrand}-${formData.modelId}`}
                    >
                      <option value="">Выберите модель...</option>
                      {models.map(m => (
                          <option key={m.id} value={String(m.id)}>
                            {m.name}
                          </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Год выпуска" required>
                    <select className="ca-select" name="year" value={formData.year || ''} onChange={handleChange} disabled={isEditMode}>
                      <option value="">Выберите год...</option>
                      {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </Field>
                  <Field label="VIN-код (17 символов)">
                    <input className="ca-input" type="text" name="vin" placeholder="XTA210930Y2764409" maxLength="17" value={formData.vin || ''} onChange={e => updateFormState('vin', e.target.value.toUpperCase())} disabled={isEditMode} />
                  </Field>
                  <Field label="Пробег (км)" required>
                    <input className="ca-input" type="text" inputMode="numeric" name="mileage" placeholder="50 000" value={formatSpaces(formData.mileage)} onChange={handleNumericChange} />
                  </Field>
                  <Field label="КПП" required>
                    <select className="ca-select" name="transmissionId" value={formData.transmissionId || ''} onChange={handleChange}>
                      <option value="">Выберите КПП...</option>
                      {transmissions.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Тип топлива" required>
                    <select className="ca-select" name="fuelTypeId" value={formData.fuelTypeId || ''} onChange={handleChange}>
                      <option value="">Выберите топливо...</option>
                      {fuelTypes.map(f => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
                    </select>
                  </Field>
                </div>
              </section>

              <section className="ca-section">
                <p className="ca-section__title">Местоположение</p>
                <div className="ca-grid ca-grid--2">
                  <Field label="Область" required>
                    <select className="ca-select" name="regionId" value={selectedRegion || ''} onChange={e => handleSelectChangeWithTrigger(e, setSelectedRegion)} disabled={isEditMode}>
                      <option value="">Выберите область...</option>
                      {regions.map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Город" required>
                    <select className="ca-select" name="cityId" value={formData.cityId || ''} onChange={handleChange} disabled={!selectedRegion || isEditMode}
                            key={`city-select-${selectedRegion}-${formData.cityId}`}
                    >
                      <option value="">Выберите город...</option>
                      {cities.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                  </Field>
                </div>
              </section>

              <section className="ca-section">
                <p className="ca-section__title">Параметры торгов</p>
                <div className="ca-grid ca-grid--3">
                  <Field label={<>Начальная цена (<BynIcon />)</>} required>
                    <input className="ca-input" type="text" inputMode="decimal" name="startingPrice" placeholder="10 000" value={formatSpaces(formData.startingPrice)} onChange={handleNumericChange} />
                  </Field>
                  <Field label={<>Минимальный шаг (<BynIcon />)</>} required>
                    <input className="ca-input" type="text" inputMode="decimal" name="minBidStep" placeholder="100" value={formatSpaces(formData.minBidStep)} onChange={handleNumericChange} />
                  </Field>
                  <Field label="Дата и время окончания" required>
                    <input className="ca-input" type="datetime-local" name="endTime" value={formData.endTime || ''} onChange={handleChange} min={minDateTime} max="2099-12-31T23:59" />
                  </Field>
                </div>
              </section>

              <section className="ca-section">
                <p className="ca-section__title">Описание</p>
                <Field label="Подробно опишите состояние автомобиля" required>
                  <textarea className="ca-textarea" name="description" rows="4" placeholder="Состояние кузова, салона..." value={formData.description || ''} onChange={handleChange} />
                </Field>
              </section>

              <section className="ca-section">
                <p className="ca-section__title">Фотографии</p>
                <p className="ca-section__hint">Кликните на фото, чтобы сделать его главным. <span style={{color:'red'}}>*</span></p>

                {imageUrls.length > 0 && (
                    <div className="ca-preview" style={{ marginBottom: '1rem' }}>
                      {imageUrls.map((url, i) => (
                          <div key={`existing-${i}`} className={`ca-thumb${i === mainImageIndex ? ' ca-thumb--main' : ''}`} onClick={() => setAsMain(i)}>
                            <img src={url} alt="" />
                            {i === mainImageIndex && <span className="ca-thumb__badge">Главное</span>}
                            <button type="button" className="ca-thumb__remove" onClick={(e) => { e.stopPropagation(); removeExistingImage(i); }}>×</button>
                          </div>
                      ))}
                    </div>
                )}

                {files.length > 0 && (
                    <div className="ca-preview">
                      {files.map((file, i) => (
                          <div key={`file-${i}`} className={`ca-thumb${(i + imageUrls.length) === mainImageIndex ? ' ca-thumb--main' : ''}`} onClick={() => setAsMain(i + imageUrls.length)}>
                            <img src={URL.createObjectURL(file)} alt="" />
                            {(i + imageUrls.length) === mainImageIndex && <span className="ca-thumb__badge">Главное</span>}
                            <button type="button" className="ca-thumb__remove" onClick={e => { e.stopPropagation(); removeFile(i); }}>×</button>
                          </div>
                      ))}
                    </div>
                )}

                <div className="ca-dropzone" onClick={() => document.getElementById('ca-file-input').click()}>
                  <span className="ca-dropzone__icon">+</span>
                  <p className="ca-dropzone__text">Нажмите для выбора фотографий</p>
                  <p className="ca-dropzone__hint">JPG · PNG · WEBP</p>
                  <input id="ca-file-input" type="file" onChange={handleFileChange} accept="image/*" multiple style={{ display: 'none' }} />
                </div>
              </section>

              <div className="ca-submit">
                <div className="ca-submit__actions">
                  {isNormalMode && (
                      <button
                          type="button"
                          className="ca-btn ca-btn--ghost ca-btn--lg"
                          onClick={openClearConfirmModal}
                      >
                        🗑️ Очистить
                      </button>
                  )}

                  <button type="submit" className={`ca-btn ca-btn--gold ca-btn--lg ca-btn--full${isSubmitting ? ' ca-btn--disabled' : ''}`} disabled={isSubmitting}>
                    {isSubmitting ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Опубликовать лот')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>

        {/* === МОДАЛКА ПОДТВЕРЖДЕНИЯ ОЧИСТКИ === */}
        {confirmClearModal && (
            <div className="ca-modal-overlay" onClick={closeClearConfirmModal}>
              <div className="ca-modal" onClick={e => e.stopPropagation()}>
                <h3 className="ca-modal__title">Подтвердите очистку</h3>
                <p className="ca-modal__text">
                  Вы уверены, что хотите очистить все введённые данные?<br />
                  Это действие нельзя отменить.
                </p>
                <div className="ca-modal__actions">
                  <button
                      className="ca-btn ca-btn--ghost"
                      onClick={closeClearConfirmModal}
                  >
                    Отмена
                  </button>
                  <button
                      className="ca-btn ca-btn--danger"
                      onClick={clearDraft}
                  >
                    🗑️ Очистить форму
                  </button>
                </div>
              </div>
            </div>
        )}

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
                <li><Link to="/rules" className="ca-footer__rules-link">Правила платформы</Link></li>
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
            <p>© {new Date().getFullYear()} BiDrive. Дипломный проект.</p>
          </div>
        </footer>
      </div>
  );
}

export default CreateAuction;