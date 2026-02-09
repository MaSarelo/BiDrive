import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Отправляем email и пароль на бэкенд
      const res = await axios.post('http://localhost:8080/api/auth/login', credentials);

      const user = res.data; // Сервер вернет объект User (id, email, roles...)

      // Сохраняем данные в LocalStorage
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userName', `${user.firstName} ${user.lastName}`);

      // Перенаправляем на главную
      navigate("/", { replace: true });

    } catch (error) {
      alert('Ошибка входа: ' + (error.response?.data || 'Неверный логин или пароль'));
    }
  };

  return (
    <div className="login-container">
      <h1>Вход в BiDrive</h1>
      <form onSubmit={handleLogin} className="login-form">
        <label>Email:</label>
        <input
            type="email"
            name="email"
            placeholder="ivan@example.com"
            value={credentials.email}
            onChange={e => setCredentials({...credentials, email: e.target.value})}
            required
        />

        <label>Пароль:</label>
        <input
            type="password"
            name="password"
            placeholder="Введите пароль (123 для тестов)"
            value={credentials.password}
            onChange={e => setCredentials({...credentials, password: e.target.value})}
            required
        />

        <button type="submit" className="login-btn">Войти</button>

        <p className="no-account">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;