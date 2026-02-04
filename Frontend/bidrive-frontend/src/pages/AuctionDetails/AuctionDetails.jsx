import { useState, useEffect, useParams } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AuctionDetails.css';

function AuctionDetails() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ставки
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');

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

  if (loading) return <div className="loading">Загрузка лота...</div>;
  if (!auction) return <div className="loading">Лот не найден.</div>;

  return (
    <div className="details-container">
        <Link to="/" className="back-btn">← Вернуться в каталог</Link>

        <div className="details-content">
            <div className="details-info">
                <h1>{auction.brand?.name} {auction.model?.name}</h1>
                <p className="status-badge">Статус: {auction.status}</p>
                <hr />

                {/* ГАЛЕРЕЯ ФОТОГРАФИЙ */}
                <div className="gallery">
                    {auction.images && auction.images.length > 0 ? (
                        auction.images.map((img) => (
                            <img
                                key={img.id}
                                src={`http://localhost:8080${img.imageUrl}`}
                                alt="Фото авто"
                                className={img.isMain ? "gallery-img main-img" : "gallery-img"}
                            />
                        ))
                    ) : (
                        <p className="no-photos">Фотографий пока нет</p>
                    )}
                </div>

                <div className="data-grid">
                    <p><strong>Год:</strong> {auction.year}</p>
                    <p><strong>Пробег:</strong> {auction.mileage} км</p>
                    <p><strong>КПП:</strong> {auction.transmission?.name || 'Не указано'}</p>
                    <p><strong>Топливо:</strong> {auction.fuelType?.name || 'Не указано'}</p>
                </div>

                <div className="description">
                    <h3>Описание:</h3>
                    <p>{auction.description || 'Нет описания'}</p>
                </div>
            </div>

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