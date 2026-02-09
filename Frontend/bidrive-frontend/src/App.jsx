import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import AuctionCard from './components/AuctionCard';
import AuctionDetails from './pages/AuctionDetails/AuctionDetails';
import CreateAuction from './pages/CreateAuction/CreateAuction';
import Profile from './pages/Profile/Profile';
import Login from './pages/Login/Login';
import Register from "./pages/Register/Register";
import './App.css';

function AppContent() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');

  const location = useLocation(); // <— ключевой момент

  // Загружаем бренды один раз
  useEffect(() => {
    axios.get('http://localhost:8080/api/brands')
      .then(response => setBrands(response.data))
      .catch(error => console.error('Ошибка загрузки брендов:', error));
  }, []);

  // Функция загрузки аукционов
  const fetchAuctions = () => {
    if (auctions.length === 0) setLoading(true);

    let url = 'http://localhost:8080/api/auctions';
    if (selectedBrand) {
      url = `http://localhost:8080/api/auctions/search?brandId=${selectedBrand}`;
    }

    axios.get(url)
      .then(response => {
        setAuctions(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Ошибка:', error);
        setLoading(false);
      });
  };

  // Загружаем аукционы при смене фильтра
  useEffect(() => {
    if (location.pathname === "/") {
      fetchAuctions();
    }
  }, [selectedBrand, location.pathname]);

  // Автообновление ТОЛЬКО на главной странице
  useEffect(() => {
    if (location.pathname !== "/") return;

    const interval = setInterval(() => {
      fetchAuctions();
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedBrand, location.pathname]);

  return (
    <Layout>
      {loading && auctions.length === 0 ? (
        <div className="loading-spinner">Загрузка данных...</div>
      ) : (
        <Routes>
          {/* Главная */}
          <Route path="/" element={
            <>
              <div className="filter-bar">
                <label>Фильтр по марке: </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                >
                  <option value="">Все марки</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>

                {selectedBrand && (
                  <button className="btn-reset" onClick={() => setSelectedBrand('')}>
                    Сбросить
                  </button>
                )}
              </div>

              <div className="auction-grid">
                {auctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
                {auctions.length === 0 && <p>Ничего не найдено.</p>}
              </div>
            </>
          } />

          {/* Вход */}
          <Route path="/login" element={<Login />} />

          {/* Регистрация */}
          <Route path="/register" element={<Register />} />

          {/* Профиль */}
          <Route path="/profile" element={<Profile />} />

          {/* Создание лота */}
          <Route path="/create" element={<CreateAuction />} />

          {/* Детали лота */}
          <Route path="/auction/:id" element={<AuctionDetails />} />
        </Routes>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
