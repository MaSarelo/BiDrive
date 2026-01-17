import { Link } from 'react-router-dom';
import './AuctionCard.css';

function AuctionCard({ auction }) {
  return (
    <Link to={`/auction/${auction.id}`} className="card-link">
      <div className="card">
        <h2>{auction.brand.name} {auction.model.name}</h2>

        <div className="info">
          <p><strong>Год:</strong> {auction.year}</p>
          <p><strong>Пробег:</strong> {auction.mileage} км</p>
          <p><strong>КПП:</strong> {auction.transmission || '-'}</p>
          <p><strong>Топливо:</strong> {auction.fuelType || '-'}</p>
        </div>

        <div className="price-block">
          <h3>Текущая цена:</h3>
          <p className="price">{auction.currentPrice} $</p>
          <p className="status">Статус: {auction.status}</p>
        </div>

        <p className="click-hint">Нажмите, чтобы сделать ставку</p>
      </div>
    </Link>
  );
}

export default AuctionCard;