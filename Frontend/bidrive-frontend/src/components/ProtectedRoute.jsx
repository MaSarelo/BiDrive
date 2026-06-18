import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const location = useLocation();
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    // Если не авторизован — редирект на логин
    if (!userId) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Если требуется роль админа, а пользователь не админ (roleId !== 2)
    if (requireAdmin && userRole !== '2') {
        return <Navigate to="/" replace />;
    }

    return children;
}