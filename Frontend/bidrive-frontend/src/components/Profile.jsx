import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

function Profile() {
  // Получаем ID пользователя из хранилища
  const [userId] = useState(() => parseInt(localStorage.getItem('userId') || '2'));
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logoutMsg, setLogoutMsg] = useState('');
  const userEmail = localStorage.getItem('userEmail');

  // Загружаем аукционы пользователя при заходе
  useEffect(() => {
    if (userId) {
        axios.get(`http://localhost:8080/api/auctions/my?sellerId=${userId}`)
          .then(res => {
            setAuctions(res.data);
            setLoading(false);
          })
          .catch(err => {
            console.error(err);
            setLoading(false);
          });
    } else {
        setLoading(false); // Если пользователя нет, просто не грузим
    }
  }, [userId]); // Зависимость от ID

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    setLogoutMsg('Вы вышли из системы');
    setTimeout(() => window.location.href = '/', 1500);
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="profile-container">
      <div className="header-profile">
        <h1>Личный кабинет</h1>
        <p className="user-info">Вы вошли как: <strong>{userEmail}</strong></p>
        <button onClick={handleLogout} className="logout-btn">Выйти</button>
        {logoutMsg && <p className="logout-msg">{logoutMsg}</p>}
      </div>

      <div className="actions">
        <Link to="/create" className="action-btn">
          + Выставить лот
        </Link>
      </div>

      <h2>Мои активные аукционы</h2>
      {auctions.length === 0 && <p className="no-lots">У вас пока нет активных лотов.</p>}

      <div className="auction-grid">
        {auctions.map(auction => (
          <Link key={auction.id} to={`/auction/${auction.id}`} className="card-link">
            <div className="card">
                {/* Используем mainImageUrl или заглушку */}
                <div className="card-image">
                    <img
                        src={auction.mainImageUrl ? `http://localhost:8080${auction.mainImageUrl}` : 'https://via.placeholder.com/300x200?text=No+Image'}
                        alt="Car"
                    />
                </div>
                <h3>{auction.brand?.name} {auction.model?.name}</h3>
                <p className="price">{auction.currentPrice} $</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Profile;