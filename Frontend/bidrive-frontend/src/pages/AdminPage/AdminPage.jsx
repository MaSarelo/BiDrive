import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css';

function AdminPage() {
  const [pendingAuctions, setPendingAuctions] = useState([]);
  const [users, setUsers] = useState([]);

  // === НОВАЯ СТАТИСТИКА ===
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeAuctions: 0,
    totalBids: 0,
    totalTurnover: 0
  });

  useEffect(() => {
    // 1. Загружаем лоты на модерации
    axios.get('http://localhost:8080/api/auctions/pending')
      .then(res => setPendingAuctions(res.data))
      .catch(err => console.error("Ошибка загрузки лотов", err));

    // 2. Загружаем всех пользователей
    axios.get('http://localhost:8080/api/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error("Ошибка загрузки пользователей", err));

    // 3. === ЗАГРУЖАЕМ СТАТИСТИКУ (ВЫЗОВ ФУНКЦИИ БД) ===
    axios.get('http://localhost:8080/api/admin/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error("Ошибка загрузки статистики", err));
  }, []);

  // Функции approve/block (как были)
  const handleApprove = (id) => {
    axios.put(`http://localhost:8080/api/auctions/${id}/approve`)
      .then(() => {
        alert("Лот одобрен!");
        setPendingAuctions(pendingAuctions.filter(a => a.id !== id));
      })
      .catch(err => alert("Ошибка: " + err.message));
  };

  const handleBlock = (userId, currentStatus) => {
    const newStatus = !currentStatus;
    axios.put(`http://localhost:8080/api/users/${userId}/block`, null, {
      params: { isBlocked: newStatus }
    })
    .then(() => {
      alert(newStatus ? "Пользователь заблокирован" : "Пользователь разблокирован");
      setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: newStatus } : u));
    })
    .catch(err => alert("Ошибка: " + err.message));
  };

  return (
    <div className="admin-container">
      <h1>Панель администратора</h1>

      {/* === НОВЫЙ БЛОК: СТАТИСТИКА (ИЗ ФУНКЦИИ БД) === */}
      <div className="admin-section">
        <h2>📊 Общая статистика</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Всего пользователей</h3>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Активных лотов</h3>
            <p className="stat-value">{stats.activeAuctions}</p>
          </div>
          <div className="stat-card">
            <h3>Всего ставок</h3>
            <p className="stat-value">{stats.totalBids}</p>
          </div>
          <div className="stat-card">
            <h3>Оборот (BYN)</h3>
            <p className="stat-value">{stats.totalTurnover ? stats.totalTurnover.toLocaleString() : 0}</p>
          </div>
        </div>
      </div>

      {/* Секция 1: Модерация лотов (как было) */}
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
                  <p><strong>Цена:</strong> {auction.startingPrice} BYN</p>
                  <p><strong>Продавец ID:</strong> {auction.seller?.id} ({auction.seller?.firstName})</p>
                  <p><em>{auction.description?.substring(0, 50)}...</em></p>
                </div>
                <div className="admin-actions">
                  <button className="btn-approve" onClick={() => handleApprove(auction.id)}>
                    ✅ Одобрить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Секция 2: Пользователи (как было) */}
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