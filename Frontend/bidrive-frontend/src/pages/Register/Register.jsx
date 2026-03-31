import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Register/Register.css'; // замени на '../auth/Auth.css' если переименуешь

function Register() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '',
    email: '', password: '', phone: ''
  });
  const [agreed,  setAgreed]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const navigate = useNavigate();

  const formatPhone = value => {
    const c = value.replace(/\D/g, '');
    if (!c) return '';
    if (['3','37','375'].includes(c)) return '+375';
    let n = c.startsWith('375') ? c.slice(3) : c;
    n = n.slice(0, 9);
    let f = '+375';
    if (n.length > 0) f += ' (' + n.slice(0, 2);
    if (n.length > 2) f += ') ' + n.slice(2, 5);
    if (n.length > 5) f += '-' + n.slice(5, 7);
    if (n.length > 7) f += '-' + n.slice(7, 9);
    return f;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'phone' ? formatPhone(value) : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!agreed) { setError('Необходимо согласиться на обработку персональных данных.'); return; }
    setError('');
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/auth/register', formData);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data || 'Попробуйте другой email');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="rg">

        {/* ── Визуальная панель ── */}
        <div className="rg-visual" aria-hidden="true">
          <div className="rg-visual__overlay" />
          <div className="rg-visual__content">
            <p className="rg-visual__wordmark">BiDrive</p>
            <p className="rg-visual__tagline">Аукцион исключительных автомобилей</p>
          </div>
        </div>

        {/* ── Форма ── */}
        <div className="rg-panel">
          <div className="rg-panel__inner">

            <Link to="/" className="rg-mobile-logo">BiDrive</Link>

            <p className="rg-eyebrow">Новый аккаунт</p>
            <h1 className="rg-title">Регистрация</h1>
            <div className="rg-divider" />

            <form onSubmit={handleSubmit} className="rg-form">

              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-label" htmlFor="firstName">Имя</label>
                  <input
                      id="firstName" className="rg-input"
                      type="text" name="firstName" placeholder="Иван"
                      value={formData.firstName} onChange={handleChange}
                      autoComplete="given-name" required
                  />
                </div>
                <div className="rg-field">
                  <label className="rg-label" htmlFor="lastName">Фамилия</label>
                  <input
                      id="lastName" className="rg-input"
                      type="text" name="lastName" placeholder="Иванов"
                      value={formData.lastName} onChange={handleChange}
                      autoComplete="family-name" required
                  />
                </div>
              </div>

              <div className="rg-field">
                <label className="rg-label" htmlFor="phone">Мобильный телефон</label>
                <input
                    id="phone" className="rg-input"
                    type="tel" name="phone"
                    placeholder="+375 (XX) XXX-XX-XX"
                    value={formData.phone} onChange={handleChange}
                    maxLength="19" autoComplete="tel"
                />
                <span className="rg-hint">Формат: +375 (XX) XXX-XX-XX</span>
              </div>

              <div className="rg-field">
                <label className="rg-label" htmlFor="reg-email">Электронная почта</label>
                <input
                    id="reg-email" className="rg-input"
                    type="email" name="email" placeholder="ivan@example.com"
                    value={formData.email} onChange={handleChange}
                    autoComplete="email" required
                />
              </div>

              <div className="rg-field">
                <label className="rg-label" htmlFor="reg-password">Пароль</label>
                <input
                    id="reg-password" className="rg-input"
                    type="password" name="password" placeholder="Не менее 6 символов"
                    value={formData.password} onChange={handleChange}
                    autoComplete="new-password" minLength="6" required
                />
              </div>

              <label className={`rg-consent${agreed ? ' rg-consent--checked' : ''}`}>
              <span className="rg-checkbox">
                <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                />
                <span className="rg-checkbox__box" aria-hidden="true" />
              </span>
                <span className="rg-consent__text">
                Я согласен на обработку и хранение моих персональных данных
                в целях регистрации и использования сервиса
              </span>
              </label>

              {error && <p className="rg-error" role="alert">{error}</p>}

              <button
                  type="submit"
                  className={`rg-btn${!agreed || loading ? ' rg-btn--disabled' : ''}`}
                  disabled={!agreed || loading}
              >
                {loading ? 'Создание...' : 'Создать аккаунт'}
              </button>

            </form>

            <p className="rg-footer-text">
              Уже есть аккаунт?&ensp;
              <Link to="/login" className="rg-link">Войти</Link>
            </p>

            <Link to="/" className="rg-back">← На главную</Link>

          </div>
        </div>

      </div>
  );
}

export default Register;