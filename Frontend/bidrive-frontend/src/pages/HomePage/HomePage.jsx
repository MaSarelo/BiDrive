import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuctionCard from '../../components/AuctionCard';
import './HomePage.css';

/* ── SVG icons ── */
const Ic = ({ children, size = 20 }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor"
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      {children}
    </svg>
);

const ArrowRight = () => <Ic><path d="M5 12h14M12 5l7 7-7 7"/></Ic>;
const IconShield = () => <Ic><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ic>;
const IconZap    = () => <Ic><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Ic>;
const IconLock   = () => <Ic><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Ic>;
const IconSend   = () => <Ic><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Ic>;
const IconUser   = () => <Ic><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ic>;
const IconSearch = () => <Ic><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></Ic>;
const IconGavel  = () => <Ic><path d="m14.5 2.5 7 7-10 10-7-7z"/><path d="M2 22l6-6"/></Ic>;
const IconCheck  = () => <Ic><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Ic>;

const ADVANTAGES = [
  { icon: <IconShield />, title: 'Проверенные лоты', desc: 'Каждое объявление проходит ручную модерацию' },
  { icon: <IconZap />,    title: 'Онлайн-торги',     desc: 'Ставки и обновления цен в реальном времени' },
  { icon: <IconLock />,   title: 'Безопасность',     desc: 'Контакты открываются только победителю' },
  { icon: <IconSend />,   title: 'Telegram-бот',     desc: 'Мгновенные уведомления о появлении нового лота' },
];

const STEPS = [
  { n: '01', icon: <IconUser   />, title: 'Регистрация', desc: 'Создайте аккаунт за минуту — это бесплатно' },
  { n: '02', icon: <IconSearch />, title: 'Выбор авто',   desc: 'Используйте фильтры, чтобы найти свой вариант' },
  { n: '03', icon: <IconGavel  />, title: 'Торги',       desc: 'Делайте ставки и следите за ходом аукциона' },
  { n: '04', icon: <IconCheck  />, title: 'Сделка',      desc: 'Обменяйтесь контактами с продавцом' },
];

