import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './CreateAuction.css';

function CreateAuction() {
  // === ОСНОВНЫЕ ДАННЫЕ ===
  const [formData, setFormData] = useState({
    sellerId: 2, // Иван (хардкод для теста, можно менять)
    brandId: '',
    modelId: '',
    year: '',
    mileage: '',
    transmissionId: '',
    fuelTypeId: '',
    cityId: '',
    description: '',
    startingPrice: ''
  });

  // === СПРАВОЧНИКИ И ФИЛЬТРЫ ===
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);

  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // === ФОТО ===
  const [file, setFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // === ЗАЩИТА ОТ ДВОЙНОГО КЛИКА ===
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загрузка справочников при старте
  useEffect(() => {
    // Бренды
    axios.get('http://localhost:8080/api/brands')
      .then(res => setBrands(res.data));

    // Области
    axios.get('http://localhost:8080/api/regions')
      .then(res => setRegions(res.data));

    // КПП и Топливо
    axios.get('http://localhost:8080/api/transmissions')
      .then(res => setTransmissions(res.data));

    axios.get('http://localhost:8080/api/fuel-types')
      .then(res => setFuelTypes(res.data));
  }, []);

  // Загрузка Моделей (при смене Бренда)
  useEffect(() => {
    if (selectedBrand) {
      axios.get(`http://localhost:8080/api/models/by-brand?brandId=${selectedBrand}`)
        .then(res => setModels(res.data))
        .catch(err => console.error('Ошибка моделей:', err));
    } else {
      setModels([]);
    }
  }, [selectedBrand]);

  // Загрузка Городов (при смене Области)
  useEffect(() => {
    if (selectedRegion) {
      axios.get(`http://localhost:8080/api/cities/by-region?regionId=${selectedRegion}`)
        .then(res => setCities(res.data))
        .catch(err => console.error('Ошибка городов:', err));
    } else {
      setCities([]);
    }
  }, [selectedRegion]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBrandChange = (e) => {
    const newBrandId = e.target.value;
    setSelectedBrand(newBrandId);
    setFormData({ ...formData, brandId: newBrandId, modelId: '' });
  };

  const handleRegionChange = (e) => {
    const newRegionId = e.target.value;
    setSelectedRegion(newRegionId);
    setFormData({ ...formData, cityId: '' });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Загрузка файла
  const handleUpload = async () => {
    if (!file) {
      setMessage('❌ Выберите файл фото!');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    setUploading(true);
    try {
      const res = await axios.post('http://localhost:8080/api/files/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedImageUrl(res.data.url);
      setMessage('✅ Фото загружено! Можно создавать лот.');
      setUploading(false);
    } catch (error) {
      console.error(error);
      setMessage('❌ Ошибка загрузки фото.');
      setUploading(false);
    }
  };

  // Создание лота
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!uploadedImageUrl) {
      setMessage('❌ Сначала загрузите фото автомобиля!');
      return;
    }

    // Блокируем кнопку
    setIsSubmitting(true);
    setMessage('⏳ Создание лота...');

    try {
      const price = parseFloat(formData.startingPrice);

      await axios.post('http://localhost:8080/api/auctions', null, {
        params: {
          ...formData,
          transmissionId: parseInt(formData.transmissionId),
          fuelTypeId: parseInt(formData.fuelTypeId),
          cityId: formData.cityId ? parseInt(formData.cityId) : null,
          startingPrice: price,
          mainImageUrl: uploadedImageUrl
        }
      });

      setMessage('✅ Аукцион успешно создан! Возвращаемся...');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error(error);
      setMessage('❌ Ошибка при создании лота.');
      setIsSubmitting(false); // Разблокируем кнопку при ошибке
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
            <select name="brandId" value={formData.brandId} onChange={handleBrandChange} required>
                <option value="">Выберите марку...</option>
                {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
            </select>

            <label>Модель:</label>
            <select name="modelId" value={formData.modelId} onChange={handleChange} required disabled={!selectedBrand}>
                <option value="">Выберите модель...</option>
                {models.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                ))}
            </select>

            <label>Область:</label>
            <select name="region" value={selectedRegion} onChange={handleRegionChange} required>
                <option value="">Выберите область...</option>
                {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                ))}
            </select>

            {selectedRegion && (
                <>
                    <label>Город:</label>
                    <select name="cityId" value={formData.cityId} onChange={handleChange} required>
                        <option value="">Выберите город...</option>
                        {cities.map(city => (
                            <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
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
            <div className="photo-block">
                <label>Главное фото:</label>
                <input type="file" onChange={handleFileChange} accept="image/*" disabled={isSubmitting} />
                {!uploadedImageUrl && (
                    <button type="button" onClick={handleUpload} className="upload-btn" disabled={uploading}>
                        {uploading ? 'Загрузка...' : 'Загрузить фото'}
                    </button>
                )}
                {uploadedImageUrl && (
                    <div className="preview">
                        <p className="success-text">Фото загружено!</p>
                        <img src={`http://localhost:8080${uploadedImageUrl}`} alt="Preview" />
                    </div>
                )}
            </div>

            <label>КПП:</label>
            <select name="transmissionId" value={formData.transmissionId} onChange={handleChange} required disabled={isSubmitting}>
                <option value="">Выберите КПП...</option>
                {transmissions.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>

            <label>Тип топлива:</label>
            <select name="fuelTypeId" value={formData.fuelTypeId} onChange={handleChange} required disabled={isSubmitting}>
                <option value="">Выберите топливо...</option>
                {fuelTypes.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                ))}
            </select>

            <label>Начальная цена ($):</label>
            <input type="number" name="startingPrice" placeholder="10000" value={formData.startingPrice} onChange={handleChange} required disabled={isSubmitting} />
        </div>

        <div className="full-width">
            <label>Описание:</label>
            <textarea name="description" rows="5" placeholder="Состояние, история, комплектация..." value={formData.description} onChange={handleChange} required disabled={isSubmitting} />
        </div>

        <div className="full-width">
            {/* Кнопка заблокирована, если isSubmitting = true */}
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Создание...' : 'Создать аукцион'}
            </button>
            {message && <p className="message">{message}</p>}
        </div>

      </form>
    </div>
  );
}

export default CreateAuction;