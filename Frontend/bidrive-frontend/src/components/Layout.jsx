import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef, createContext } from 'react';
import axios from 'axios';
import './Layout.css';

export const NotifContext = createContext();

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail'));
  const [userRole, setUserRole] = useState(() => {
    const r = localStorage.getItem('userRole');
    return r ? parseInt(r) : null;
  });

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false); // Для выпадающего меню админа

  const drawerRef = useRef(null);
  const profileRef = useRef(null); // Для клика вне меню

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    setUserEmail(email || null);
    setUserRole(role ? parseInt(role) : null);
  }, [location]);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false); // Закрываем всё при смене страницы
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) { setNotifCount(0); return; }
    axios.get(`http://localhost:8080/api/notifications/user/${userId}`)
        .then(r => setNotifCount(r.data.filter(n => !n.isRead).length))
        .catch(() => setNotifCount(0));
  }, [location, userEmail]);

  useEffect(() => {
    const handler = e => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setMenuOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    ['userEmail', 'userId', 'userRole', 'userName'].forEach(k => localStorage.removeItem(k));
    setUserEmail(null);
    setUserRole(null);
    navigate('/login');
  };

  const userName = useMemo(() => userEmail ? userEmail.split('@')[0] : null, [userEmail]);
  const isActive = path => location.pathname === path;

  return (
      <NotifContext.Provider value={{ notifCount, setNotifCount }}>
        <div className="ly">
          <div
              className={`ly-overlay${menuOpen ? ' ly-overlay--visible' : ''}`}
              onClick={() => setMenuOpen(false)}
          />

          <header className={`ly-header${scrolled ? ' ly-header--solid' : ''}`}>
            <div className="ly-header__inner">

              <Link to="/" className="ly-logo">
            <span className="ly-logo__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
                <span className="ly-logo__text">BiDrive</span>
              </Link>

              <nav className="ly-nav">
                <Link to="/catalog" className={`ly-nav__link${isActive('/catalog') ? ' ly-nav__link--active' : ''}`}>
                  Каталог
                </Link>
                <Link to="/create" className={`ly-nav__link${isActive('/create') ? ' ly-nav__link--active' : ''}`}>
                  Выставить лот
                </Link>
              </nav>

              <div className="ly-right">
                {userEmail && (
                    <Link to="/notifications" className="ly-bell" title="Уведомления">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      {notifCount > 0 && (
                          <span className="ly-bell__badge">{notifCount > 99 ? '99+' : notifCount}</span>
                      )}
                    </Link>
                )}

                {userEmail ? (
                    <>
                      {/* === ЛОГИКА ПРОФИЛЯ === */}

                      {/* Если Админ — показываем Dropdown */}
                      {userRole === 2 ? (
                          <div className="ly-profile-wrapper" ref={profileRef}>
                            <button
                                className="ly-user"
                                onClick={() => setProfileOpen(v => !v)}
                                aria-expanded={profileOpen}
                            >
                              <span className="ly-user__avatar">{userName?.[0]?.toUpperCase()}</span>
                              <span className="ly-user__name">{userName}</span>
                              <svg className={`ly-user__chevron${profileOpen ? ' ly-user__chevron--open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>

                            {profileOpen && (
                                <div className="ly-dropdown">
                                  <Link to="/profile" className="ly-dropdown__item" onClick={() => setProfileOpen(false)}>
                                    Мой профиль
                                  </Link>
                                  <Link to="/admin" className="ly-dropdown__item ly-dropdown__item--admin" onClick={() => setProfileOpen(false)}>
                                    Панель администратора
                                  </Link>
                                </div>
                            )}
                          </div>
                      ) : (
                          /* Если обычный пользователь — просто ссылка */
                          <Link to="/profile" className="ly-user">
                            <span className="ly-user__avatar">{userName?.[0]?.toUpperCase()}</span>
                            <span className="ly-user__name">{userName}</span>
                          </Link>
                      )}

                      <button className="ly-logout" onClick={handleLogout} title="Выйти">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                      </button>
                    </>
                ) : (
                    <div className="ly-guest">
                      <Link to="/login" className="ly-btn ly-btn--ghost">Войти</Link>
                      <Link to="/register" className="ly-btn ly-btn--primary">Регистрация</Link>
                    </div>
                )}
              </div>

              <button className={`ly-burger${menuOpen ? ' ly-burger--open' : ''}`} onClick={() => setMenuOpen(v => !v)} aria-label="Меню">
                <span /><span /><span />
              </button>
            </div>
          </header>

          {/* Mobile drawer */}
          <aside ref={drawerRef} className={`ly-drawer${menuOpen ? ' ly-drawer--open' : ''}`}>
            <div className="ly-drawer__body">
              <Link to="/catalog" className="ly-drawer__link">Каталог</Link>
              <Link to="/create" className="ly-drawer__link">Выставить лот</Link>

              {userEmail && (
                  <Link to="/notifications" className="ly-drawer__link">
                    Уведомления {notifCount > 0 && <span style={{marginLeft:'auto', background:'var(--red)', color:'#fff', padding:'2px 8px', borderRadius:'10px', fontSize:'0.75rem'}}>{notifCount}</span>}
                  </Link>
              )}

              <div className="ly-drawer__divider" />

              {userEmail ? (
                  <>
                    <Link to="/profile" className="ly-drawer__link">Профиль ({userName})</Link>
                    {/* Админку в мобильной версии оставляем ссылкой */}
                    {userRole === 2 && (
                        <Link to="/admin" className="ly-drawer__link ly-drawer__link--admin">Панель администратора</Link>
                    )}
                    <button className="ly-drawer__link" style={{color: 'var(--text-3)', background: 'none', border: 'none', width: '100%', textAlign: 'left'}} onClick={handleLogout}>Выйти из аккаунта</button>
                  </>
              ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0'}}>
                    <Link to="/login" className="ly-btn ly-btn--ghost ly-btn--full">Войти</Link>
                    <Link to="/register" className="ly-btn ly-btn--primary ly-btn--full">Регистрация</Link>
                  </div>
              )}
            </div>
          </aside>

          <main className="ly-content">
            <Outlet />
          </main>
        </div>
      </NotifContext.Provider>
  );
}

export default Layout;