import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AdminPage.css';

function AdminPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = () => {
    setLoading(true);
      axios.get('http://localhost:8080/api/auctions/pending')
          .then(r => { setAuctions(r.data); setLoading(false); })
        .catch(err => { console.error(err); setLoading(false); });
  };

  const handleApprove = (id) => {
      axios.put(`http://localhost:8080/api/auctions/${id}/approve`)
          .then(() => setAuctions(prev => prev.filter(a => a.id !== id)))
        .catch(err => console.error(err));
  };

  // --- ОБНОВЛЕННАЯ ФУНКЦИЯ ОТКЛОНЕНИЯ ---
  const handleReject = (id) => {
    const reason = prompt("Укажите причину отклонения (обязательно):");

    // Если пользователь ввел текст и нажал OK
    if (reason !== null && reason.trim() !== "") {
        axios.post(`http://localhost:8080/api/auctions/${id}/reject`, null, {
            params: { reason: reason }
      })
          .then(() => {
            setAuctions(prev => prev.filter(a => a.id !== id));
          })
          .catch(err => {
            console.error(err);
            alert("Ошибка при отклонении");
          });
    } else if (reason !== null) {
      alert("Причина обязательна для заполнения.");
    }
  };

  if (loading) return <div className="ap-loading">Загрузка...</div>;

  return (
      <div className="ap">
        <header className="ap-header">
          <div className="ap-header__inner">
            <h1 className="ap-title">Панель модерации</h1>
            <Link to="/" className="ap-back">← На главную</Link>
          </div>
        </header>

        <main className="ap-main">
          {auctions.length === 0 ? (
              <div className="ap-empty">
                <div className="ap-empty__icon">✓</div>
                <p>Все лоты проверены</p>
              </div>
          ) : (
              <div className="ap-list">
                {auctions.map(a => (
                    <article key={a.id} className="ap-card">
                      <div className="ap-card__left">
                        {a.mainImageUrl ? (
                            <img src={`http://localhost:8080${a.mainImageUrl}`} alt="" className="ap-card__img" />
                        ) : (
                            <div className="ap-card__img ap-card__img--empty">Нет фото</div>
                        )}
                      </div>
                      <div className="ap-card__body">
                        <h3 className="ap-card__title">{a.brand?.name} {a.model?.name}</h3>
                        <div className="ap-card__meta">
                          <span>Год: {a.year}</span>
                          <span>Пробег: {a.mileage?.toLocaleString()} км</span>
                          <span>Продавец: {a.seller?.firstName}</span>
                        </div>
                        <p className="ap-card__price">
                          Старт: {a.startingPrice?.toLocaleString()} BYN
                        </p>
                      </div>
                      <div className="ap-card__actions">
                        <button
                            className="ap-btn ap-btn--green"
                            onClick={() => handleApprove(a.id)}
                        >
                          Одобрить
                        </button>
                        <button
                            className="ap-btn ap-btn--red"
                            onClick={() => handleReject(a.id)}
                        >
                          Отклонить
                        </button>
                        <Link to={`/auction/${a.id}`} className="ap-btn ap-btn--ghost">
                          Смотреть
                        </Link>
                      </div>
                    </article>
                ))}
              </div>
          )}
        </main>
      </div>
  );
}

export default AdminPage;