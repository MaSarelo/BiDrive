import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './CreateAuction.css';

function CreateAuction() {
  // Справочники
  const [brands, setBrands] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);

  // Данные формы
  const [formData, setFormData] = useState({
    sellerId: 2, // Иван
    brandId: '',
    modelId: '',
    year: '',
    mileage: '',
    transmissionId: '', // Теперь ID, а не строка!
    fuelTypeId: '',     // Теперь ID!
    description: '',
    startingPrice: ''
  });

  // Фото
  const [file, setFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Загрузка справочников при старте
  useEffect(() => {
    axios.get('http://localhost:8080/api/brands')
      .then(res => setBrands(res.data));

    axios.get('http://localhost:8080/api/transmissions')
      .then(res => setTransmissions(res.data));

    axios.get('http://localhost:8080/api/fuel-types')
      .then(res => setFuelTypes(res.data));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await axios.post('http://localhost:8080/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedImageUrl(res.data.url); // Сохраняем ссылку (/uploads/xyz.jpg)
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

    try {
      // Конвертируем цену в число
      const price = parseFloat(formData.startingPrice);

      await axios.post('http://localhost:8080/api/auctions', null, {
        params: {
          ...formData,
          transmissionId: parseInt(formData.transmissionId), // Передаем ID
          fuelTypeId: parseInt(formData.fuelTypeId),     // Передаем ID
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
    }
  };

  return (
    <div className="create-container">
      <Link to="/" className="back-btn">← Вернуться в каталог</Link>

      <h1>Выставить автомобиль на аукцион</h1>

      <form onSubmit={handleSubmit} className="create-form">

        {/* Левая колонка: Основное */}
        <div className="column">
            <label>Марка:</label>
            <select name="brandId" value={formData.brandId} onChange={handleChange} required>
                <option value="">Выберите марку...</option>
                {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
            </select>

            <input
                type="number"
                name="modelId"
                placeholder="ID модели (число)"
                value={formData.modelId}
                onChange={handleChange} required
            />

            <label>Год выпуска:</label>
            <input
                type="number" name="year"
                placeholder="2022"
                value={formData.year} onChange={handleChange} required
            />

            <label>Пробег (км):</label>
            <input
                type="number" name="mileage"
                placeholder="50000"
                value={formData.mileage} onChange={handleChange} required
            />
        </div>

        {/* Правая колонка: Фото и Характеристики */}
        <div className="column">
            {/* Блок Фото */}
            <div className="photo-block">
                <label>Главное фото:</label>
                <input type="file" onChange={handleFileChange} accept="image/*" />
                {!uploadedImageUrl && (
                    <button type="button" onClick={handleUpload} className="upload-btn">
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

            {/* Характеристики из БД */}
            <label>КПП:</label>
            <select name="transmissionId" value={formData.transmissionId} onChange={handleChange} required>
                <option value="">Выберите КПП...</option>
                {transmissions.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>

            <label>Тип топлива:</label>
            <select name="fuelTypeId" value={formData.fuelTypeId} onChange={handleChange} required>
                <option value="">Выберите топливо...</option>
                {fuelTypes.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                ))}
            </select>

            <label>Начальная цена ($):</label>
            <input
                type="number" name="startingPrice"
                placeholder="10000"
                value={formData.startingPrice} onChange={handleChange} required
            />
        </div>

        <div className="full-width">
            <label>Описание:</label>
            <textarea
                name="description"
                rows="5"
                placeholder="Состояние, история, комплектация..."
                value={formData.description} onChange={handleChange} required
            />
        </div>

        <div className="full-width">
            <button type="submit" className="submit-btn">Создать аукцион</button>
            {message && <p className="message">{message}</p>}
        </div>

      </form>
    </div>
  );
}

export default CreateAuction;