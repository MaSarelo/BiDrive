import { Link } from 'react-router-dom';
import './AuctionCard.css';

function AuctionCard({ auction }) {
  // Если у лота есть главная фотка, используем её. Иначе плейсхолдер.
  const imageUrl = auction.mainImageUrl
    ? `http://localhost:8080${auction.mainImageUrl}`
    : 'https://via.placeholder.com/300x200?text=No+Image';

const getStatusText = (status) => {
            switch (status) {
              case 'ACTIVE': return '🟢 Активен';
              case 'DRAFT': return '📝 Черновик';
              case 'PENDING': return '⏳ На проверке';
              case 'FINISHED': return '🏁 Завершен';
              case 'APPROVED': return '✅ Одобрен';
              default: return status; // Если какой-то новый статус, вернем как есть
            }
          };

  return (
    <Link to={`/auction/${auction.id}`} className="card-link">
      <div className="card">
        {/* Блок с картинкой */}
        <div className="card-image">
          <img src={imageUrl} alt={`${auction.brand?.name} ${auction.model?.name}`} />
        </div>

        <h2>{auction.brand?.name} {auction.model?.name}</h2>

        <div className="info">
          <p><strong>Год:</strong> {auction.year}</p>
          <p><strong>Пробег:</strong> {auction.mileage} км</p>
          <p><strong>КПП:</strong> {auction.transmission?.name || '-'}</p>
          <p><strong>Топливо:</strong> {auction.fuelType?.name || '-'}</p>
        </div>

        <div className="price-block">
          <h3>Текущая цена:</h3>
          <p className="price">{auction.currentPrice} $</p>
            <p className="status">Статус: {getStatusText(auction.status)}</p>
        </div>
      </div>
    </Link>
  );
}

export default AuctionCard;