export default function HomePage() {
  const [lots,    setLots]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [userEmail]            = useState(() => localStorage.getItem('userEmail'));
  const revealRefs             = useRef([]);

  // === ФУНКЦИЯ ЗАГРУЗКИ ЛОТОВ ===
  const fetchLots = () => {
    axios.get('http://localhost:8080/api/auctions')
        .then(r  => {
          setLots(r.data.slice(0, 6));
          setLoading(false);
        })
        .catch(() => {
          setError('Не удалось загрузить лоты.');
          setLoading(false);
        });
  };

  // === ЗАГРУЗКА И POLLING ===
  useEffect(() => {
    // 1. Первичная загрузка
    fetchLots();

    // 2. Запускаем автообновление каждые 10 секунд
    const intervalId = setInterval(fetchLots, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // === ЛОГИКА АНИМАЦИИ ПОЯВЛЕНИЯ ===
  useEffect(() => {
    const io = new IntersectionObserver(
        entries => entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
        }),
        { threshold: 0.06 }
    );
    const els = revealRefs.current;
    els.forEach(el => el && io.observe(el));
    return () => els.forEach(el => el && io.unobserve(el));
  }, [loading]);

  const r = el => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };

  return (
      <div className="hp">

        {/* ════ HERO ════ */}
        <section className="hp-hero">
          <div className="hp-wrap">

            <div className="hp-hero__content">
              <span className="hp-hero__badge">Онлайн-аукцион · Беларусь</span>
              <h1 className="hp-hero__h1">
                Прозрачные торги<br />проверенными<br />автомобилями
              </h1>
              <p className="hp-hero__sub">
                Надежная площадка для покупки и продажи авто с честной системой ставок и защитой участников.
              </p>
              <div className="hp-hero__actions">
                <Link to="/catalog" className="hp-btn hp-btn--primary hp-btn--lg">
                  Перейти в каталог <ArrowRight />
                </Link>
                {!userEmail && (
                    <Link to="/register" className="hp-btn hp-btn--ghost hp-btn--lg">
                      Создать аккаунт
                    </Link>
                )}
              </div>
            </div>

            {/* Сетка преимуществ */}
            <div className="hp-hero-advantages">
              {ADVANTAGES.map(({ icon, title, desc }) => (
                  <div key={title} className="hp-adv-item">
                    <div className="hp-adv-item__icon">{icon}</div>
                    <div className="hp-adv-item__text">
                      <h3 className="hp-adv-item__title">{title}</h3>
                      <p className="hp-adv-item__desc">{desc}</p>
                    </div>
                  </div>
              ))}
            </div>

          </div>
        </section>

        {/* ════ LOTS ════ */}
        <section className="hp-lots">
          <div className="hp-wrap">
            <div className="hp-reveal" ref={r}>
              <div className="hp-section-head">
                <div>
                  <p className="hp-eyebrow">Актуальные предложения</p>
                  <h2 className="hp-h2">Лоты в продаже</h2>
                </div>
                <Link to="/catalog" className="hp-more">Все лоты <ArrowRight /></Link>
              </div>
            </div>

            {error ? (
                <p className="hp-msg hp-msg-err">{error}</p>
            ) : loading ? (
                <div className="hp-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="hp-skel" />)}</div>
            ) : lots.length ? (
                <div className={`hp-grid hp-grid--${Math.min(lots.length, 3)}`}>
                  {lots.map((a, i) => (
                      <div key={a.id} className="hp-card-enter" style={{ animationDelay: `${i * 0.07}s` }}>
                        <AuctionCard auction={a} />
                      </div>
                  ))}
                </div>
            ) : (
                <p className="hp-msg">Активных лотов пока нет.</p>
            )}
          </div>
        </section>

        {/* ════ HOW IT WORKS ════ */}
        <section className="hp-how-section">
          <div className="hp-wrap">
            <div className="hp-reveal" ref={r} style={{ textAlign: 'center' }}>
              <p className="hp-eyebrow">Как это работает</p>
              <h2 className="hp-h2">4 шага к вашему авто</h2>
            </div>
            <div className="hp-steps-grid hp-reveal" ref={r}>
              {STEPS.map(({ n, icon, title, desc }) => (
                  <div className="hp-step" key={n}>
                    <div className="hp-step__num">Шаг {n}</div>
                    <div className="hp-step__icon">{icon}</div>
                    <h3 className="hp-step__title">{title}</h3>
                    <p className="hp-step__desc">{desc}</p>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ CTA ════ */}
        {!userEmail && (
            <section className="hp-cta">
              <div className="hp-wrap">
                <div className="hp-cta__inner hp-reveal" ref={r}>
                  <div className="hp-cta__body">
                    <p className="hp-cta__label">Бесплатно</p>
                    <h2 className="hp-cta__title">Готовы найти свой автомобиль?</h2>
                    <p className="hp-cta__sub">Присоединяйтесь к участникам аукциона BiDrive.</p>
                  </div>
                  <Link to="/register" className="hp-btn hp-btn--primary hp-btn--lg hp-cta__btn">
                    Создать аккаунт <ArrowRight />
                  </Link>
                </div>
              </div>
            </section>
        )}

        {/* ════ FOOTER ════ */}
        <footer className="hp-footer">
          <div className="hp-wrap hp-footer__grid">
            <div>
              <p className="hp-footer__logo">BiDrive</p>
              <p className="hp-footer__about">
                Онлайн-аукцион автомобилей в Беларуси. Прозрачно и безопасно.
              </p>
            </div>
            <div>
              <p className="hp-footer__col-title">Навигация</p>
              <ul className="hp-footer__list">
                <li><Link to="/catalog">Каталог</Link></li>
                <li><Link to="/rules">Правила платформы</Link></li>
                <li>
                  <Link to={userEmail ? '/profile' : '/login'}>
                    {userEmail ? 'Личный кабинет' : 'Войти'}
                  </Link>
                </li>
                {!userEmail && <li><Link to="/register">Регистрация</Link></li>}
              </ul>
            </div>
            <div>
              <p className="hp-footer__col-title">Контакты</p>
              <ul className="hp-footer__list">
                <li><a href="https://t.me/MyBiDriveBot_bot" target="_blank" rel="noreferrer">Telegram Bot</a></li>
                <li><a href="mailto:support@bidrive.by">support@bidrive.by</a></li>
              </ul>
            </div>
          </div>
          <div className="hp-footer__bottom">
            <div className="hp-wrap">
              <p>© {new Date().getFullYear()} BiDrive. Дипломный проект.</p>
            </div>
          </div>
        </footer>

      </div>
  );
}