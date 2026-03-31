import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css';

export function AdminPage() {
  const [pendingAuctions, setPendingAuctions] = useState([]);
  const [users,           setUsers]           = useState([]);
  const [stats,           setStats]           = useState({
    totalUsers: 0, activeAuctions: 0, totalBids: 0, totalTurnover: 0
  });

  useEffect(() => {
    axios.get('http://localhost:8080/api/auctions/pending')
        .then(r => setPendingAuctions(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/users')
        .then(r => setUsers(r.data)).catch(console.error);
    axios.get('http://localhost:8080/api/admin/stats')
        .then(r => setStats(r.data)).catch(console.error);
  }, []);

  const handleApprove = id => {
    axios.put(`http://localhost:8080/api/auctions/${id}/approve`)
        .then(() => setPendingAuctions(p => p.filter(a => a.id !== id)))
        .catch(err => alert('Ошибка: ' + err.message));
  };

  const handleBlock = (userId, current) => {
    const next = !current;
    axios.put(`http://localhost:8080/api/users/${userId}/block`, null, { params: { isBlocked: next } })
        .then(() => setUsers(p => p.map(u => u.id === userId ? { ...u, isBlocked: next } : u)))
        .catch(err => alert('Ошибка: ' + err.message));
  };

  const STAT_ITEMS = [
    { num: stats.totalUsers,                   label: 'Пользователей' },
    { num: stats.activeAuctions,               label: 'Активных лотов' },
    { num: stats.totalBids,                    label: 'Всего ставок' },
    { num: stats.totalTurnover?.toLocaleString() ?? 0, label: 'Оборот, BYN' },
  ];

  return (
      <div className="ap">
        {/* Hero */}
        <div className="ap-hero">
          <div className="ap-wrap">
            <p className="ap-eyebrow">Панель управления</p>
            <h1 className="ap-title">Администратор</h1>
          </div>
        </div>

        <div className="ap-wrap ap-body">

          {/* Статистика */}
          <div className="ap-stats">
            {STAT_ITEMS.map(({ num, label }) => (
                <div className="ap-stat" key={label}>
                  <span className="ap-stat__num">{num}</span>
                  <span className="ap-stat__label">{label}</span>
                </div>
            ))}
          </div>

          {/* Модерация лотов */}
          <div className="ap-section">
            <p className="ap-section-heading">
              Модерация лотов ({pendingAuctions.length})
            </p>
            {pendingAuctions.length === 0 ? (
                <div className="ap-empty">Нет лотов, ожидающих проверки</div>
            ) : (
                <div className="ap-grid">
                  {pendingAuctions.map(a => (
                      <div key={a.id} className="ap-card">
                        <div className="ap-card__body">
                          <p className="ap-card__name">
                            {a.brand?.name} {a.model?.name}
                          </p>
                          <div className="ap-card__row">
                            <span className="ap-card__label">Год</span>
                            <span className="ap-card__val">{a.year}</span>
                          </div>
                          <div className="ap-card__row">
                            <span className="ap-card__label">Цена</span>
                            <span className="ap-card__val">
                        {a.startingPrice?.toLocaleString()} BYN
                      </span>
                          </div>
                          <div className="ap-card__row">
                            <span className="ap-card__label">Продавец</span>
                            <span className="ap-card__val">
                        {a.seller?.firstName} #{a.seller?.id}
                      </span>
                          </div>
                          {a.description && (
                              <p className="ap-card__desc">
                                {a.description.substring(0, 80)}...
                              </p>
                          )}
                        </div>
                        <div className="ap-card__actions">
                          <button className="ap-btn ap-btn--approve"
                                  onClick={() => handleApprove(a.id)}>
                            Одобрить
                          </button>
                        </div>
                      </div>
                  ))}
                </div>
            )}
          </div>

          {/* Пользователи */}
          <div className="ap-section">
            <p className="ap-section-heading">
              Пользователи ({users.length})
            </p>
            <div className="ap-users">
              {users.map(u => (
                  <div key={u.id} className="ap-user">
                    <div className="ap-user__info">
                  <span className="ap-user__name">
                    {u.firstName} {u.lastName}
                  </span>
                      <span className="ap-user__email">{u.email}</span>
                      <div className="ap-user__tags">
                        {u.isBlocked && <span className="ap-tag ap-tag--blocked">Заблокирован</span>}
                        {u.roleId === 2 && <span className="ap-tag ap-tag--admin">Admin</span>}
                      </div>
                    </div>
                    {u.roleId !== 2 && (
                        <button
                            className={`ap-btn ${u.isBlocked ? 'ap-btn--unblock' : 'ap-btn--block'}`}
                            onClick={() => handleBlock(u.id, u.isBlocked)}
                        >
                          {u.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                    )}
                  </div>
              ))}
            </div>
          </div>

        </div>
      </div>
  );
}

export default AdminPage;