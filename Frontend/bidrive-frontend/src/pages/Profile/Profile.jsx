import { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

function Profile() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');

    if (currentUserId) {
      axios.get(`http://localhost:8080/api/auctions/my?sellerId=${currentUserId}`)
        .then(response => {
          setAuctions(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Ошибка загрузки профиля:', error);
          setLoading(false);
        });
    }
  }, []);

  // Функция перевода статусов (как в AuctionCard)
  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return '🟢 Активен';
      case 'DRAFT': return '📝 Черновик';
      case 'PENDING': return '⏳ На проверке';
      case 'FINISHED': return '🏁 Завершен';
      default: return status;
    }
  };

  if (loading) return <div className="loading-spinner">Загрузка профиля...</div>;

  return (
    <div className="profile-container">
      <h1>Мой Кабинет</h1>

      <div className="profile-stats">
        <p>Всего лотов: {auctions.length}</p>
      </div>

      <div className="auction-grid">
        {auctions.map((auction) => (
          <div key={auction.id} className="card profile-card">
            <h3>{auction.brand.name} {auction.model.name}</h3>

            <p><strong>Год:</strong> {auction.year}</p>
            <p><strong>Цена:</strong> {auction.currentPrice} $</p>

            {/* Показываем статус */}
            <div className="status-badge profile-status">
              {getStatusText(auction.status)}
            </div>

            <p className="date">Создан: {new Date(auction.createdAt).toLocaleDateString()}</p>
          </div>
        ))}

        {auctions.length === 0 && <p>У вас пока нет лотов.</p>}
      </div>
    </div>
  );
}

export default Profile;