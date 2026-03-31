import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Login/Login.css'; // замени на '../auth/Auth.css' если переименуешь

function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await axios.post('http://localhost:8080/api/auth/login', credentials);
      const user = res.data;
      localStorage.setItem('userId',    user.id);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userName',  `${user.firstName} ${user.lastName}`);
      localStorage.setItem('userRole',  user.roleId);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  const set = field => e =>
      setCredentials(prev => ({ ...prev, [field]: e.target.value }));

  return (
      <div className="lg">

        {/* ── Визуальная панель ── */}
        <div className="lg-visual" aria-hidden="true">
          <div className="lg-visual__overlay" />
          <div className="lg-visual__content">
            <p className="lg-visual__wordmark">BiDrive</p>
            <p className="lg-visual__tagline">Аукцион исключительных автомобилей</p>
          </div>
        </div>

        {/* ── Форма ── */}
        <div className="lg-panel">
          <div className="lg-panel__inner">

            <Link to="/" className="lg-mobile-logo">BiDrive</Link>

            <p className="lg-eyebrow">Добро пожаловать</p>
            <h1 className="lg-title">Вход в аккаунт</h1>
            <div className="lg-divider" />

            <form onSubmit={handleLogin} className="lg-form">

              <div className="lg-field">
                <label className="lg-label" htmlFor="email">Электронная почта</label>
                <input
                    id="email"
                    className="lg-input"
                    type="email"
                    placeholder="ivan@example.com"
                    value={credentials.email}
                    onChange={set('email')}
                    required
                    autoComplete="email"
                />
              </div>

              <div className="lg-field">
                <label className="lg-label" htmlFor="password">Пароль</label>
                <input
                    id="password"
                    className="lg-input"
                    type="password"
                    placeholder="Введите пароль"
                    value={credentials.password}
                    onChange={set('password')}
                    required
                    autoComplete="current-password"
                />
              </div>

              {error && <p className="lg-error" role="alert">{error}</p>}

              <button
                  type="submit"
                  className={`lg-btn${loading ? ' lg-btn--loading' : ''}`}
                  disabled={loading}
              >
                {loading ? 'Проверка...' : 'Войти'}
              </button>

            </form>

            <p className="lg-footer-text">
              Нет аккаунта?&ensp;
              <Link to="/register" className="lg-link">Зарегистрироваться</Link>
            </p>

            <Link to="/" className="lg-back">← На главную</Link>

          </div>
        </div>

      </div>
  );
}

export default Login;