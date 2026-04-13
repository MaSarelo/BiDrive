import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css'; // Путь исправлен на относительный

function Register() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '',
    email: '', password: '', confirmPassword: '', phone: ''
  });
  const [agreed,  setAgreed]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
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
    setFormData(prev => ({ ...prev, [name]: name === 'phone' ? formatPhone(value) : value }));
    // Очищаем ошибку при вводе
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Введите имя';
    if (!formData.lastName.trim()) newErrors.lastName = 'Введите фамилию';
    if (!formData.email.trim()) newErrors.email = 'Введите email';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Некорректный email';
    if (!formData.password) newErrors.password = 'Введите пароль';
    else if (formData.password.length < 6) newErrors.password = 'Минимум 6 символов';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Пароли не совпадают';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // Исправлено: agreed && ... и setErrors вместо setError
    if (!agreed) { setErrors({ agree: 'Необходимо согласие' }); return; }
    if (!validate()) return;

    setErrors({}); // Исправлено: было setError('')
    setLoading(true);
    try {
      const { confirmPassword, ...dataToSend } = formData;
      await axios.post('http://localhost:8080/api/auth/register', dataToSend);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setErrors({ server: err.response?.data || 'Попробуйте другой email' });
    } finally {
      setLoading(false);
    }
  };

  return (
      // Исправлено: обернуто в div с классом rg для работы CSS Grid
      <div className="rg">
        <div className="rg-visual" aria-hidden="true">
          <div className="rg-visual__overlay" />
          <div className="rg-visual__content">
            <p className="rg-visual__wordmark">BiDrive</p>
            <p className="rg-visual__tagline">Прозрачные онлайн-торги автомобилями</p>
          </div>
        </div>

        <div className="rg-panel">
          <div className="rg-panel__inner">
            <Link to="/" className="rg-mobile-logo">BiDrive</Link>
            <p className="rg-eyebrow">Новый аккаунт</p>
            <h1 className="rg-title">Регистрация</h1>
            <div className="rg-divider" />

            <form onSubmit={handleSubmit} className="rg-form" noValidate>

              <div className="rg-row">
                <div className="rg-field">
                  <label className="rg-label required" htmlFor="firstName">Имя</label>
                  <input id="firstName" className={`rg-input ${errors.firstName ? 'input--error' : ''}`} type="text" name="firstName" placeholder="Иван" value={formData.firstName} onChange={handleChange} required />
                  {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                </div>
                <div className="rg-field">
                  <label className="rg-label required" htmlFor="lastName">Фамилия</label>
                  <input id="lastName" className={`rg-input ${errors.lastName ? 'input--error' : ''}`} type="text" name="lastName" placeholder="Иванов" value={formData.lastName} onChange={handleChange} required />
                  {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                </div>
              </div>

              <div className="rg-field">
                <label className="rg-label" htmlFor="phone">Мобильный телефон</label>
                <input id="phone" className="rg-input" type="tel" name="phone" placeholder="+375 (XX) XXX-XX-XX" value={formData.phone} onChange={handleChange} maxLength="19" />
                <span className="rg-hint">Формат: +375 (XX) XXX-XX-XX</span>
              </div>

              <div className="rg-field">
                <label className="rg-label required" htmlFor="reg-email">Электронная почта</label>
                <input id="reg-email" className={`rg-input ${errors.email ? 'input--error' : ''}`} type="email" name="email" placeholder="ivan@example.com" value={formData.email} onChange={handleChange} required />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="rg-field">
                <label className="rg-label required" htmlFor="reg-password">Пароль</label>
                <input id="reg-password" className={`rg-input ${errors.password ? 'input--error' : ''}`} type="password" name="password" placeholder="Не менее 6 символов" value={formData.password} onChange={handleChange} required />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="rg-field">
                <label className="rg-label required" htmlFor="confirmPassword">Повторите пароль</label>
                <input id="confirmPassword" className={`rg-input ${errors.confirmPassword ? 'input--error' : ''}`} type="password" name="confirmPassword" placeholder="Повторите пароль" value={formData.confirmPassword} onChange={handleChange} required />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>

              <label className={`rg-consent${agreed ? ' rg-consent--checked' : ''}`}>
              <span className="rg-checkbox">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                <span className="rg-checkbox__box" aria-hidden="true" />
              </span>
                <span className="rg-consent__text">
                Я согласен на обработку и хранение моих персональных данных
              </span>
              </label>
              {errors.agree && <span className="field-error">{errors.agree}</span>}

              {errors.server && <p className="rg-error" role="alert">{errors.server}</p>}

              <button type="submit" className={`rg-btn${!agreed || loading ? ' rg-btn--disabled' : ''}`} disabled={!agreed || loading}>
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