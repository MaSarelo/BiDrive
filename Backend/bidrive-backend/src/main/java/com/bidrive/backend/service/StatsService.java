package com.bidrive.backend.service;

import com.bidrive.backend.dto.DashboardStats;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.BigInteger;

@Service
public class StatsService {

    @Autowired
    private EntityManager entityManager;

    public DashboardStats getDashboardStats() {
        DashboardStats stats = new DashboardStats();

        try {
            // 1. Выполняем запрос
            Query query = entityManager.createNativeQuery("SELECT * FROM get_admin_dashboard_stats()");
            Object resultObj = query.getSingleResult();

            // 2. Проверяем, что результат — это массив
            if (resultObj instanceof Object[]) {
                Object[] row = (Object[]) resultObj;

                // 3. Безопасное извлечение данных с преобразованием типов
                // PostgreSQL возвращает BigInteger для BIGINT, нам нужен Long

                // Столбец 0: total_users
                if (row[0] != null) {
                    stats.setTotalUsers(toLong(row[0]));
                }

                // Столбец 1: active_auctions
                if (row[1] != null) {
                    stats.setActiveAuctions(toLong(row[1]));
                }

                // Столбец 2: total_bids
                if (row[2] != null) {
                    stats.setTotalBids(toLong(row[2]));
                }

                // Столбец 3: total_turnover
                if (row[3] != null) {
                    stats.setTotalTurnover(toBigDecimal(row[3]));
                }

                System.out.println(">>> Статистика успешно загружена из БД");
            }

        } catch (Exception e) {
            // Если ошибка — выводим в консоль красным цветом
            System.err.println("!!! ОШИБКА ПРИ ЗАГРУЗКЕ СТАТИСТИКИ !!!");
            e.printStackTrace();
        }

        return stats;
    }

    // Вспомогательный метод: преобразует BigInteger/Long/Integer в Long
    private Long toLong(Object obj) {
        if (obj instanceof BigInteger) {
            return ((BigInteger) obj).longValue();
        } else if (obj instanceof Number) {
            return ((Number) obj).longValue();
        }
        return 0L;
    }

    // Вспомогательный метод: преобразует BigDecimal/Double в BigDecimal
    private BigDecimal toBigDecimal(Object obj) {
        if (obj instanceof BigDecimal) {
            return (BigDecimal) obj;
        } else if (obj instanceof Number) {
            return BigDecimal.valueOf(((Number) obj).doubleValue());
        }
        return BigDecimal.ZERO;
    }
}