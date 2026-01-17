import { useState, useEffect, useParams } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AuctionDetails.css';

function AuctionDetails() {
  // Получаем ID аукциона из URL
  const { id } = useParams();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);

  // Состояние для формы ставки
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');

  // Загрузка данных лота
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

  // Обработка нажатия "Сделать ставку"
  const handlePlaceBid = () => {
    if (!bidAmount) {
      setMessage('❌ Введите сумму ставки!');
      return;
    }

    // Имитация текущего пользователя (ID = 3, Мария)
    const currentUserId = 3;

    axios.post('http://localhost:8080/api/bids', null, {
      params: {
        auctionId: auction.id,
        userId: currentUserId,
        amount: bidAmount
      }
    })
    .then(response => {
      setMessage('✅ Ставка принята!');
      // Через секунду перезагружаем данные лота, чтобы обновить цену
      setTimeout(() => {
          axios.get(`http://localhost:8080/api/auctions/${id}`)
            .then(res => setAuction(res.data));
      }, 1000);
      // Скрываем сообщение через 3 сек
      setTimeout(() => setMessage(''), 3000);
    })
    .catch(error => {
      setMessage('❌ Ошибка: ' + (error.response?.data || 'Скорее всего, ставка слишком низкая'));
    });
  };

  if (loading) return <div className="loading">Загрузка лота...</div>;

  if (!auction) return <div className="loading">Лот не найден.</div>;

  return (
    <div className="details-container">
        <Link to="/" className="back-btn">← Вернуться в каталог</Link>

        <div className="details-content">
            {/* Левая колонка: Информация о машине */}
            <div className="details-info">
                <h1>{auction.brand.name} {auction.model.name}</h1>
                <p className="status-badge">Статус: {auction.status}</p>
                <hr />

                {/* Объединенный блок характеристик */}
                <div className="data-grid">
                    <p><strong>Год:</strong> {auction.year}</p>
                    <p><strong>Пробег:</strong> {auction.mileage} км</p>
                    <p><strong>КПП:</strong> {auction.transmission || 'Не указано'}</p>
                    <p><strong>Топливо:</strong> {auction.fuelType || 'Не указано'}</p>
                </div>

                <div className="description">
                    <h3>Описание:</h3>
                    <p>{auction.description || 'Нет описания'}</p>
                </div>
            </div>

            {/* Правая колонка: Торги и цена */}
            <div className="details-sidebar">
                <div className="price-card">
                    <h2>Текущая цена</h2>
                    <p className="big-price">{auction.currentPrice} $</p>
                    <p>Минимальный шаг: {auction.minBidStep} $</p>

                    <div className="bid-form">
                        <label>Ваша ставка:</label>
                        <input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="bid-input"
                            placeholder="Введите сумму..."
                        />
                        <button onClick={handlePlaceBid} className="bid-submit-btn">
                            Сделать ставку
                        </button>
                        {message && <p className="message-text">{message}</p>}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

export default AuctionDetails;