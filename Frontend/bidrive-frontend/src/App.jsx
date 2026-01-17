import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Импорт роутера
import axios from 'axios';
import AuctionCard from './components/AuctionCard';
import AuctionDetails from './components/AuctionDetails'; // Импорт новой страницы
import './App.css';

function App() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8080/api/auctions')
      .then(response => {
        setAuctions(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Ошибка:', error);
        setLoading(false);
      });
  }, []);

  return (
    <Router>
      <div className="container">
        {/* Заголовок показывается всегда */}
        <h1>🚗 Аукционы BiDrive</h1>

        <Routes>
          {/* Роут для главной страницы (список) */}
          <Route path="/" element={
            loading ? <div className="loading">Загрузка данных из базы...</div> : (
              <div className="auction-grid">
                {auctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            )
          } />

          {/* Роут для страницы деталей (лот с ID) */}
          <Route path="/auction/:id" element={<AuctionDetails />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;