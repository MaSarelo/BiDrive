import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuctionDetails.css';
import BynIcon from '../../components/BynIcon';
import { useRate } from '../../context/RateContext';
import AuctionDetailsSkeleton from './AuctionDetailsSkeleton';

// ИСПРАВЛЕНО: Явное определение URL
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

const STATUS_MAP = {
  ACTIVE:   { label: 'Активен',     cls: 'ad-status--active'   },
  DRAFT:    { label: 'Черновик',    cls: 'ad-status--draft'    },
  PENDING:  { label: 'На проверке', cls: 'ad-status--pending'  },
  APPROVED: { label: 'Одобрен',     cls: 'ad-status--approved' },
  REJECTED: { label: 'Отклонён',    cls: 'ad-status--rejected' },
  FINISHED: { label: 'Завершён',    cls: 'ad-status--finished' },
  COMPLETED:{ label: 'Завершён',    cls: 'ad-status--finished' },
};

function AuctionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [auction,      setAuction]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [currentUser,  setCurrentUser]  = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [bidAmount,    setBidAmount]    = useState('');
  const [bidMsg,       setBidMsg]       = useState({ text: '', ok: true });
  const [bidHistory,   setBidHistory]   = useState([]);
  const [timeLeft,     setTimeLeft]     = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const rate = useRate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const uid   = localStorage.getItem('userId');
    // ИСПРАВЛЕНО: parseInt требует второй аргумент (radix)
    if (email && uid) setCurrentUser({ email, id: parseInt(uid, 10) });
  }, []);

  const loadAuction = (isMounted) =>
      axios.get(`${API_URL}/api/auctions/${id}`).then(r => {
        if (!isMounted) return;
        const data = r.data;
        // ИСПРАВЛЕНО: Проверка массива перед сортировкой
        if (Array.isArray(data.images) && data.images.length > 0) {
          // Деструктуризация в sort callback
          data.images.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        }
        setAuction(data);

        if (Array.isArray(data.images) && data.images.length > 0) {
          setCurrentImage(data.images.find(img => img.isMain) ?? data.images[0]);
        } else if (data.mainImageUrl) {
          setCurrentImage({ imageUrl: data.mainImageUrl });
        }
      });

  const loadBidHistory = (isMounted) =>
      axios.get(`${API_URL}/api/auctions/${id}/bids-history`)
          .then(r => { if (isMounted) setBidHistory(r.data || []); })
          .catch(console.error);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([loadAuction(isMounted), loadBidHistory(isMounted)])
        .catch(console.error)
        .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    // Деструктуризация auction
    const { endTime, status } = auction || {};
    if (!endTime || status !== 'ACTIVE') return;

    const calc = () => {
      const diff = +new Date(endTime) - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor(diff /  3_600_000) % 24,
        minutes: Math.floor(diff /     60_000) % 60,
        seconds: Math.floor(diff /      1_000) % 60,
      };
    };
    setTimeLeft(calc());
    const intervalId = setInterval(() => {
      const t = calc();
      setTimeLeft(t);
      if (!t.days && !t.hours && !t.minutes && !t.seconds) clearInterval(intervalId);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [auction]);

  const handleBidInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setBidAmount(raw);
  };

  const handlePlaceBid = () => {
    if (!bidAmount) { setBidMsg({ text: 'Введите сумму ставки', ok: false }); return; }
    const userId = parseInt(localStorage.getItem('userId'), 10);
    if (!userId) {
      setBidMsg({ text: 'Войдите, чтобы сделать ставку', ok: false });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    // Деструктуризация auction.id
    const { id: auctionId } = auction;
    axios.post(`${API_URL}/api/bids`, null, {
      params: { auctionId, userId, amount: bidAmount }
    })
        .then(() => {
          setBidMsg({ text: 'Ставка принята', ok: true });
          setBidAmount('');
          setTimeout(() => { loadAuction(true); loadBidHistory(true); }, 1000);
          setTimeout(() => setBidMsg({ text: '', ok: true }), 3500);
        })
        .catch(err => setBidMsg({ text: err.response?.data || 'Ошибка', ok: false }));
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'auto';
  }, []);

  const goToNextLightbox = useCallback(() => {
    if (!auction?.images) return;
    setLightboxIndex(prev => (prev + 1) % auction.images.length);
  }, [auction]);

  const goToPrevLightbox = useCallback(() => {
    if (!auction?.images) return;
    setLightboxIndex(prev => (prev - 1 + auction.images.length) % auction.images.length);
  }, [auction]);

  const currentIndex = useMemo(() =>
          auction?.images?.findIndex(img => img.id === currentImage?.id) ?? -1,
      [auction?.images, currentImage?.id]
  );

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (!auction?.images) return;
    const nextIndex = (currentIndex + 1) % auction.images.length;
    setCurrentImage(auction.images[nextIndex]);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (!auction?.images) return;
    const prevIndex = (currentIndex - 1 + auction.images.length) % auction.images.length;
    setCurrentImage(auction.images[prevIndex]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') goToNextLightbox();
        if (e.key === 'ArrowLeft') goToPrevLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, closeLightbox, goToNextLightbox, goToPrevLightbox]);

  if (loading) return <AuctionDetailsSkeleton />;
  if (!auction) return <div className="ad-loading"><p>Лот не найден.</p></div>;

  // === ДЕСТРУКТУРИЗАЦИЯ AUCTION ===
  // Выносим все свойства наверх, чтобы IDE видела переменные
  const {
    brand,
    model,
    city,
    status,
    images,
    mainImageUrl,
    seller,
    winner,
    currentPrice,
    startingPrice,
    minBidStep,
    endTime,
    description,
    rejectionReason,
    year,
    mileage,
    transmission,
    fuelType,
    vin
  } = auction;

  const statusInfo = STATUS_MAP[status] ?? { label: status, cls: '' };
  const isActive = status === 'ACTIVE';
  const isWinner = status === 'FINISHED' && winner && currentUser && currentUser.id === winner.id;
  const isSeller = status === 'FINISHED' && seller && currentUser && currentUser.id === seller.id && winner;

  return (
      <div className="ad">
        {/* Breadcrumb */}
        <div className="ad-breadcrumb">
          <div className="ad-container">
            <Link to="/catalog" className="ad-breadcrumb__link">Каталог</Link>
            <span className="ad-breadcrumb__sep">›</span>
            <span className="ad-breadcrumb__current">{brand?.name} {model?.name}</span>
          </div>
        </div>

        <main className="ad-container ad-body">
          <div className="ad-left">

            {/* Title */}
            <div className="ad-title-block">
              <div className="ad-title-block__top">
                <span className={`ad-status ${statusInfo.cls}`}>{statusInfo.label}</span>
                {city && <span className="ad-location">{city.name}, {city.region?.name}</span>}
              </div>
              <h1 className="ad-title">{brand?.name} {model?.name}</h1>
              <div className="ad-title-block__divider" />
            </div>

            {/* REJECTED BLOCK */}
            {status === 'REJECTED' && rejectionReason && (
                <div className="ad-deal-card ad-deal-card--rejected">
                  <h3 className="ad-deal-card__title">Лот отклонён модератором</h3>
                  <div className="ad-deal-card__contacts">
                    <p className="ad-reject-reason-text"><strong>Причина:</strong> {rejectionReason}</p>
                  </div>
                </div>
            )}

            {/* Winner/Seller Cards */}
            {isWinner && (
                <div className="ad-deal-card ad-deal-card--winner">
                  <h3 className="ad-deal-card__title">Поздравляем! Вы выиграли этот лот</h3>
                  <p className="ad-deal-card__price">
                    Итоговая цена: <strong>{currentPrice?.toLocaleString('ru-RU')} <BynIcon className="ad-currency-icon" /></strong>
                    {rate && <span className="ad-price__usd">(~ ${Math.round(currentPrice / rate).toLocaleString('ru-RU')})</span>}
                  </p>
                  <div className="ad-deal-card__contacts">
                    <p>Свяжитесь с продавцом для оформления сделки</p>
                    <div className="ad-deal-card__info"><span>Email</span><a href={`mailto:${seller?.email}`}>{seller?.email}</a></div>
                    {seller?.phone && (
                        <div className="ad-deal-card__info">
                          <span>Телефон</span>
                          <a href={`tel:${seller.phone}`}>{seller.phone}</a>
                        </div>
                    )}
                  </div>
                </div>
            )}
            {isSeller && (
                <div className="ad-deal-card ad-deal-card--seller">
                  <h3 className="ad-deal-card__title">Лот продан</h3>
                  <p className="ad-deal-card__price">
                    Сумма сделки: <strong>{currentPrice?.toLocaleString('ru-RU')} <BynIcon className="ad-currency-icon" /></strong>
                    {rate && <span className="ad-price__usd">(~ ${Math.round(currentPrice / rate).toLocaleString('ru-RU')})</span>}
                  </p>
                  <div className="ad-deal-card__contacts">
                    <p>Победитель торгов</p>
                    <div className="ad-deal-card__info"><span>Имя</span><span>{winner?.firstName} {winner?.lastName}</span></div>
                    <div className="ad-deal-card__info"><span>Email</span><a href={`mailto:${winner?.email}`}>{winner?.email}</a></div>
                    {winner?.phone && (
                        <div className="ad-deal-card__info">
                          <span>Телефон</span>
                          <a href={`tel:${winner.phone}`}>{winner.phone}</a>
                        </div>
                    )}
                  </div>
                </div>
            )}

            {/* Gallery */}
            <div className="ad-gallery">
              <div className="ad-gallery__main">
                {currentImage ? (
                    <div onClick={() => { if(images && images.length > 0) openLightbox(currentIndex >= 0 ? currentIndex : 0); }} style={{ height: '100%', cursor: 'zoom-in' }}>
                      {/* ИСПРАВЛЕНО: убрали ${API_URL} для проксирования через Vite */}
                      <img src={currentImage.imageUrl} alt="Фото автомобиля" />
                      {images && images.length > 1 && (
                          <>
                            <button type="button" className="ad-gallery__nav ad-gallery__nav--prev" onClick={handlePrevImage} aria-label="Предыдущее фото">‹</button>
                            <button type="button" className="ad-gallery__nav ad-gallery__nav--next" onClick={handleNextImage} aria-label="Следующее фото">›</button>
                          </>
                      )}
                    </div>
                ) : (
                    <div className="ad-gallery__empty">Фото не загружено</div>
                )}
              </div>
              {images && images.length > 0 && (
                  <div className="ad-gallery__thumbs">
                    {images.map((img) => (
                        <button
                            type="button"
                            key={img.id}
                            className={`ad-thumb${currentImage?.id === img.id ? ' ad-thumb--active' : ''}`}
                            onClick={() => setCurrentImage(img)}
                            aria-label={`Миниатюра ${img.displayOrder}`}
                        >
                          {/* ИСПРАВЛЕНО: убрали ${API_URL} для проксирования через Vite */}
                          <img src={img.imageUrl} alt="" />
                        </button>
                    ))}
                  </div>
              )}
            </div>

            {/* Specs */}
            <div className="ad-specs">
              <p className="ad-section-heading">Технические характеристики</p>
              <div className="ad-specs__grid">
                <div className="ad-spec">
                  <span className="ad-spec__label">Год выпуска</span>
                  <span className="ad-spec__value">{year ?? '—'}</span>
                </div>
                <div className="ad-spec">
                  <span className="ad-spec__label">Пробег</span>
                  <span className="ad-spec__value">{mileage ? `${mileage.toLocaleString('ru-RU')} км` : '—'}</span>
                </div>
                <div className="ad-spec">
                  <span className="ad-spec__label">КПП</span>
                  <span className="ad-spec__value">{transmission?.name || '—'}</span>
                </div>
                <div className="ad-spec">
                  <span className="ad-spec__label">Топливо</span>
                  <span className="ad-spec__value">{fuelType?.name || '—'}</span>
                </div>
              </div>

              {/* VIN-код на всю ширину */}
              {vin && (
                  <div className="ad-specs__vin">
                    <span className="ad-specs__vin-label">VIN-код</span>
                    <span className="ad-specs__vin-value">{vin}</span>
                  </div>
              )}
            </div>

            <div className="ad-seller">
              <p className="ad-section-heading">Продавец</p>
              <p className="ad-seller__name">{seller?.firstName} {seller?.lastName}</p>
              {isWinner && seller?.email && (<p className="ad-seller__email">{seller.email}</p>)}
            </div>

            <div className="ad-description">
              <p className="ad-section-heading">Описание</p>
              <p className="ad-description__text">{description || 'Описание отсутствует.'}</p>
            </div>

            {bidHistory.length > 0 && (
                <div className="ad-history">
                  <p className="ad-section-heading">История ставок</p>
                  <ul className="ad-history__list">
                    {bidHistory.map((bid) => (
                        // Деструктуризация bid
                        (({ bidId, userName, createdAt, amount }) => (
                            <li key={bidId} className="ad-history__item">
                              <div className="ad-history__who">
                                <span className="ad-history__name">{userName}</span>
                                <span className="ad-history__time">{new Date(createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <span className="ad-history__amount">{amount.toLocaleString('ru-RU')} <BynIcon className="ad-currency-icon" /></span>
                            </li>
                        ))(bid)
                    ))}
                  </ul>
                </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="ad-sidebar">
            <div className="ad-price-card">
              <div className="ad-price-card__top">
                <p className="ad-price-card__eyebrow">Текущая цена</p>
                <p className="ad-price-card__price">
                  {currentPrice?.toLocaleString('ru-RU')}
                  <BynIcon className="ad-currency-icon" />
                </p>
                {rate && (<p className="ad-price__usd">≈ {Math.round(currentPrice / rate).toLocaleString('ru-RU')} $</p>)}
              </div>
              <div className="ad-price-card__divider" />
              <div className="ad-price-card__meta">
                <div className="ad-meta-row"><span>Стартовая цена</span><span>{startingPrice?.toLocaleString('ru-RU')} <BynIcon className="ad-currency-icon" /></span></div>
                <div className="ad-meta-row"><span>Минимальный шаг</span><span>{minBidStep?.toLocaleString('ru-RU')} <BynIcon className="ad-currency-icon" /></span></div>
                {status === 'ACTIVE' && (
                    <div className="ad-timer-row">
                      <span>До окончания</span>
                      <div className="ad-timer-values">
                        {timeLeft.days > 0 && (<span>{timeLeft.days}<em>д</em></span>)}
                        <span>{String(timeLeft.hours).padStart(2, '0')}<em>ч</em></span>
                        <span>{String(timeLeft.minutes).padStart(2, '0')}<em>м</em></span>
                        <span>{String(timeLeft.seconds).padStart(2, '0')}<em>с</em></span>
                      </div>
                    </div>
                )}
              </div>
              <div className="ad-price-card__divider" />
              {currentUser ? (
                  <div className="ad-bid-form">
                    <label className="ad-bid-form__label">
                      Ваша ставка (<BynIcon className="ad-currency-icon" />)
                    </label>
                    <input
                        className="ad-bid-form__input"
                        type="text"
                        inputMode="numeric"
                        placeholder="Сумма"
                        value={bidAmount ? Number(bidAmount).toLocaleString('ru-RU') : ''}
                        onChange={handleBidInput}
                        disabled={!isActive}
                    />
                    <button type="button" className={`ad-btn ad-btn--gold ad-btn--full${!isActive ? ' ad-btn--disabled' : ''}`} onClick={handlePlaceBid} disabled={!isActive}>
                      {isActive ? 'Сделать ставку' : 'Торги завершены'}
                    </button>
                    {bidMsg.text && (<p className={`ad-bid-msg${bidMsg.ok ? ' ad-bid-msg--ok' : ' ad-bid-msg--err'}`}>{bidMsg.text}</p>)}
                  </div>
              ) : (
                  <div className="ad-bid-form ad-bid-form--center">
                    <p className="ad-bid-form__login-text">Войдите, чтобы делать ставки</p>
                    <Link to="/login" className="ad-btn ad-btn--gold ad-btn--full">Войти</Link>
                  </div>
              )}
            </div>
          </aside>
        </main>

        {/* Footer */}
        <footer className="ad-footer">
          <div className="ad-container ad-footer__grid">
            <div><p className="ad-footer__wordmark">BiDrive</p><p className="ad-footer__desc">Платформа онлайн-аукционов автомобилей.</p></div>
            <div><p className="ad-footer__col-title">Навигация</p><ul className="ad-footer__list"><li><Link to="/catalog">Каталог</Link></li><li><Link to="/register">Регистрация</Link></li></ul></div>
            <div><p className="ad-footer__col-title">Контакты</p><ul className="ad-footer__list"><li><a href="mailto:support@bidrive.by">support@bidrive.by</a></li><li><a href="https://t.me/bidrive_bot">Telegram</a></li><li>+375 (29) 123-45-67</li></ul></div>
          </div>
          <div className="ad-footer__bottom"><p>© 2026 BiDrive. Дипломный проект.</p></div>
        </footer>

        {/* LIGHTBOX */}
        {isLightboxOpen && images && (
            <div className="ad-lightbox ad-lightbox--open" onClick={closeLightbox}>
              <button type="button" className="ad-lightbox__close" onClick={closeLightbox} aria-label="Закрыть">×</button>
              {images.length > 1 && <button type="button" className="ad-lightbox__nav ad-lightbox__nav--prev" onClick={(e) => { e.stopPropagation(); goToPrevLightbox(); }} aria-label="Предыдущее фото">‹</button>}
              {/* ИСПРАВЛЕНО: убрали ${API_URL} для проксирования через Vite */}
              <img src={images[lightboxIndex]?.imageUrl} alt="Просмотр фото" className="ad-lightbox__img" onClick={(e) => e.stopPropagation()} />
              {images.length > 1 && <button type="button" className="ad-lightbox__nav ad-lightbox__nav--next" onClick={(e) => { e.stopPropagation(); goToNextLightbox(); }} aria-label="Следующее фото">›</button>}
              <div className="ad-lightbox__counter">{lightboxIndex + 1} / {images.length}</div>
            </div>
        )}

      </div>
  );
}

export default AuctionDetails;