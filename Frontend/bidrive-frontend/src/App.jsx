import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import AuctionCard from './components/AuctionCard';
import AuctionDetails from './pages/AuctionDetails/AuctionDetails';
import CreateAuction from './pages/CreateAuction/CreateAuction';
import Profile from './pages/Profile/Profile';
import Login from './pages/Login/Login';
import './App.css';

function App() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Состояния для фильтрации
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');

  useEffect(() => {
    // Загрузка брендов
    axios.get('http://localhost:8080/api/brands')
      .then(response => {
        setBrands(response.data);
      })
      .catch(error => console.error('Ошибка загрузки брендов:', error));

    // Загрузка аукционов
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
  }, [selectedBrand]);

  return (
    <Router>
      <Layout>
        {loading ? (
          <div className="loading-spinner">Загрузка данных...</div>
        ) : (
          <Routes>
            {/* Главная: Каталог */}
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
                    <button
                      className="btn-reset"
                      onClick={() => setSelectedBrand('')}
                    >
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

            {/* Профиль */}
            <Route path="/profile" element={<Profile />} />

            {/* Создание лота */}
            <Route path="/create" element={<CreateAuction />} />

            {/* Детали лота */}
            <Route path="/auction/:id" element={<AuctionDetails />} />
          </Routes>
        )}
      </Layout>
    </Router>
  );
}

export default App;