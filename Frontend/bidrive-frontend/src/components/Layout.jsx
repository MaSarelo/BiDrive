import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'; // 1. Импортируем Outlet
import { useState, useEffect } from 'react';
import './Layout.css';

function Layout() {

  const location = useLocation();
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedRole = localStorage.getItem('userRole');

    if (storedEmail) {
      setUserEmail(storedEmail);
      setUserRole(storedRole ? parseInt(storedRole) : null);
    } else {
      setUserEmail(null);
      setUserRole(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    setUserEmail(null);
    setUserRole(null);
    navigate('/login');
  };

  return (
    <div className="layout-container">
      <header className="header">
        {/* Логотип ведет на Главную */}
        <Link to="/" className="logo">🚗 BiDrive</Link>

        <nav className="nav-links">
          {/* Ссылка "Каталог" ведет на /catalog */}
          <Link to="/catalog" className="nav-link">Каталог</Link>

          <Link to="/create" className="nav-link btn-create">
            + Выставить лот
          </Link>

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
        {/* === ВАЖНОЕ ИЗМЕНЕНИЕ === */}
        {/* Вместо {children} используем <Outlet /> */}
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;