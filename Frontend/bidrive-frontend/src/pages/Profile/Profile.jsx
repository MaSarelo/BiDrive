import { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

function Profile() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = localStorage.getItem('userId'); // ID текущего пользователя

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');

    if (currentUserId) {
      // Загружаем все лоты пользователя
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

  // === ФУНКЦИИ ДЕЙСТВИЙ ===

  // 1. Удалить
  const handleDelete = (id) => {
    if (window.confirm("Вы уверены, что хотите удалить лот?")) {
      axios.delete(`http://localhost:8080/api/auctions/${id}`, { params: { userId: currentUserId } })
        .then(() => {
          // Удаляем лот из списка без перезагрузки страницы
          setAuctions(auctions.filter(a => a.id !== id));
        })
        .catch(err => alert("Ошибка удаления: " + (err.response?.data || "Нет прав")));
    }
  };

  // 2. Опубликовать
  const handlePublish = (id) => {
    axios.put(`http://localhost:8080/api/auctions/${id}/publish`, null, { params: { userId: currentUserId } })
      .then(() => {
        alert("Лот опубликован!");
        // Обновляем статус лота в локальном стейте
        setAuctions(auctions.map(a =>
          a.id === id ? { ...a, status: "ACTIVE" } : a
        ));
      })
      .catch(err => alert("Ошибка: " + (err.response?.data || "Нет прав")));
  };

  // 3. Завершить торги
  const handleFinish = (id) => {
    if (window.confirm("Завершить торги и назначить победителя?")) {
      axios.put(`http://localhost:8080/api/auctions/${id}/finish`, null, { params: { userId: currentUserId } })
        .then(() => {
          alert("Торги завершены!");
          setAuctions(auctions.map(a =>
            a.id === id ? { ...a, status: "FINISHED" } : a
          ));
        })
        .catch(err => alert("Ошибка: " + (err.response?.data || "Нет прав")));
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return '🟢 Активен';
      case 'DRAFT': return '📝 Черновик';
      case 'PENDING': return '⏳ На проверке';
      case 'FINISHED': return '🏁 Завершен';
      case 'CANCELLED': return '🚫 Удален';
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

            <div className="status-badge profile-status">
              {getStatusText(auction.status)}
            </div>

            <p><strong>Цена:</strong> {auction.currentPrice} $</p>
            <p><strong>Создан:</strong> {new Date(auction.createdAt).toLocaleDateString()}</p>

            {/* Панель действий */}
            <div className="card-actions">
                {/* Кнопка: Опубликовать (если статус DRAFT или PENDING) */}
                {(auction.status === 'DRAFT' || auction.status === 'PENDING') && (
                    <button onClick={() => handlePublish(auction.id)} className="action-btn btn-publish">
                        🚀 Опубликовать
                    </button>
                )}

                {/* Кнопка: Завершить (если статус ACTIVE) */}
                {auction.status === 'ACTIVE' && (
                    <button onClick={() => handleFinish(auction.id)} className="action-btn btn-finish">
                        🏁 Завершить торги
                    </button>
                )}

                {/* Кнопка: Удалить (если НЕ ACTIVE и НЕ FINISHED) */}
                {auction.status !== 'ACTIVE' && auction.status !== 'FINISHED' && (
                    <button onClick={() => handleDelete(auction.id)} className="action-btn btn-delete">
                        🗑️ Удалить
                    </button>
                )}
            </div>
          </div>
        ))}

        {auctions.length === 0 && <p>У вас пока нет лотов.</p>}
      </div>
    </div>
  );
}

export default Profile;