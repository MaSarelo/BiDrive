import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Layout.css';

function Layout() {
  const location  = useLocation();
  const navigate  = useNavigate();

  const [userEmail,  setUserEmail]  = useState(null);
  const [userRole,   setUserRole]   = useState(null);
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);

  // Sync auth state on every route change
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role  = localStorage.getItem('userRole');
    setUserEmail(email || null);
    setUserRole(role ? parseInt(role) : null);
  }, [location]);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location]);

  // Frosted-glass header on scroll
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleLogout = () => {
    ['userEmail', 'userId', 'userRole', 'userName'].forEach(k => localStorage.removeItem(k));
    setUserEmail(null);
    setUserRole(null);
    navigate('/login');
  };

  const userName = userEmail ? userEmail.split('@')[0] : null;

  return (
    <div className="ly">

      {/* ── HEADER ── */}
      <header className={`ly-header${scrolled ? ' ly-header--solid' : ''}`}>
        <div className="ly-header__inner">

          {/* Wordmark */}
          <Link to="/" className="ly-wordmark">
            <span className="ly-wordmark__main">BiDrive</span>
            <span className="ly-wordmark__sub">Est. 2026 · Минск</span>
          </Link>

          {/* Desktop nav */}
          <nav className="ly-nav">
            <Link to="/catalog" className={`ly-nav__link${location.pathname === '/catalog' ? ' ly-nav__link--active' : ''}`}>
              Каталог
            </Link>
            <Link to="/create" className="ly-btn ly-btn--create">
              Выставить лот
            </Link>
            {userRole === 2 && (
              <Link to="/admin" className="ly-btn ly-btn--admin">
                Админ
              </Link>
            )}
          </nav>

          {/* Auth */}
          <div className="ly-auth">
            {userEmail ? (
              <>
                <Link to="/profile" className="ly-auth__user">
                  <span className="ly-auth__avatar">{userName?.[0]?.toUpperCase()}</span>
                  <span className="ly-auth__name">{userName}</span>
                </Link>
                <button className="ly-btn ly-btn--logout" onClick={handleLogout}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="ly-nav__link">Войти</Link>
                <Link to="/register" className="ly-btn ly-btn--gold">Регистрация</Link>
              </>
            )}
          </div>

          {/* Burger */}
          <button
            className={`ly-burger${menuOpen ? ' ly-burger--open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Меню"
          >
            <span /><span /><span />
          </button>

        </div>

        {/* Mobile drawer */}
        <div className={`ly-drawer${menuOpen ? ' ly-drawer--open' : ''}`}>
          <Link to="/catalog" className="ly-drawer__link">Каталог</Link>
          <Link to="/create"  className="ly-drawer__link">Выставить лот</Link>
          {userRole === 2 && (
            <Link to="/admin" className="ly-drawer__link">Администрирование</Link>
          )}
          <div className="ly-drawer__divider" />
          {userEmail ? (
            <>
              <Link to="/profile" className="ly-drawer__link">Профиль ({userName})</Link>
              <button className="ly-drawer__link ly-drawer__logout" onClick={handleLogout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="ly-drawer__link">Войти</Link>
              <Link to="/register" className="ly-drawer__link">Регистрация</Link>
            </>
          )}
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="ly-content">
        <Outlet />
      </main>

    </div>
  );
}

export default Layout;