import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  });

  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  // === ИСПРАВЛЕННАЯ ФУНКЦИЯ МАСКИРОВКИ ===
  const formatPhoneNumber = (value) => {
    // 1. Оставляем только цифры
    const cleaned = value.replace(/\D/g, '');

    // 2. Если пусто - возвращаем пустоту
    if (!cleaned) return '';

    // 3. ЗАЩИТА ОТ "ПРИЗРАКОВ":
    // Если пользователь стер номер и остались только куски кода 375 (3, 37, 375),
    // мы просто возвращаем +375, чтобы не было цикла.
    if (cleaned === '3' || cleaned === '37' || cleaned === '375') {
      return '+375';
    }

    // 4. Основная логика
    let numbers = cleaned;

    // Если строка начинается с 375, отрезаем их (мы сами их добавим в формате)
    if (cleaned.startsWith('375')) {
      numbers = cleaned.substring(3);
    }

    // Если строка не начинается с 375, значит пользователь вводит номер с нуля (например 029...)
    // Мы это не трогаем, даем пользователю ввести как есть, либо можно отрезать первый ноль.
    // Для простоты оставляем как есть, НО маска рассчитана на 9 цифр после +375.

    // Ограничиваем длину (9 цифр: код оператора + номер)
    numbers = numbers.substring(0, 9);

    // 5. Сборка красивой строки
    let formatted = '+375';

    if (numbers.length > 0) {
      formatted += ' (' + numbers.substring(0, 2);
    }
    if (numbers.length > 2) {
      formatted += ') ' + numbers.substring(2, 5);
    }
    if (numbers.length > 5) {
      formatted += '-' + numbers.substring(5, 7);
    }
    if (numbers.length > 7) {
      formatted += '-' + numbers.substring(7, 9);
    }

    return formatted;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      setFormData({ ...formData, [name]: formatPhoneNumber(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      alert('Вы должны согласиться на обработку персональных данных');
      return;
    }

    try {
      await axios.post('http://localhost:8080/api/auth/register', formData);
      alert('Регистрация успешна! Теперь войдите в систему.');
      navigate('/login');
    } catch (error) {
      alert('Ошибка регистрации: ' + (error.response?.data || 'Попробуйте другой email'));
    }
  };

  return (
    <div className="login-container">
      <h1>Регистрация в BiDrive</h1>
      <form onSubmit={handleSubmit} className="login-form">

        <div className="input-group">
          <label>Имя:</label>
          <input
            type="text"
            name="firstName"
            placeholder="Иван"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label>Фамилия:</label>
          <input
            type="text"
            name="lastName"
            placeholder="Иванов"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label>Мобильный телефон:</label>
          <div className="phone-input-wrapper">
            <span className="phone-icon">📱</span>
            <input
              type="tel"
              name="phone"
              placeholder="+375 (29) 123-45-67"
              value={formData.phone}
              onChange={handleChange}
              maxLength="19"
            />
          </div>
          <small className="hint-text">Формат: +375 (XX) XXX-XX-XX</small>
        </div>

        <div className="input-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            placeholder="ivan@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label>Пароль:</label>
          <input
            type="password"
            name="password"
            placeholder="Не менее 6 символов"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="checkbox-container">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="agree">
            Я согласен на обработку и хранение моих персональных данных в целях регистрации и использования сервиса
          </label>
        </div>

        <button
          type="submit"
          className="login-btn"
          disabled={!agreed}
          style={{ opacity: agreed ? 1 : 0.6, cursor: agreed ? 'pointer' : 'not-allowed' }}
        >
          Зарегистрироваться
        </button>

        <p className="no-account">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;