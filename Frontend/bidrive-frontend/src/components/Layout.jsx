import { Link, useLocation, useNavigate } from 'react-router-dom'; // 1. Импортируем useNavigate
import { useState, useEffect } from 'react';
import './Layout.css';

function Layout({ children }) {
  const location = useLocation();
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState(null); // 1. Добавляем стейт роли
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedRole = localStorage.getItem('userRole'); // 2. Считываем роль

    if (storedEmail) {
      setUserEmail(storedEmail);
      setUserRole(storedRole ? parseInt(storedRole) : null); // 3. Сохраняем в стейт
    } else {
      setUserEmail(null);
      setUserRole(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole'); // 4. Удаляем роль при выходе
    setUserEmail(null);
    setUserRole(null);
    navigate('/login');
  };

  return (
    <div className="layout-container">
      <header className="header">
        <div className="logo">🚗 BiDrive</div>

        <nav className="nav-links">
          <Link to="/" className="nav-link">Каталог</Link>

          {/* Ссылка на создание видна всем залогиненным */}
          {userEmail && (
             <Link to="/create" className="nav-link btn-create">
               + Выставить лот
             </Link>
          )}

          {userRole === 2 && (
            <Link to="/admin" className="nav-link" style={{backgroundColor: '#e74c3c', color: 'white'}}>
              ⚙️ Админка
            </Link>
          )}

          {userEmail ? (
            <>
              <Link to="/profile" className="nav-link">
                👤 Кабинет ({userEmail.split('@')[0]})
              </Link>
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