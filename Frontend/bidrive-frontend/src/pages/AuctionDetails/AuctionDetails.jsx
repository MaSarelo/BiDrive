import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './AuctionDetails.css';

const STATUS_MAP = {
  ACTIVE:   { label: 'Активен',      cls: 'ad-status--active'   },
  DRAFT:    { label: 'Черновик',     cls: 'ad-status--draft'    },
  PENDING:  { label: 'На проверке',  cls: 'ad-status--pending'  },
  FINISHED: { label: 'Завершён',     cls: 'ad-status--finished' },
  APPROVED: { label: 'Одобрен',      cls: 'ad-status--approved' },
};

function AuctionDetails() {
  const { id } = useParams();
  const [auction,      setAuction]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [currentUser,  setCurrentUser]  = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [bidAmount,    setBidAmount]    = useState('');
  const [bidMsg,       setBidMsg]       = useState({ text: '', ok: true });

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const uid   = localStorage.getItem('userId');
    if (email) { setCurrentUser({ email, id: parseInt(uid) }); }
  }, []);

  const loadAuction = () =>
    axios.get(`http://localhost:8080/api/auctions/${id}`).then(r => {
      const data = r.data;
      setAuction(data);
      if (data.images?.length > 0) {
        setCurrentImage(data.images.find(i => i.isMain) ?? data.images[0]);
      } else if (data.mainImageUrl) {
        setCurrentImage({ imageUrl: data.mainImageUrl });
      }
    });

  useEffect(() => {
    loadAuction().catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handlePlaceBid = () => {
    if (!bidAmount) { setBidMsg({ text: 'Введите сумму ставки', ok: false }); return; }
    const userId = parseInt(localStorage.getItem('userId')) || 3;
    axios.post('http://localhost:8080/api/bids', null, {
      params: { auctionId: auction.id, userId, amount: bidAmount }
    })
    .then(() => {
      setBidMsg({ text: 'Ставка принята', ok: true });
      setTimeout(() => loadAuction().catch(console.error), 1000);
      setTimeout(() => setBidMsg({ text: '', ok: true }), 3500);
    })
    .catch(err => {
      setBidMsg({ text: err.response?.data || 'Ставка слишком низкая', ok: false });
    });
  };

  if (loading) return (
    <div className="ad-loading">
      <span className="ad-loading__line" />
      <p>Загрузка лота</p>
    </div>
  );

  if (!auction) return (
    <div className="ad-loading"><p>Лот не найден.</p></div>
  );

  const status  = STATUS_MAP[auction.status] ?? { label: auction.status, cls: '' };
  const isActive = auction.status === 'ACTIVE';
  const showContact = auction.status === 'FINISHED' && auction.winner && currentUser;

  return (
    <div className="ad">

      {/* ── BREADCRUMB ── */}
      <div className="ad-breadcrumb">
        <div className="ad-container">
          <Link to="/catalog" className="ad-breadcrumb__link">Каталог</Link>
          <span className="ad-breadcrumb__sep">→</span>
          <span className="ad-breadcrumb__current">
            {auction.brand?.name} {auction.model?.name}
          </span>
        </div>
      </div>

      {/* ── BODY ── */}
      <main className="ad-container ad-body">

        {/* LEFT */}
        <div className="ad-left">

          {/* Title block */}
          <div className="ad-title-block">
            <div className="ad-title-block__top">
              <span className={`ad-status ${status.cls}`}>{status.label}</span>
              {auction.city && (
                <span className="ad-location">
                  {auction.city.name}, {auction.city.region?.name}
                </span>
              )}
            </div>
            <h1 className="ad-title">
              {auction.brand?.name} {auction.model?.name}
            </h1>
            <div className="ad-title-block__divider" aria-hidden="true" />
          </div>

          {/* Gallery */}
          <div className="ad-gallery">
            <div className="ad-gallery__main">
              {currentImage
                ? <img src={`http://localhost:8080${currentImage.imageUrl}`} alt="Фото автомобиля" />
                : <div className="ad-gallery__empty">Фото не загружено</div>
              }
            </div>
            {auction.images?.length > 0 && (
              <div className="ad-gallery__thumbs">
                {auction.images.map(img => (
                  <button
                    key={img.id}
                    className={`ad-thumb${currentImage?.id === img.id ? ' ad-thumb--active' : ''}`}
                    onClick={() => setCurrentImage(img)}
                    aria-label="Сменить фото"
                  >
                    <img src={`http://localhost:8080${img.imageUrl}`} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Specs */}
          <div className="ad-specs">
            <p className="ad-specs__heading">Технические характеристики</p>
            <div className="ad-specs__grid">
              {[
                { label: 'Год выпуска', value: auction.year },
                { label: 'Пробег',      value: auction.mileage ? `${auction.mileage.toLocaleString()} км` : '—' },
                { label: 'КПП',         value: auction.transmission?.name  || '—' },
                { label: 'Топливо',     value: auction.fuelType?.name       || '—' },
              ].map(s => (
                <div key={s.label} className="ad-spec">
                  <span className="ad-spec__label">{s.label}</span>
                  <span className="ad-spec__value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seller */}
          <div className="ad-seller">
            <p className="ad-seller__heading">Продавец</p>
            <p className="ad-seller__name">
              {auction.seller?.firstName} {auction.seller?.lastName}
            </p>
            {showContact && (
              <p className="ad-seller__email">{auction.seller.email}</p>
            )}
          </div>

          {/* Description */}
          <div className="ad-description">
            <p className="ad-description__heading">Описание</p>
            <div className="ad-description__divider" aria-hidden="true" />
            <p className="ad-description__text">
              {auction.description || 'Описание отсутствует.'}
            </p>
          </div>

          {/* Bids history */}
          {auction.bids?.length > 0 && (
            <div className="ad-history">
              <p className="ad-history__heading">История ставок</p>
              <div className="ad-history__divider" aria-hidden="true" />
              <ul className="ad-history__list">
                {[...auction.bids].reverse().map(bid => (
                  <li key={bid.id} className="ad-history__item">
                    <div className="ad-history__who">
                      <span className="ad-history__name">{bid.user?.firstName || 'Участник'}</span>
                      <span className="ad-history__time">
                        {new Date(bid.createdAt).toLocaleString('ru-RU', {
                          day: '2-digit', month: '2-digit',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <span className="ad-history__amount">{bid.amount.toLocaleString()} BYN</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT — sticky sidebar */}
        <aside className="ad-sidebar">
          <div className="ad-price-card">

            {/* Current price */}
            <div className="ad-price-card__top">
              <p className="ad-price-card__eyebrow">Текущая цена</p>
              <p className="ad-price-card__price">
                {auction.currentPrice?.toLocaleString()} <span>BYN</span>
              </p>
            </div>

            <div className="ad-price-card__divider" aria-hidden="true" />

            {/* Meta */}
            <div className="ad-price-card__meta">
              <div className="ad-meta-row">
                <span>Стартовая цена</span>
                <span>{auction.startingPrice?.toLocaleString()} BYN</span>
              </div>
              <div className="ad-meta-row">
                <span>Минимальный шаг</span>
                <span>{auction.minBidStep} BYN</span>
              </div>
            </div>

            <div className="ad-price-card__divider" aria-hidden="true" />

            {/* Bid form */}
            <div className="ad-bid-form">
              <label className="ad-bid-form__label">Ваша ставка</label>
              <input
                className="ad-bid-form__input"
                type="number"
                placeholder="Введите сумму в $"
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                disabled={!isActive}
              />
              <button
                className={`ad-btn ad-btn--gold ad-btn--full${!isActive ? ' ad-btn--disabled' : ''}`}
                onClick={handlePlaceBid}
                disabled={!isActive}
              >
                {isActive ? 'Сделать ставку' : 'Торги завершены'}
              </button>
              {bidMsg.text && (
                <p className={`ad-bid-msg${bidMsg.ok ? ' ad-bid-msg--ok' : ' ad-bid-msg--err'}`}>
                  {bidMsg.text}
                </p>
              )}
            </div>

            {!isActive && (
              <p className="ad-price-card__closed">
                Приём ставок по данному лоту закрыт
              </p>
            )}
          </div>
        </aside>

      </main>

      {/* ── FOOTER ── */}
      <footer className="ad-footer">
        <div className="ad-container ad-footer__grid">
          <div>
            <p className="ad-footer__wordmark">BiDrive</p>
            <p className="ad-footer__desc">Платформа онлайн-аукционов автомобилей. Прозрачно и безопасно.</p>
          </div>
          <div>
            <p className="ad-footer__col-title">Навигация</p>
            <ul className="ad-footer__list">
              <li><Link to="/catalog">Каталог</Link></li>
              <li><Link to="/register">Регистрация</Link></li>
            </ul>
          </div>
          <div>
            <p className="ad-footer__col-title">Контакты</p>
            <ul className="ad-footer__list">
              <li><a href="mailto:support@bidrive.by">support@bidrive.by</a></li>
              <li><a href="https://t.me/bidrive_bot" target="_blank" rel="noopener noreferrer">Telegram</a></li>
              <li>+375 (29) 123-45-67</li>
            </ul>
          </div>
        </div>
        <div className="ad-footer__bottom">
          <p>© 2026 BiDrive. Дипломный проект. Все права защищены.</p>
        </div>
      </footer>

    </div>
  );
}

export default AuctionDetails;