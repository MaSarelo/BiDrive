import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Отправляем данные на бэкенд
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
        <label>Имя:</label>
        <input
            type="text" name="firstName" placeholder="Иван" value={formData.firstName}
            onChange={handleChange} required
        />

        <label>Фамилия:</label>
        <input
            type="text" name="lastName" placeholder="Иванов" value={formData.lastName}
            onChange={handleChange} required
        />

        <label>Email:</label>
        <input
            type="email" name="email" placeholder="ivan@example.com" value={formData.email}
            onChange={handleChange} required
        />

        <label>Пароль:</label>
        <input
            type="password" name="password" placeholder="Не менее 6 символов" value={formData.password}
            onChange={handleChange} required
        />

        <button type="submit" className="login-btn">Зарегистрироваться</button>

        <p className="no-account">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;