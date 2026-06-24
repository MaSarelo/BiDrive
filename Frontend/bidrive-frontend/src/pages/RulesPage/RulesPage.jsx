import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './RulesPage.css';

export default function RulesPage() {
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-120px 0px -60% 0px',
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const sections = document.querySelectorAll('.rp-section');
        sections.forEach((section) => observer.observe(section));

        return () => {
            sections.forEach((section) => observer.unobserve(section));
        };
    }, []);

    const navItems = [
        { id: 'section-1', label: 'Регулирование торгов' },
        { id: 'section-2', label: 'Защита данных' },
        { id: 'section-3', label: 'Модерация' },
        { id: 'section-4', label: 'Telegram' },
        { id: 'section-5', label: 'Договор' },
        { id: 'section-6', label: 'Как работает платформа' },
        { id: 'section-7', label: 'Правила участия' },
        { id: 'section-8', label: 'Разрешение споров' },
    ];

    return (
        <div className="rp">
            <div className="rp-hero">
                <div className="rp-wrap">
                    <p className="rp-eyebrow">Правовая информация</p>
                    <h1 className="rp-title">Правила платформы BiDrive</h1>
                </div>
            </div>

            <main className="rp-wrap rp-body">
                <article className="rp-content">
                    <section id="section-1" className="rp-section">
                        <h2 className="rp-section__title">1. Регулирование электронных торгов</h2>
                        <p className="rp-text">
                            Проведение аукционов на платформе осуществляется в соответствии с законодательством
                            Республики Беларусь, в частности <strong>Гражданским кодексом РБ (Статьи 417-419)</strong>.
                        </p>
                        <div className="rp-list">
                            <div className="rp-list__item">
                                <span className="rp-list__icon">✓</span>
                                <p><strong>Статус торгов:</strong> Все аукционы, размещенные на BiDrive, являются открытыми.</p>
                            </div>
                            <div className="rp-list__item">
                                <span className="rp-list__icon">✓</span>
                                <p><strong>Момент сделки:</strong> Победитель определяется по максимальной ставке на момент таймера.</p>
                            </div>
                        </div>
                    </section>

                    <section id="section-2" className="rp-section">
                        <h2 className="rp-section__title">2. Защита персональных данных</h2>
                        <p className="rp-text">
                            В соответствии с <strong>Законом РБ № 99-З «О защите персональных данных»</strong>,
                            мы гарантируем конфиденциальность информации:
                        </p>
                        <ul className="rp-ul">
                            <li>Сбор данных (ФИО, телефон, email) исключительно для идентификации.</li>
                            <li>Пароли хранятся в хешированном виде (BCrypt) и недоступны администрации.</li>
                            <li>Данные не передаются третьим лицам без согласия субъекта.</li>
                        </ul>
                    </section>

                    <section id="section-3" className="rp-section">
                        <h2 className="rp-section__title">3. Требования к контенту и модерация</h2>
                        <p className="rp-text">
                            На основании <strong>Закона РБ «О рекламе»</strong>:
                        </p>
                        <ul className="rp-ul">
                            <li>Все объявления проходят обязательную предварительную модерацию.</li>
                            <li>Продавец обязан предоставлять достоверные сведения.</li>
                            <li>Администрация вправе отклонить лот с ложной информацией.</li>
                        </ul>
                    </section>

                    <section id="section-4" className="rp-section">
                        <h2 className="rp-section__title">4. Информационная рассылка (Telegram)</h2>
                        <p className="rp-text">
                            Интеграция с Telegram осуществляется в добровольном порядке.
                            Подписка может быть отменена в любой момент путем остановки бота.
                        </p>
                    </section>

                    <section id="section-5" className="rp-section">
                        <h2 className="rp-section__title">5. Договор купли-продажи</h2>
                        <p className="rp-text">
                            Используется типовая форма, утверждённая постановлением МВД и Минюста
                            Республики Беларусь от 01.11.2007 № 284/74.
                        </p>

                        <div className="rp-download-box">
                            <a href="/documents/dogovor-kupli-prodazhi.pdf" download className="rp-download-btn">
                                📄 Скачать шаблон договора (PDF)
                            </a>
                            <p className="rp-download-hint">
                                Распечатайте и заполните от руки в 3 экземплярах.
                            </p>
                        </div>

                        <p className="rp-note-text">
                            <strong>Важно:</strong> Один экземпляр продавцу, второй покупателю, третий в ГАИ.
                        </p>
                    </section>

                    <section id="section-6" className="rp-section">
                        <h2 className="rp-section__title">6. Как работает платформа BiDrive</h2>
                        <p className="rp-text">
                            BiDrive — это онлайн-площадка для проведения аукционов по продаже автомобилей.
                        </p>
                        <ul className="rp-ul">
                            <li><strong>Регистрация:</strong> Пользователь создаёт аккаунт с подтверждением email.</li>
                            <li><strong>Создание лота:</strong> Продавец заполняет карточку автомобиля с фотографиями.</li>
                            <li><strong>Модерация:</strong> Администрация проверяет достоверность информации.</li>
                            <li><strong>Публикация:</strong> После одобрения лот появляется в каталоге.</li>
                            <li><strong>Торги:</strong> Участники делают ставки с минимальным шагом.</li>
                            <li><strong>Завершение:</strong> Победитель — участник с максимальной ставкой.</li>
                        </ul>
                    </section>

                    <section id="section-7" className="rp-section">
                        <h2 className="rp-section__title">7. Правила участия в торгах</h2>
                        <ul className="rp-ul">
                            <li>К участию допускаются дееспособные граждане РБ, достигшие 18 лет.</li>
                            <li>Запрещено делать ставки на собственные лоты.</li>
                            <li>После окончания аукциона победитель обязан связаться с продавцом в течение 3 рабочих дней.</li>
                            <li>Ставки являются окончательными и не могут быть отменены.</li>
                            <li>Платформа не несёт ответственности за техническое состояние автомобиля.</li>
                        </ul>
                    </section>

                    <section id="section-8" className="rp-section">
                        <h2 className="rp-section__title">8. Разрешение споров</h2>
                        <p className="rp-text">
                            В случае возникновения споров между участниками торгов:
                        </p>
                        <ul className="rp-ul">
                            <li>Стороны обязаны сначала обратиться в службу поддержки BiDrive.</li>
                            <li>Администрация платформы выступает медиатором и способствует досудебному урегулированию.</li>
                            <li>При невозможности достижения согласия спор передаётся на рассмотрение в суд по месту нахождения ответчика в соответствии с законодательством РБ.</li>
                        </ul>
                    </section>
                </article>

                <aside className="rp-sidebar">
                    <div className="rp-sidebar__card">
                        <h3 className="rp-sidebar__title">📑 Содержание</h3>
                        <nav className="rp-nav-list">
                            {navItems.map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    className={`rp-nav-link ${activeSection === item.id ? 'is-active' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById(item.id).scrollIntoView({ behavior: 'smooth' });
                                    }}
                                >
                                    <span className="rp-nav-link__num">{item.id.replace('section-', '')}</span>
                                    <span className="rp-nav-link__text">{item.label}</span>
                                </a>
                            ))}
                        </nav>

                        <div className="rp-sidebar__divider"></div>

                        <div className="rp-sidebar__actions">
                            <Link to="/catalog" className="rp-action-btn rp-action-btn--primary">
                                ← Каталог
                            </Link>
                            <Link to="/" className="rp-action-btn">
                                🏠 Главная
                            </Link>
                        </div>
                    </div>
                </aside>
            </main>

            <footer className="rp-footer">
                <div className="rp-wrap">
                    <p>© {new Date().getFullYear()} BiDrive. Дипломный проект.</p>
                </div>
            </footer>
        </div>
    );
}