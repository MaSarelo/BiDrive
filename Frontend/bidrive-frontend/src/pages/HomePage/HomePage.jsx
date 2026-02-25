import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuctionCard from '../../components/AuctionCard'; // Используем готовую карточку
import './HomePage.css';

function HomePage() {
  const [featuredLots, setFeaturedLots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Загружаем 4 активных лота для главной страницы
  useEffect(() => {
    axios.get('http://localhost:8080/api/auctions')
      .then(res => {
        // Берем первые 4 лота
        setFeaturedLots(res.data.slice(0, 4));
        setLoading(false);
      })
      .catch(err => {
        console.error("Ошибка загрузки лотов", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="home-page">

      {/* === HERO SECTION (Баннер) === */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Аукционы автомобилей</h1>
          <p>Лучшие машины по лучшим ценам. Участвуйте, выигрывайте и становитесь владельцем своей мечты.</p>
          <Link to="/catalog" className="hero-btn">
            Перейти к каталогу
          </Link>
        </div>
      </section>

      {/* === POPULAR LOTS (Популярные лоты) === */}
      <section className="container popular-section">
        <h2>🔥 Горячие предложения</h2>
        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <div className="popular-grid">
            {featuredLots.length > 0 ? (
              featuredLots.map(auction => (
                <AuctionCard key={auction.id} auction={auction} />
              ))
            ) : (
              <p className="no-lots-msg">Активных лотов пока нет. Зайдите позже!</p>
            )}
          </div>
        )}

        {featuredLots.length > 0 && (
          <div className="view-all-btn-wrapper">
            <Link to="/catalog" className="view-all-btn">Смотреть все лоты →</Link>
          </div>
        )}
      </section>

      {/* === HOW IT WORKS (Как это работает) === */}
      <section className="how-it-works-section">
        <div className="container">
          <h2>Как это работает?</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Выберите лот</h3>
              <p>Просмотрите доступные автомобили в каталоге</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Сделайте ставку</h3>
              <p>Участвуйте в аукционе онлайн в реальном времени</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Выиграйте</h3>
              <p>Станьте последним, кто сделал ставку</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Получите авто</h3>
              <p>Оплатите и заберите машину или закажите доставку</p>
            </div>
          </div>
        </div>
      </section>

      {/* === FOOTER (Подвал) === */}
      <footer className="home-footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <h3>🚗 BiDrive</h3>
            <p>Платформа онлайн-аукционов автомобилей.</p>
          </div>
          <div className="footer-links">
            <a href="https://t.me/YourBotLink" target="_blank" rel="noopener noreferrer">Telegram Bot</a>
            <Link to="/catalog">Каталог</Link>
            <a href="#">Правила</a>
            <a href="#">Поддержка</a>
          </div>
        </div>
        <div className="footer-copyright">
          <p>© 2026 BiDrive. Все права защищены. Дипломный проект.</p>
        </div>
      </footer>

    </div>
  );
}

export default HomePage;