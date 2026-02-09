import { Link, useLocation, useNavigate } from 'react-router-dom'; // 1. Импортируем useNavigate
import { useState, useEffect } from 'react';
import './Layout.css';

function Layout({ children }) {

  const location = useLocation();
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate(); // 2. Инициализируем навигацию

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
    } else {
      setUserEmail(null);
    }
  }, [location]);

  // 3. Функция выхода
  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    setUserEmail(null);
    navigate('/login'); // Перенаправляем на страницу логина
  };

  return (
    <div className="layout-container">
      <header className="header">
        <div className="logo">🚗 BiDrive</div>

        <nav className="nav-links">
          <Link to="/" className="nav-link">Каталог</Link>

          <Link to="/create" className="nav-link btn-create">
            + Выставить лот
          </Link>

          {userEmail ? (
            <>
              <Link to="/profile" className="nav-link">
                👤 Кабинет ({userEmail.split('@')[0]})
              </Link>

              {/* 4. Добавляем кнопку ВЫХОДА */}
              <button onClick={handleLogout} className="nav-link btn-logout">
                🚪 Выйти
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link">
              🔑 Войти
            </Link>
          )}
        </nav>
      </header>

      <main className="content">
        {children}
      </main>
    </div>
  );
}

export default Layout;