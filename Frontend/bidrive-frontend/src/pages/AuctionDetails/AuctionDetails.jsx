import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuctionDetails.css';
import BynIcon from '../../components/BynIcon';
import { useRate } from '../../context/RateContext';
import AuctionDetailsSkeleton from './AuctionDetailsSkeleton';

const STATUS_MAP = {
  ACTIVE:   { label: 'Активен',     cls: 'ad-status--active'   },
  DRAFT:    { label: 'Черновик',    cls: 'ad-status--draft'    },
  PENDING:  { label: 'На проверке', cls: 'ad-status--pending'  },
  APPROVED: { label: 'Одобрен',     cls: 'ad-status--approved' },
  REJECTED: { label: 'Отклонён',    cls: 'ad-status--rejected' },
  FINISHED: { label: 'Завершён',    cls: 'ad-status--finished' },
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

  // --- LIGHTBOX STATE ---
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const rate = useRate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const uid   = localStorage.getItem('userId');
    if (email) setCurrentUser({ email, id: parseInt(uid) });
  }, []);

  const loadAuction = () =>
      axios.get(`http://localhost:8080/api/auctions/${id}`).then(r => {
        const data = r.data;
        if (data.images?.length > 0) {
          data.images.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        }
        setAuction(data);
        if (data.images?.length > 0) {
          setCurrentImage(data.images.find(i => i.isMain) ?? data.images[0]);
        } else if (data.mainImageUrl) {
          setCurrentImage({ imageUrl: data.mainImageUrl });
        }
      });

  const loadBidHistory = () =>
      axios.get(`http://localhost:8080/api/auctions/${id}/bids-history`)
          .then(r => setBidHistory(r.data))
          .catch(console.error);

  useEffect(() => {
    loadAuction().catch(console.error).finally(() => setLoading(false));
    loadBidHistory();
  }, [id]);

  useEffect(() => {
    if (!auction?.endTime || auction.status !== 'ACTIVE') return;

    const calc = () => {
      const diff = +new Date(auction.endTime) - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor(diff /  3_600_000) % 24,
        minutes: Math.floor(diff /     60_000) % 60,
        seconds: Math.floor(diff /      1_000) % 60,
      };
    };

    setTimeLeft(calc());
    const id = setInterval(() => {
      const t = calc();
      setTimeLeft(t);
      if (!t.days && !t.hours && !t.minutes && !t.seconds) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [auction]);

  const handlePlaceBid = () => {
    if (!bidAmount) { setBidMsg({ text: 'Введите сумму ставки', ok: false }); return; }
    const userId = parseInt(localStorage.getItem('userId'));
    if (!userId) {
      setBidMsg({ text: 'Войдите, чтобы сделать ставку', ok: false });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    axios.post('http://localhost:8080/api/bids', null, {
      params: { auctionId: auction.id, userId, amount: bidAmount }
    })
        .then(() => {
          setBidMsg({ text: 'Ставка принята', ok: true });
          setBidAmount('');
          setTimeout(() => { loadAuction(); loadBidHistory(); }, 1000);
          setTimeout(() => setBidMsg({ text: '', ok: true }), 3500);
        })
        .catch(err => setBidMsg({ text: err.response?.data || 'Ошибка', ok: false }));
  };

  // --- GALLERY & LIGHTBOX LOGIC ---

  // Открытие лайтбокса
  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'auto';
  }, []);

  // Навигация в Лайтбоксе
  const goToNextLightbox = useCallback(() => {
    if (!auction?.images) return;
    setLightboxIndex(prev => (prev + 1) % auction.images.length);
  }, [auction]);

  const goToPrevLightbox = useCallback(() => {
    if (!auction?.images) return;
    setLightboxIndex(prev => (prev - 1 + auction.images.length) % auction.images.length);
  }, [auction]);

  // --- НОВОЕ: Навигация в основном блоке (Carousel) ---
  const currentIndex = auction?.images?.findIndex(img => img.id === currentImage?.id) ?? -1;

  const handleNextImage = (e) => {
    e.stopPropagation(); // Чтобы не открылся лайтбокс при клике на стрелку
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

  // Обработка клавиатуры
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

  // ------------------------------------------------------

  if (loading) return <AuctionDetailsSkeleton />;
  if (!auction) return <div className="ad-loading"><p>Лот не найден.</p></div>;

  const status   = STATUS_MAP[auction.status] ?? { label: auction.status, cls: '' };
  const isActive = auction.status === 'ACTIVE';
  const isWinner = auction.status === 'FINISHED' && auction.winner && currentUser && currentUser.id === auction.winner.id;
  const isSeller = auction.status === 'FINISHED' && auction.seller && currentUser && currentUser.id === auction.seller.id && auction.winner;

  return (
      <div className="ad">

        {/* Breadcrumb */}
        <div className="ad-breadcrumb">
          <div className="ad-container">
            <Link to="/catalog" className="ad-breadcrumb__link">Каталог</Link>
            <span className="ad-breadcrumb__sep">›</span>
            <span className="ad-breadcrumb__current">{auction.brand?.name} {auction.model?.name}</span>
          </div>
        </div>

        <main className="ad-container ad-body">
          <div className="ad-left">

            {/* Title */}
            <div className="ad-title-block">
              <div className="ad-title-block__top">
                <span className={`ad-status ${status.cls}`}>{status.label}</span>
                {auction.city && <span className="ad-location">{auction.city.name}, {auction.city.region?.name}</span>}
              </div>
              <h1 className="ad-title">{auction.brand?.name} {auction.model?.name}</h1>
              <div className="ad-title-block__divider" />
            </div>

            {/* REJECTED BLOCK */}
            {auction.status === 'REJECTED' && auction.rejectionReason && (
                <div className="ad-deal-card ad-deal-card--seller" style={{background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.25)', marginBottom: '32px'}}>
                  <h3 className="ad-deal-card__title" style={{color: 'var(--red)'}}>Лот отклонён модератором</h3>
                  <div className="ad-deal-card__contacts">
                    <p style={{color: 'var(--text-2)', fontSize: '0.9rem', marginBottom: 0}}><strong>Причина:</strong> {auction.rejectionReason}</p>
                  </div>
                </div>
            )}

            {/* Winner/Seller Cards */}
            {isWinner && (
                <div className="ad-deal-card ad-deal-card--winner">
                  <h3 className="ad-deal-card__title">Поздравляем! Вы выиграли этот лот</h3>
                  <p className="ad-deal-card__price">
                    Итоговая цена: <strong>{auction.currentPrice?.toLocaleString()} <BynIcon className="ad-currency-icon" /></strong>
                    {rate && <span className="ad-price__usd">(~ ${Math.round(auction.currentPrice / rate).toLocaleString()})</span>}
                  </p>
                  <div className="ad-deal-card__contacts">
                    <p>Свяжитесь с продавцом для оформления сделки</p>
                    <div className="ad-deal-card__info"><span>Email</span><a href={`mailto:${auction.seller?.email}`}>{auction.seller?.email}</a></div>
                    {auction.seller?.phone && <div className="ad-deal-card__info"><span>Телефон</span><a href={`tel:${auction.seller?.phone}`}>{auction.seller?.phone}</a></div>}
                  </div>
                </div>
            )}
            {isSeller && (
                <div className="ad-deal-card ad-deal-card--seller">
                  <h3 className="ad-deal-card__title">Лот продан</h3>
                  <p className="ad-deal-card__price">
                    Сумма сделки: <strong>{auction.currentPrice?.toLocaleString()} <BynIcon className="ad-currency-icon" /></strong>
                    {rate && <span className="ad-price__usd">(~ ${Math.round(auction.currentPrice / rate).toLocaleString()})</span>}
                  </p>
                  <div className="ad-deal-card__contacts">
                    <p>Победитель торгов</p>
                    <div className="ad-deal-card__info"><span>Имя</span><span>{auction.winner?.firstName} {auction.winner?.lastName}</span></div>
                    <div className="ad-deal-card__info"><span>Email</span><a href={`mailto:${auction.winner?.email}`}>{auction.winner?.email}</a></div>
                  </div>
                </div>
            )}

            {/* Gallery */}
            <div className="ad-gallery">
              <div className="ad-gallery__main">
                {currentImage ? (
                    // Обертка для клика (зум)
                    <div onClick={() => { if(auction.images?.length > 0) openLightbox(currentIndex >= 0 ? currentIndex : 0); }}>
                      <img src={`http://localhost:8080${currentImage.imageUrl}`} alt="Фото лота" />

                      {/* --- НАВИГАЦИЯ ВНУТРИ ФОТО (СТРЕЛКИ) --- */}
                      {auction.images?.length > 1 && (
                          <>
                            <button className="ad-gallery__nav ad-gallery__nav--prev" onClick={handlePrevImage}>‹</button>
                            <button className="ad-gallery__nav ad-gallery__nav--next" onClick={handleNextImage}>›</button>
                          </>
                      )}
                    </div>
                ) : (
                    <div className="ad-gallery__empty">Фото не загружено</div>
                )}
              </div>
              {auction.images?.length > 0 && (
                  <div className="ad-gallery__thumbs">
                    {auction.images.map((img) => (
                        <button
                            key={img.id}
                            className={`ad-thumb${currentImage?.id === img.id ? ' ad-thumb--active' : ''}`}
                            onClick={() => setCurrentImage(img)}
                        >
                          <img src={`http://localhost:8080${img.imageUrl}`} alt="" />
                        </button>
                    ))}
                  </div>
              )}
            </div>

            {/* Specs */}
            <div className="ad-specs">
              <p className="ad-section-heading">Технические характеристики</p>
              <div className="ad-specs__grid">
                {[
                  { label: 'Год выпуска', value: auction.year ?? '—' },
                  { label: 'Пробег',      value: auction.mileage ? `${auction.mileage.toLocaleString()} км` : '—' },
                  { label: 'КПП',         value: auction.transmission?.name || '—' },
                  { label: 'Топливо',     value: auction.fuelType?.name     || '—' },
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
              <p className="ad-section-heading">Продавец</p>
              <p className="ad-seller__name">{auction.seller?.firstName} {auction.seller?.lastName}</p>
              {isWinner && auction.seller?.email && (<p className="ad-seller__email">{auction.seller.email}</p>)}
            </div>

            {/* Description */}
            <div className="ad-description">
              <p className="ad-section-heading">Описание</p>
              <p className="ad-description__text">{auction.description || 'Описание отсутствует.'}</p>
            </div>

            {/* Bid history */}
            {bidHistory.length > 0 && (
                <div className="ad-history">
                  <p className="ad-section-heading">История ставок</p>
                  <ul className="ad-history__list">
                    {bidHistory.map(bid => (
                        <li key={bid.bidId} className="ad-history__item">
                          <div className="ad-history__who">
                            <span className="ad-history__name">{bid.userName}</span>
                            <span className="ad-history__time">{new Date(bid.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <span className="ad-history__amount">{bid.amount.toLocaleString()} <BynIcon className="ad-currency-icon" /></span>
                        </li>
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
                  {auction.currentPrice?.toLocaleString()}
                  <BynIcon className="ad-currency-icon" />
                </p>
                {rate && (<p className="ad-price__usd">~ ${Math.round(auction.currentPrice / rate).toLocaleString()}</p>)}
              </div>
              <div className="ad-price-card__divider" />
              <div className="ad-price-card__meta">
                <div className="ad-meta-row"><span>Стартовая цена</span><span>{auction.startingPrice?.toLocaleString()} <BynIcon className="ad-currency-icon" /></span></div>
                <div className="ad-meta-row"><span>Минимальный шаг</span><span>{auction.minBidStep} <BynIcon className="ad-currency-icon" /></span></div>
                {auction.status === 'ACTIVE' && (
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
                    <label className="ad-bid-form__label">Ваша ставка</label>
                    <input className="ad-bid-form__input" type="number" placeholder="Сумма в BYN" value={bidAmount} onChange={e => setBidAmount(e.target.value)} disabled={!isActive} />
                    <button className={`ad-btn ad-btn--gold ad-btn--full${!isActive ? ' ad-btn--disabled' : ''}`} onClick={handlePlaceBid} disabled={!isActive}>
                      {isActive ? 'Сделать ставку' : 'Торги завершены'}
                    </button>
                    {bidMsg.text && (<p className={`ad-bid-msg${bidMsg.ok ? ' ad-bid-msg--ok' : ' ad-bid-msg--err'}`}>{bidMsg.text}</p>)}
                  </div>
              ) : (
                  <div className="ad-bid-form" style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-3)', marginBottom: '14px' }}>Войдите, чтобы делать ставки</p>
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
        {isLightboxOpen && auction.images && (
            <div className={`ad-lightbox ${isLightboxOpen ? 'ad-lightbox--open' : ''}`} onClick={closeLightbox}>
              <button className="ad-lightbox__close" onClick={closeLightbox}>×</button>
              {auction.images.length > 1 && <button className="ad-lightbox__nav ad-lightbox__nav--prev" onClick={(e) => { e.stopPropagation(); goToPrevLightbox(); }}>‹</button>}
              <img src={`http://localhost:8080${auction.images[lightboxIndex]?.imageUrl}`} alt="Просмотр" className="ad-lightbox__img" onClick={(e) => e.stopPropagation()} />
              {auction.images.length > 1 && <button className="ad-lightbox__nav ad-lightbox__nav--next" onClick={(e) => { e.stopPropagation(); goToNextLightbox(); }}>›</button>}
              <div className="ad-lightbox__counter">{lightboxIndex + 1} / {auction.images.length}</div>
            </div>
        )}

      </div>
  );
}

export default AuctionDetails;