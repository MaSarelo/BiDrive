import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './AuctionDetails.css';

function AuctionDetails() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Ставки
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setCurrentUser({ email: storedEmail, id: parseInt(localStorage.getItem('userId')) });
    }
  }, []);

  useEffect(() => {
    axios.get(`http://localhost:8080/api/auctions/${id}`)
      .then(response => {
        setAuction(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Ошибка загрузки:', error);
        setLoading(false);
      });
  }, [id]);

  const handlePlaceBid = () => {
    if (!bidAmount) {
      setMessage('❌ Введите сумму ставки!');
      return;
    }

    const currentUserId = parseInt(localStorage.getItem('userId')) || 3;

    axios.post('http://localhost:8080/api/bids', null, {
      params: {
        auctionId: auction.id,
        userId: currentUserId,
        amount: bidAmount
      }
    })
    .then(response => {
      setMessage('✅ Ставка принята!');
      setTimeout(() => {
          axios.get(`http://localhost:8080/api/auctions/${id}`)
            .then(res => setAuction(res.data));
      }, 1000);
      setTimeout(() => setMessage(''), 3000);
    })
    .catch(error => {
      setMessage('❌ Ошибка: ' + (error.response?.data || 'Скорее всего, ставка слишком низкая'));
    });
  };

  // Функция перевода статусов
  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return '🟢 Активен';
      case 'DRAFT': return '📝 Черновик';
      case 'PENDING': return '⏳ На проверке';
      case 'FINISHED': return '🏁 Завершен';
      case 'APPROVED': return '✅ Одобрен';
      default: return status;
    }
  };

  if (loading) return <div className="loading">Загрузка лота...</div>;
  if (!auction) return <div className="loading">Лот не найден.</div>;

  // Определяем главное изображение и галерею
  // Приоритет: Основное фото из таблицы -> Первое изображение из списка -> Заглушка
  let mainImg = null;
  let thumbs = [];

  if (auction.images && auction.images.length > 0) {
    const mainImgObj = auction.images.find(img => img.isMain);
    if (mainImgObj) {
      mainImg = mainImgObj;
      thumbs = auction.images.filter(img => img.id !== mainImgObj.id);
    } else {
      // Если нет флага isMain, берем первое как главное, остальные как превью
      mainImg = auction.images[0];
      thumbs = auction.images.slice(1);
    }
  } else if (auction.mainImageUrl) {
      // Если таблица картинок пуста, используем строку
      mainImg = { imageUrl: auction.mainImageUrl };
  }

  return (
    <div className="details-container">
      <Link to="/" className="back-btn">← Вернуться в каталог</Link>

      <div className="details-content">
        {/* ЛЕВАЯ КОЛОНКА: Информация и Галерея */}
        <div className="details-info">
            <h1>{auction.brand?.name} {auction.model?.name}</h1>

            {/* Локация */}
            <p className="location-text">
              📍 {auction.city?.name}, {auction.city?.region?.name}
            </p>

            <p className="status-badge">{getStatusText(auction.status)}</p>
            <hr />

            {/* Галерея */}
            <div className="gallery">
                <div className="main-photo-wrapper">
                    {mainImg ? (
                        <img src={`http://localhost:8080${mainImg.imageUrl}`} alt="Main" />
                    ) : (
                        <div className="no-image-placeholder">Фото не загружено</div>
                    )}
                </div>
                <div className="thumbnails-grid">
                    {thumbs.map((img) => (
                        <div key={img.id} className="thumbnail" onClick={() => {/* Можно сделать кликабельным для увеличения */}}>
                            <img src={`http://localhost:8080${img.imageUrl}`} alt="Thumb" />
                        </div>
                    ))}
                    {/* Если превьюшек мало, добавляем заглушки, чтобы сетка не ломалась */}
                    {thumbs.length === 0 && !mainImg && Array.from({ length: 5 }).map((_, i) => (
                        <div key={`placeholder-${i}`} className="thumbnail placeholder">
                            <div style={{background:'#eee', width:'100%', height:'100%'}}></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Характеристики */}
            <div className="data-grid">
                <div>
                    <span>Год выпуска</span>
                    <strong>{auction.year}</strong>
                </div>
                <div>
                    <span>Пробег</span>
                    <strong>{auction.mileage} км</strong>
                </div>
                <div>
                    <span>КПП</span>
                    <strong>{auction.transmission?.name || 'Не указано'}</strong>
                </div>
                <div>
                    <span>Топливо</span>
                    <strong>{auction.fuelType?.name || 'Не указано'}</strong>
                </div>
            </div>

            {/* Продавец */}
            <div className="seller-card">
                <h4>Продавец</h4>
                <div className="seller-info">
                    {auction.seller?.firstName} {auction.seller?.lastName}
                </div>
                {auction.status === 'FINISHED' && auction.winner && currentUser && (
                    <div className="seller-contact">
                        <span className="seller-email">📧 {auction.seller.email}</span>
                    </div>
                )}
            </div>

            {/* Описание */}
            <div className="description">
                <h3>Описание</h3>
                <p className="description-text">
                    {auction.description || 'Описание отсутствует.'}
                </p>
            </div>

            {/* История ставок */}
            {auction.bids && auction.bids.length > 0 && (
                <div className="bids-history">
                    <h3>История ставок</h3>
                    <ul className="bids-list">
                        {[...auction.bids].reverse().map((bid) => (
                            <li key={bid.id}>
                                <div>
                                    <strong>{bid.user?.firstName || 'Участник'}</strong>
                                    <span className="bid-time">{new Date(bid.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <span className="bid-amount">{bid.amount} $</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        {/* ПРАВАЯ КОЛОНКА: Торги */}
        <div className="details-sidebar">
            <div className="price-card">
                <h2>Текущая цена</h2>
                <div className="big-price">{auction.currentPrice} $</div>

                <div className="price-meta">
                    <div>
                        <span>Стартовая</span>
                        <strong>{auction.startingPrice} $</strong>
                    </div>
                    <div>
                        <span>Мин. шаг</span>
                        <strong>{auction.minBidStep} $</strong>
                    </div>
                </div>

                <div className="bid-form">
                    <label>Ваша ставка:</label>
                    <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="bid-input"
                        placeholder="Введите сумму..."
                    />
                    <button onClick={handlePlaceBid} className="bid-submit-btn" disabled={auction.status !== 'ACTIVE'}>
                        Сделать ставку
                    </button>
                    {message && <p className="message-text">{message}</p>}
                </div>
            </div>

            {/* Блок "Контакты" (показываем только если есть смысл, например, если активен или завершен и ты победитель) */}
            {auction.status === 'FINISHED' && auction.winner && currentUser && (
                 <div className="price-card">
                    <h3>🎉 Вы победили!</h3>
                    <div className="seller-card" style={{background: '#fff', border: '1px solid #eee'}}>
                        <p>Свяжитесь с продавцом:</p>
                        <div className="seller-info">{auction.seller.firstName} {auction.seller.lastName}</div>
                        <div className="seller-email">📧 {auction.seller.email}</div>
                    </div>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default AuctionDetails;