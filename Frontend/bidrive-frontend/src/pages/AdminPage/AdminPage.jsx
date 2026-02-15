import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css';

function AdminPage() {
  const [pendingAuctions, setPendingAuctions] = useState([]);
  const [users, setUsers] = useState([]);

  // Загрузка данных
  useEffect(() => {
    // 1. Загружаем лоты на модерации
    axios.get('http://localhost:8080/api/auctions/pending')
      .then(res => setPendingAuctions(res.data))
      .catch(err => console.error("Ошибка загрузки лотов", err));

    // 2. Загружаем всех пользователей
    axios.get('http://localhost:8080/api/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error("Ошибка загрузки пользователей", err));
  }, []);

  // === ФУНКЦИИ АДМИНА ===

  // Одобрить лот
  const handleApprove = (id) => {
    axios.put(`http://localhost:8080/api/auctions/${id}/approve`)
      .then(() => {
        alert("Лот одобрен!");
        // Убираем из списка
        setPendingAuctions(pendingAuctions.filter(a => a.id !== id));
      })
      .catch(err => alert("Ошибка: " + err.message));
  };

  // Заблокировать пользователя
  const handleBlock = (userId, currentStatus) => {
    const newStatus = !currentStatus; // Инвертируем
    axios.put(`http://localhost:8080/api/users/${userId}/block`, null, {
      params: { isBlocked: newStatus }
    })
    .then(() => {
      alert(newStatus ? "Пользователь заблокирован" : "Пользователь разблокирован");
      // Обновляем список пользователей в стейте
      setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: newStatus } : u));
    })
    .catch(err => alert("Ошибка: " + err.message));
  };

  return (
    <div className="admin-container">
      <h1>Панель администратора</h1>

      {/* СЕКЦИЯ 1: МОДЕРАЦИЯ ЛОТОВ */}
      <div className="admin-section">
        <h2>🛠 Модерация объявлений ({pendingAuctions.length})</h2>

        {pendingAuctions.length === 0 ? (
          <p>Нет объявлений, ожидающих проверки.</p>
        ) : (
          <div className="admin-grid">
            {pendingAuctions.map(auction => (
              <div key={auction.id} className="admin-card">
                <div>
                  <h3>{auction.brand?.name} {auction.model?.name}</h3>
                  <p><strong>Год:</strong> {auction.year}</p>
                  <p><strong>Цена:</strong> {auction.startingPrice} $</p>
                  <p><strong>Продавец ID:</strong> {auction.seller?.id} ({auction.seller?.firstName})</p>
                  <p><em>{auction.description?.substring(0, 50)}...</em></p>
                </div>
                <div className="admin-actions">
                  <button className="btn-approve" onClick={() => handleApprove(auction.id)}>
                    ✅ Одобрить
                  </button>
                  {/* Кнопку "Отклонить" можно добавить потом, пока просто одобряем */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* СЕКЦИЯ 2: УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ */}
      <div className="admin-section">
        <h2>👥 Управление пользователями</h2>

        <div className="user-list">
          {users.map(user => (
            <div key={user.id} className="user-item">
              <div className="user-info">
                <strong>{user.firstName} {user.lastName}</strong>
                <span>({user.email})</span>
                {user.isBlocked && <span style={{color: 'red', marginLeft: '10px'}}> [ЗАБЛОКИРОВАН]</span>}
                {user.roleId === 2 && <span style={{color: 'green', marginLeft: '10px'}}> [ADMIN]</span>}
              </div>

              {/* Не даем блокировать самого себя (админа) или другого админа легко */}
              {user.roleId !== 2 && (
                <button
                  onClick={() => handleBlock(user.id, user.isBlocked)}
                  className={user.isBlocked ? 'btn-unblock' : 'btn-block'}
                >
                  {user.isBlocked ? '🔓 Разблокировать' : '🚫 Заблокировать'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;