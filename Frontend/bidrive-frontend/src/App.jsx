import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage/HomePage';
import Catalog from './pages/Catalog/Catalog';
import AuctionDetails from './pages/AuctionDetails/AuctionDetails';
import CreateAuction from './pages/CreateAuction/CreateAuction';
import Profile from './pages/Profile/Profile';
import Login from './pages/Login/Login';
import Register from "./pages/Register/Register";
import AdminPage from './pages/AdminPage/AdminPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>

        {/* Главная страница (Витрина) - без шапки Layout, так как у нее своя */}
        <Route path="/" element={<HomePage />} />

        {/* Группа страниц с общей шапкой (Layout) */}
        <Route element={<Layout />}>

          <Route path="/catalog" element={<Catalog />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create" element={<CreateAuction />} />
          <Route path="/auction/:id" element={<AuctionDetails />} />
          <Route path="/admin" element={<AdminPage />} />

        </Route>

      </Routes>
    </Router>
  );
}

export default App;