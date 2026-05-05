import { useEffect } from 'react'; // === ДОБАВЛЕН ИМПОРТ useEffect ===
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage/HomePage';
import Catalog from './pages/Catalog/Catalog';
import AuctionDetails from './pages/AuctionDetails/AuctionDetails';
import CreateAuction from './pages/CreateAuction/CreateAuction';
import Profile from './pages/Profile/Profile';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import AdminPage from './pages/AdminPage/AdminPage';
import Notifications from './pages/Notifications/Notifications';
import './App.css';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import RulesPage from './pages/RulesPage/RulesPage';

function App() {
  // === ОТКЛЮЧЕНИЕ СКРОЛЛА ДЛЯ ЧИСЛОВЫХ ПОЛЕЙ ===
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.target.type === 'number') {
        e.target.blur();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel, { passive: false });
    };
  }, []);
  // ================================================

  return (
      <Router>
        <Routes>
          {/* Все страницы внутри Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/create" element={<CreateAuction />} />
            <Route path="/auction/:id" element={<AuctionDetails />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
  );
}

export default App;