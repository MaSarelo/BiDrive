import { Link, useLocation } from 'react-router-dom'; // Убрали Outlet, он не нужен
import { useState, useEffect } from 'react';
import './Layout.css';

// 1. Обязательно добавляем { children } в скобки
function Layout({ children }) {

  const location = useLocation(); // Отслеживаем смену страницы
  const [userEmail, setUserEmail] = useState(null); // Храним email в стейте

  // Этот код срабатывает каждый раз, когда меняется страница
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
    } else {
      setUserEmail(null);
    }
  }, [location]);

  return (
    <div className="layout-container">
      {/* Глобальный Хедер */}
      <header className="header">
        <div className="logo">🚗 BiDrive</div>

        <nav className="nav-links">
          <Link to="/" className="nav-link">Каталог</Link>

          {/* Кнопка создания */}
          <Link to="/create" className="nav-link btn-create">
            + Выставить лот
          </Link>

          {/* Ссылки в зависимости от входа */}
          {userEmail ? (
            <>
              <Link to="/profile" className="nav-link">
                👤 Кабинет ({userEmail.split('@')[0]})
              </Link>
            </>
          ) : (
            <Link to="/login" className="nav-link">
              🔑 Войти
            </Link>
          )}
        </nav>
      </header>

      {/* Основной контент страницы */}
      <main className="content">
        {/* 2. Рендерим children (то, что передал App.jsx), а не Outlet */}
        {children}
      </main>
    </div>
  );
}

export default Layout;