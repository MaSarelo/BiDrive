import { Link } from 'react-router-dom';
import './AuctionCard.css';
import BynIcon from './BynIcon';
import { useRate } from '../context/RateContext';

const STATUS_MAP = {
  ACTIVE:   { label: 'Активен',     cls: 'ac-status--active'   },
  DRAFT:    { label: 'Черновик',    cls: 'ac-status--draft'    },
  PENDING:  { label: 'На проверке', cls: 'ac-status--pending'  },
  FINISHED: { label: 'Завершён',    cls: 'ac-status--finished' },
  APPROVED: { label: 'Одобрен',     cls: 'ac-status--approved' },
};

function AuctionCard({ auction }) {
  const imageUrl = auction.mainImageUrl
      ? `http://localhost:8080${auction.mainImageUrl}`
      : null;

  const status = STATUS_MAP[auction.status] ?? { label: auction.status, cls: '' };

  // Получаем курс и считаем цену в USD
  const rate = useRate();
  const priceUsd = rate && auction.currentPrice
      ? Math.round(auction.currentPrice / rate).toLocaleString('ru-RU')
      : '...';

  return (
      <Link to={`/auction/${auction.id}`} className="ac-link">
        <article className="ac">

          {/* Photo */}
          <div className="ac-photo">
            {imageUrl
                ? <img src={imageUrl} alt={`${auction.brand?.name} ${auction.model?.name}`} loading="lazy" />
                : <div className="ac-photo__empty">Фото не загружено</div>
            }
            <span className={`ac-status ${status.cls}`}>{status.label}</span>
          </div>

          {/* Body */}
          <div className="ac-body">
            <h2 className="ac-title">
              {auction.brand?.name} {auction.model?.name}
            </h2>

            <div className="ac-specs">
              <div className="ac-spec">
                <span className="ac-spec__label">Год </span>
                <span className="ac-spec__value">{auction.year ?? '—'}</span>
              </div>
              <div className="ac-spec">
                <span className="ac-spec__label">Пробег </span>
                <span className="ac-spec__value">
                  {auction.mileage ? `${auction.mileage.toLocaleString('ru-RU')} км` : '—'}
                </span>
              </div>
              <div className="ac-spec">
                <span className="ac-spec__label">КПП </span>
                <span className="ac-spec__value">{auction.transmission?.name ?? '—'}</span>
              </div>
              <div className="ac-spec">
                <span className="ac-spec__label">Топливо </span>
                <span className="ac-spec__value">{auction.fuelType?.name ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="ac-footer">
            <div className="ac-footer__divider" aria-hidden="true" />
            <div className="ac-footer__inner">
              <div>
                <p className="ac-price__label">Текущая цена</p>
                <p className="ac-price__value">
                  {auction.currentPrice?.toLocaleString('ru-RU')}
                  <BynIcon className="ac-currency-icon" />
                </p>

                {/* Вывод цены в USD */}
                {rate && (
                    <p className="ac-price__usd">
                      ≈ {priceUsd} $
                    </p>
                )}

                {auction.status === 'ACTIVE' && auction.endTime && (
                    <p className="ac-end-time">
                      {new Date(auction.endTime).toLocaleString('ru-RU', {
                        day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                )}
              </div>
              <span className="ac-arrow">→</span>
            </div>
          </div>

        </article>
      </Link>
  );
}

export default AuctionCard;