import { Link } from 'react-router-dom';
import './RulesPage.css';

export default function RulesPage() {
    return (
        <div className="rp">
            {/* Заголовок страницы */}
            <div className="rp-hero">
                <div className="rp-wrap">
                    <p className="rp-eyebrow">Правовая информация</p>
                    <h1 className="rp-title">Правила платформы BiDrive</h1>
                </div>
            </div>

            <main className="rp-wrap rp-body">
                <article className="rp-content">

                    <section className="rp-section">
                        <h2 className="rp-section__title">1. Регулирование электронных торгов</h2>
                        <p className="rp-text">
                            Проведение аукционов на платформе осуществляется в соответствии с законодательством
                            Республики Беларусь, в частности <strong>Гражданским кодексом РБ (Статьи 417-419)</strong>,
                            регулирующим порядок заключения договоров и проведения торгов.
                        </p>
                        <div className="rp-list">
                            <div className="rp-list__item">
                                <span className="rp-list__icon">✓</span>
                                <p><strong>Статус торгов:</strong> Все аукционы, размещенные на BiDrive, являются открытыми. Любой зарегистрированный пользователь имеет право участвовать в торгах.</p>
                            </div>
                            <div className="rp-list__item">
                                <span className="rp-list__icon">✓</span>
                                <p><strong>Момент заключения сделки:</strong> Победителем признается участник, предложивший наиболее высокую цену на момент завершения таймера. Результат торгов является основанием для оформления сделки между продавцом и покупателем.</p>
                            </div>
                        </div>
                    </section>

                    <section className="rp-section">
                        <h2 className="rp-section__title">2. Защита персональных данных</h2>
                        <p className="rp-text">
                            В соответствии с <strong>Законом РБ № 99-З «О защите персональных данных»</strong>,
                            мы гарантируем конфиденциальность информации:
                        </p>
                        <ul className="rp-ul">
                            <li>Платформа BiDrive осуществляет сбор данных (ФИО, номер телефона, электронная почта) исключительно для идентификации пользователей и обеспечения связи между участниками сделки.</li>
                            <li>Пароли пользователей хранятся в хешированном виде (алгоритм BCrypt) и не доступны даже администрации платформы.</li>
                            <li>Персональные данные не передаются третьим лицам без согласия субъекта, за исключением случаев, предусмотренных законодательством.</li>
                        </ul>
                    </section>

                    <section className="rp-section">
                        <h2 className="rp-section__title">3. Требования к контенту и модерация</h2>
                        <p className="rp-text">
                            На основании <strong>Закона РБ «О рекламе»</strong> и правил электронной коммерции:
                        </p>
                        <ul className="rp-ul">
                            <li>Все объявления проходят обязательную предварительную модерацию администратором перед публикацией.</li>
                            <li>Продавец обязан предоставлять достоверные сведения о транспортном средстве (техническое состояние, пробег, описание дефектов).</li>
                            <li>Администрация оставляет за собой право отклонить лот, если информация в нем вводит в заблуждение или противоречит законодательству РБ.</li>
                        </ul>
                    </section>

                    <section className="rp-section">
                        <h2 className="rp-section__title">4. Информационная рассылка (Telegram)</h2>
                        <p className="rp-text">
                            Интеграция с Telegram осуществляется в добровольном порядке.
                            Пользователь может подписаться на уведомления о новых лотах через Telegram-бота.
                            Подписка может быть отменена в любой момент путем остановки бота,
                            что соответствует нормам о рассылке информационных сообщений.
                        </p>
                    </section>

                    <section className="rp-section">
                        <h2 className="rp-section__title">5. Договор купли-продажи</h2>
                        <p className="rp-text">
                            Для оформления сделки купли-продажи транспортного средства используется
                            типовая форма договора, утверждённая постановлением МВД и Минюста
                            Республики Беларусь от 01.11.2007 № 284/74.
                        </p>

                        <div className="rp-download-box">
                            <a
                                href="/documents/dogovor-kupli-prodazhi.pdf"
                                download
                                className="rp-download-btn"
                            >
                                📄 Скачать шаблон договора купли-продажи (PDF)
                            </a>
                            <p className="rp-download-hint">
                                Откроется в новой вкладке. Распечатайте и заполните от руки в 3 экземплярах.
                            </p>
                        </div>

                        <p className="rp-text" style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                            <strong>Важно:</strong> Договор составляется в трёх экземплярах:
                            один остаётся у продавца, второй — у покупателя, третий передаётся в РЭП ГАИ
                            при регистрации транспортного средства.
                        </p>
                    </section>

                </article>

                <aside className="rp-sidebar">
                    <div className="rp-sidebar__card">
                        <h3 className="rp-sidebar__title">Навигация</h3>
                        <ul className="rp-sidebar__list">
                            <li><Link to="/catalog">← Вернуться в каталог</Link></li>
                            <li><Link to="/">На главную</Link></li>
                            <li><a href="mailto:support@bidrive.by">Связаться с поддержкой</a></li>
                        </ul>
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