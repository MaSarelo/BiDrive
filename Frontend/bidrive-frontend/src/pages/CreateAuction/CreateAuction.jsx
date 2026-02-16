import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './CreateAuction.css';

function CreateAuction() {
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
    minBidStep: '100'
  });

  // Справочники
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // === ЛОГИКА ФОТО ===
  const [files, setFiles] = useState([]); // Файлы, которые выбрал юзер
  const [uploadedUrls, setUploadedUrls] = useState([]); // Ссылки, которые вернул сервер
  const [mainImageIndex, setMainImageIndex] = useState(0); // Индекс главного фото

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Получаем ID пользователя
  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) setFormData(prev => ({...prev, sellerId: parseInt(id)}));
  }, []);

  // Загрузка справочников
  useEffect(() => {
    axios.get('http://localhost:8080/api/brands').then(res => setBrands(res.data)).catch(err => console.error(err));
    axios.get('http://localhost:8080/api/regions').then(res => setRegions(res.data)).catch(err => console.error(err));
    axios.get('http://localhost:8080/api/transmissions').then(res => setTransmissions(res.data)).catch(err => console.error(err));
    axios.get('http://localhost:8080/api/fuel-types').then(res => setFuelTypes(res.data)).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      axios.get(`http://localhost:8080/api/models/by-brand?brandId=${selectedBrand}`)
        .then(res => setModels(res.data))
        .catch(() => setModels([]));
    } else {
      setModels([]);
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedRegion) {
      axios.get(`http://localhost:8080/api/cities/by-region?regionId=${selectedRegion}`)
        .then(res => setCities(res.data))
        .catch(() => setCities([]));
    } else {
      setCities([]);
    }
  }, [selectedRegion]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // === ОБРАБОТКА ФАЙЛОВ ===

  // 1. Просто сохраняем файлы в стейт при выборе
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      setUploadedUrls([]); // Сбрасываем загруженные ссылки, если файлы изменились
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    // Если удаляем из загруженных, тоже надо убрать
    if (uploadedUrls.length > 0) {
        setUploadedUrls(uploadedUrls.filter((_, i) => i !== index));
    }
    if (mainImageIndex === index) setMainImageIndex(0);
  };

  const setMainPhoto = (index) => {
    setMainImageIndex(index);
  };

  // 2. Функция загрузки фото на сервер (по нажатию кнопки)
  const handleUploadFiles = async () => {
    if (files.length === 0) {
      setMessage('❌ Выберите файлы для загрузки!');
      return;
    }

    // Если уже загружено столько же, сколько выбрано, не загружаем повторно
    if (uploadedUrls.length === files.length) {
        setMessage('✅ Фото уже загружены!');
        return;
    }

    setUploading(true);
    setMessage('⏳ Загрузка фото на сервер...');
    const newUrls = [];

    try {
      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const res = await axios.post('http://localhost:8080/api/files/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newUrls.push(res.data.url);
      }

      setUploadedUrls(newUrls);
      setMessage('✅ Фото успешно загружены! Можно создавать лот.');
      setUploading(false);
    } catch (error) {
      console.error(error);
      setMessage('❌ Ошибка загрузки фото.');
      setUploading(false);
    }
  };

  // 3. Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Проверка: если фото не загружены на сервер
    if (uploadedUrls.length === 0) {
      setMessage('❌ Сначала нажмите кнопку "Загрузить фото"!');
      return;
    }

    if (uploadedUrls.length !== files.length) {
        setMessage('❌ Количество загруженных фото не совпадает с выбранными. Попробуйте загрузить снова.');
        return;
    }

    setIsSubmitting(true);
    setMessage('⏳ Создание лота...');

    try {
      // Сортируем: главное фото в начало
      const sortedUrls = [...uploadedUrls];
      if (mainImageIndex >= 0 && mainImageIndex < sortedUrls.length) {
          const mainImg = sortedUrls.splice(mainImageIndex, 1)[0];
          sortedUrls.unshift(mainImg);
      }

      const payload = {
        ...formData,
        imageUrls: sortedUrls
      };

      await axios.post('http://localhost:8080/api/auctions', payload);

      setMessage('✅ Аукцион успешно создан! Возвращаемся...');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error(error);
      setMessage('❌ Ошибка при создании лота: ' + (error.response?.data || ''));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-container">
      <Link to="/" className="back-btn">← Вернуться в каталог</Link>
      <h1>Выставить автомобиль на аукцион</h1>

      <form onSubmit={handleSubmit} className="create-form">
        {/* Левая колонка */}
        <div className="column">
            <label>Марка:</label>
            <select name="brandId" value={formData.brandId} onChange={(e) => { setSelectedBrand(e.target.value); handleChange(e); }} required>
                <option value="">Выберите марку...</option>
                {brands.map(brand => (<option key={brand.id} value={brand.id}>{brand.name}</option>))}
            </select>

            <label>Модель:</label>
            <select name="modelId" value={formData.modelId} onChange={handleChange} required disabled={!selectedBrand}>
                <option value="">Выберите модель...</option>
                {models.map(model => (<option key={model.id} value={model.id}>{model.name}</option>))}
            </select>

            <label>Область:</label>
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} required>
                <option value="">Выберите область...</option>
                {regions.map(region => (<option key={region.id} value={region.id}>{region.name}</option>))}
            </select>

            {selectedRegion && (
                <>
                    <label>Город:</label>
                    <select name="cityId" value={formData.cityId} onChange={handleChange} required>
                        <option value="">Выберите город...</option>
                        {cities.map(city => (<option key={city.id} value={city.id}>{city.name}</option>))}
                    </select>
                </>
            )}

            <label>Год выпуска:</label>
            <input type="number" name="year" placeholder="2022" value={formData.year} onChange={handleChange} required />

            <label>Пробег (км):</label>
            <input type="number" name="mileage" placeholder="50000" value={formData.mileage} onChange={handleChange} required />
        </div>

        {/* Правая колонка */}
        <div className="column">
            {/* БЛОК ГАЛЕРЕИ */}
            <div className="photo-block">
                <label>Фотографии:</label>

                {/* Кнопка выбора файлов */}
                <div className="upload-btn-wrapper">
                    <button type="button" className="upload-btn-custom" onClick={() => document.getElementById('file-input').click()}>
                        📁 Выбрать файлы
                    </button>
                    <input
                        id="file-input"
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        style={{display: 'none'}}
                    />
                </div>

                {/* Превью выбранных файлов */}
                <div className="preview-grid">
                    {files.map((file, index) => (
                        <div key={index} className={`preview-item ${index === mainImageIndex ? 'is-main' : ''}`}>
                            <img src={URL.createObjectURL(file)} alt="preview" onClick={() => setMainPhoto(index)} title="Сделать главной" />
                            <button type="button" onClick={() => removeFile(index)} className="delete-btn">×</button>
                            {index === mainImageIndex && <div className="main-label">Главное</div>}
                        </div>
                    ))}
                </div>

                {/* === КНОПКА ЗАГРУЗКИ НА СЕРВЕР === */}
                {files.length > 0 && (
                    <button
                        type="button"
                        onClick={handleUploadFiles}
                        className="upload-btn" // Используем старый класс стиля
                        disabled={uploading}
                        style={{marginTop: '10px', width: '100%'}}
                    >
                        {uploading ? 'Загрузка...' : '⬆️ Загрузить фото на сервер'}
                    </button>
                )}

                {files.length === 0 && <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>Выберите файлы, затем нажмите "Загрузить"</small>}
                {uploadedUrls.length > 0 && <small style={{ color: 'green', display: 'block', marginTop: '5px', fontWeight: 'bold' }}>✅ {uploadedUrls.length} фото успешно загружено!</small>}
            </div>

            <label>КПП:</label>
            <select name="transmissionId" value={formData.transmissionId} onChange={handleChange} required>
                <option value="">Выберите КПП...</option>
                {transmissions.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>

            <label>Тип топлива:</label>
            <select name="fuelTypeId" value={formData.fuelTypeId} onChange={handleChange} required>
                <option value="">Выберите топливо...</option>
                {fuelTypes.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>

            <label>Начальная цена ($):</label>
            <input type="number" name="startingPrice" placeholder="10000" value={formData.startingPrice} onChange={handleChange} required />

            <label>Минимальный шаг ставки ($):</label>
            <input type="number" name="minBidStep" placeholder="100" value={formData.minBidStep} onChange={handleChange} required />
        </div>

        <div className="full-width">
            <label>Описание:</label>
            <textarea name="description" rows="5" value={formData.description} onChange={handleChange} required />
        </div>

        <div className="full-width">
            <button type="submit" className="submit-btn" disabled={isSubmitting || uploading || uploadedUrls.length === 0}>
                {isSubmitting ? 'Создание...' : 'Создать аукцион'}
            </button>
            {message && <p className="message">{message}</p>}
        </div>
      </form>
    </div>
  );
}

export default CreateAuction;