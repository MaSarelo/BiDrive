import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuctionCard from '../../components/AuctionCard';
import './HomePage.css';

function HomePage() {
  const [featuredLots, setFeaturedLots]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [isLoggedIn, setIsLoggedIn]       = useState(false);
  const [scrolled, setScrolled]           = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    axios.get('http://localhost:8080/api/auctions')
      .then(res  => { setFeaturedLots(res.data.slice(0, 6)); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const pillars = [
    {
      title: 'Подлинность',
      text:  'Каждый автомобиль проходит многоуровневую техническую экспертизу до выхода на торги.',
    },
    {
      title: 'Конфиденциальность',
      text:  'Ваши данные и условия сделки остаются строго между покупателем, продавцом и платформой.',
    },
    {
      title: 'Безупречный сервис',
      text:  'Персональный куратор сопровождает вас от первой ставки до передачи ключей.',
    },
  ];

  return (
    <div className="rr">


      {/* ── HERO ── */}
      <section className="rr-hero">
        {/* Cinematic overlay */}
        <div className="rr-hero__overlay" aria-hidden="true" />

        <div className="rr-hero__content">
          <p className="rr-hero__eyebrow">Аукцион исключительных автомобилей</p>
          <h1 className="rr-hero__title">
            Искусство<br />владеть лучшим
          </h1>
          <div className="rr-hero__divider" aria-hidden="true" />
          <p className="rr-hero__sub">
            BiDrive — закрытая площадка для тех, кто ценит безупречное качество.<br />
            Прозрачные торги. Проверенные продавцы. Полное сопровождение.
          </p>
          <div className="rr-hero__actions">
            <Link to="/catalog" className="rr-btn rr-btn--gold rr-btn--lg">
              Открыть каталог
            </Link>
            {!isLoggedIn && (
              <Link to="/register" className="rr-btn rr-btn--outline rr-btn--lg">
                Стать участником
              </Link>
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="rr-hero__scroll" aria-hidden="true">
          <span className="rr-hero__scroll-line" />
          <span className="rr-hero__scroll-text">Прокрутите</span>
        </div>
      </section>

      {/* ── FEATURED LOTS ── */}
      <section className="rr-lots">
        <div className="rr-container">
          <header className="rr-section-head">
            <p className="rr-section-head__eyebrow">Торги открыты</p>
            <h2 className="rr-section-head__title">Актуальные лоты</h2>
            <Link to="/catalog" className="rr-section-head__more">
              Смотреть весь каталог&ensp;→
            </Link>
          </header>

          {loading ? (
            <div className="rr-skeleton-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rr-skeleton" />
              ))}
            </div>
          ) : featuredLots.length > 0 ? (
            <div className="rr-lots__grid">
              {featuredLots.map(a => <AuctionCard key={a.id} auction={a} />)}
            </div>
          ) : (
            <p className="rr-empty">На данный момент активных лотов нет.</p>
          )}
        </div>
      </section>

      {/* ── PILLARS ── */}
      <section className="rr-pillars" id="pillars">
        <div className="rr-container">
          <header className="rr-section-head rr-section-head--center">
            <p className="rr-section-head__eyebrow">Наши принципы</p>
            <h2 className="rr-section-head__title">Три столпа BiDrive</h2>
          </header>
          <div className="rr-pillars__grid">
            {pillars.map((p, i) => (
              <div key={i} className="rr-pillar">
                <span className="rr-pillar__num">{String(i + 1).padStart(2, '0')}</span>
                <div className="rr-pillar__line" aria-hidden="true" />
                <h3 className="rr-pillar__title">{p.title}</h3>
                <p  className="rr-pillar__text">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE INTERLUDE ── */}
      <section className="rr-quote">
        <div className="rr-container">
          <blockquote className="rr-quote__body">
            «Автомобиль — это не просто транспорт.<br />
            Это выражение характера своего владельца.»
          </blockquote>
          <p className="rr-quote__attr">— Философия BiDrive</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="rr-process">
        <div className="rr-container">
          <header className="rr-section-head rr-section-head--center">
            <p className="rr-section-head__eyebrow">Участие в торгах</p>
            <h2 className="rr-section-head__title">Четыре шага до победы</h2>
          </header>
          <ol className="rr-steps">
            {[
              { t: 'Регистрация',      d: 'Создайте аккаунт и пройдите верификацию — это занимает менее минуты.' },
              { t: 'Выбор автомобиля', d: 'Изучите подробные карточки лотов с историей, пробегом и экспертным заключением.' },
              { t: 'Ставка',           d: 'Участвуйте в торгах в режиме реального времени. Шаг ставки указан в лоте.' },
              { t: 'Сделка',           d: 'Ваш куратор оформит все документы и организует передачу автомобиля.' },
            ].map((s, i) => (
              <li key={i} className="rr-step">
                <span className="rr-step__num">{String(i + 1).padStart(2, '0')}</span>
                <div className="rr-step__body">
                  <h3 className="rr-step__title">{s.t}</h3>
                  <p  className="rr-step__desc">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ── */}
      {!isLoggedIn && (
        <section className="rr-cta">
          <div className="rr-container rr-cta__inner">
            <h2 className="rr-cta__title">Готовы участвовать в торгах?</h2>
            <p  className="rr-cta__sub">Регистрация открыта — присоединяйтесь к сообществу ценителей.</p>
            <Link to="/register" className="rr-btn rr-btn--gold rr-btn--lg">
              Создать аккаунт
            </Link>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="rr-footer" id="contact">
        <div className="rr-container rr-footer__grid">
          <div className="rr-footer__brand">
            <p className="rr-footer__wordmark">BiDrive</p>
            <p className="rr-footer__tagline">
              Платформа онлайн-аукционов премиальных автомобилей.<br />
              Прозрачно. Безопасно. Исключительно.
            </p>
          </div>
          <div>
            <p className="rr-footer__col-title">Навигация</p>
            <ul className="rr-footer__list">
              <li><Link to="/catalog">Каталог</Link></li>
              <li><Link to="/register">Регистрация</Link></li>
              <li><a href="#">Правила участия</a></li>
            </ul>
          </div>
          <div>
            <p className="rr-footer__col-title">Контакты</p>
            <ul className="rr-footer__list">
              <li><a href="mailto:support@bidrive.by">support@bidrive.by</a></li>
              <li>
                <a href="https://t.me/bidrive_bot" target="_blank" rel="noopener noreferrer">
                  Telegram
                </a>
              </li>
              <li>+375 (29) 123-45-67</li>
            </ul>
          </div>
        </div>
        <div className="rr-footer__bottom">
          <p>© 2026 BiDrive. Дипломный проект. Все права защищены.</p>
        </div>
      </footer>

    </div>
  );
}

export default HomePage;