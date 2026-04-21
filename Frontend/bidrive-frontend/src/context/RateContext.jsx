import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// ИСПРАВЛЕНО: createContext требует аргумент. Передаем null как значение по умолчанию.
const RateContext = createContext(null);

export const RateProvider = ({ children }) => {
    const [rate, setRate] = useState(null);

    useEffect(() => {
        const fetchRate = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/currency/rate');
                setRate(res.data.rate);
            } catch (err) {
                console.error('Ошибка загрузки курса:', err);
                setRate(3); // Заглушка, если сервер не отвечает
            }
        };

        // ИСПРАВЛЕНО: Добавляем void, чтобы IDE поняла, что мы осознанно игнорируем Promise
        void fetchRate();
    }, []);

    return (
        <RateContext.Provider value={rate}>
            {children}
        </RateContext.Provider>
    );
};

export const useRate = () => useContext(RateContext);