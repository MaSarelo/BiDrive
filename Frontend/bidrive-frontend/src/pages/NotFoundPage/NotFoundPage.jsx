import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFoundPage() {
    return (
        <div className="nf-page">
            <div className="nf-content">
                <h1 className="nf-code">404</h1>
                <h2 className="nf-title">Страница не найдена</h2>
                <p className="nf-text">
                    Возможно, эта страница была удалена или вы ввели неверный адрес.
                </p>
                <Link to="/" className="nf-btn">
                    Вернуться на главную
                </Link>
            </div>
        </div>
    );
}

export default NotFoundPage;