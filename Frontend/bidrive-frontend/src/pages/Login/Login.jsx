import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    let user;
    // Эмуляция проверки пользователя для теста
    if (email === 'ivan@example.com') {
      user = { id: 2, email: email, firstName: 'Иван', lastName: 'Петров' };
    } else if (email === 'maria@example.com') {
      user = { id: 3, email: email, firstName: 'Мария', lastName: 'Сидорова' };
    } else if (email === 'sergey@example.com') {
      user = { id: 4, email: email, firstName: 'Сергей', lastName: 'Иванов' };
    } else {
      alert('Пользователь не найден (в тестовом режиме используйте: ivan@example.com, maria@example.com или sergey@example.com');
      return;
    }

    // Сохраняем данные в LocalStorage
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userEmail', user.email);

    // Мы используем функцию navigate() для перехода.
    // replace: true не дает пользователю вернуться кнопкой "Назад" на страницу логина (удобно).
    navigate("/", { replace: true });
  };

  return (
    <div className="login-container">
      <h1>Вход в BiDrive</h1>
      <form onSubmit={handleLogin} className="login-form">
        <label>Email:</label>
        <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ivan@example.com или maria@example.com"
            required
        />
        <button type="submit" className="login-btn">Войти</button>
      </form>
    </div>
  );
}

export default Login;