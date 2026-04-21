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
  const {
    id,
    mainImageUrl,
    brand,
    model,
    year,
    mileage,
    transmission,
    fuelType,
    status: statusKey,
    currentPrice,
    endTime
  } = auction || {}; // Добавил fallback {} на случай, если auction пустой

  const imageUrl = mainImageUrl
      ? `http://localhost:8080${mainImageUrl}`
      : null;

  const status = STATUS_MAP[statusKey] ?? { label: statusKey, cls: '' };

  // Получаем курс и считаем цену в USD
  const rate = useRate();

  // ЯВНОЕ ПРИВЕДЕНИЕ К ЧИСЛУ
  // Убирает предупреждение "Invalid number of arguments", если придет строка
  const priceNum = Number(currentPrice) || 0;

  const priceUsd = rate && priceNum
      ? Math.round(priceNum / rate).toLocaleString('ru-RU')
      : '...';

  return (
      <Link to={`/auction/${id}`} className="ac-link">
        <article className="ac">

          {/* Photo */}
          <div className="ac-photo">
            {imageUrl
                ? <img src={imageUrl} alt={`${brand?.name} ${model?.name}`} loading="lazy" />
                : <div className="ac-photo__empty">Фото не загружено</div>
            }
            <span className={`ac-status ${status.cls}`}>{status.label}</span>
          </div>

          {/* Body */}
          <div className="ac-body">
            <h2 className="ac-title">
              {brand?.name} {model?.name}
            </h2>

            <div className="ac-specs">
              <div className="ac-spec">
                <span className="ac-spec__label">Год </span>
                <span className="ac-spec__value">{year ?? '—'}</span>
              </div>
              <div className="ac-spec">
                <span className="ac-spec__label">Пробег </span>
                <span className="ac-spec__value">
                  {mileage ? `${mileage.toLocaleString('ru-RU')} км` : '—'}
                </span>
              </div>
              <div className="ac-spec">
                <span className="ac-spec__label">КПП </span>
                <span className="ac-spec__value">{transmission?.name ?? '—'}</span>
              </div>
              <div className="ac-spec">
                <span className="ac-spec__label">Топливо </span>
                <span className="ac-spec__value">{fuelType?.name ?? '—'}</span>
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
                  {priceNum.toLocaleString('ru-RU')}
                  <BynIcon className="ac-currency-icon" />
                </p>

                {/* Вывод цены в USD */}
                {rate && (
                    <p className="ac-price__usd">
                      ≈ {priceUsd} $                     </p>
                )}

                {statusKey === 'ACTIVE' && endTime && (
                    <p className="ac-end-time">
                      {new Date(endTime).toLocaleString('ru-RU', {
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