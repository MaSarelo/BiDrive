package com.bidrive.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.logging.Logger;

@Service
public class CurrencyService {

    private static final Logger logger = Logger.getLogger(CurrencyService.class.getName());
    private static final String NBRB_API_URL = "https://api.nbrb.by/exrates/rates/431"; // 431 - код USD

    private final RestTemplate restTemplate;

    private double cachedRate = 0.0;
    private LocalDate lastUpdateDate = null;

    public CurrencyService() {
        this.restTemplate = new RestTemplate();
    }

    public double getUsdRate() {
        // Если курс загружен сегодня — возвращаем кэш
        if (lastUpdateDate != null && lastUpdateDate.equals(LocalDate.now()) && cachedRate > 0) {
            return cachedRate;
        }

        try {
            logger.info("Запрос курса USD из НБ РБ...");

            // RestTemplate автоматически преобразует JSON в наш Record
            NbrbResponse response = restTemplate.getForObject(NBRB_API_URL, NbrbResponse.class);

            if (response != null) {
                this.cachedRate = response.Cur_OfficialRate();
                this.lastUpdateDate = LocalDate.now();
                logger.info("Курс обновлен: 1 USD = " + cachedRate + " BYN");
            }

            return cachedRate;

        } catch (Exception e) {
            logger.severe("Ошибка при получении курса: " + e.getMessage());
            // Возвращаем кэш (если есть) или дефолтное значение 3
            return cachedRate > 0 ? cachedRate : 3;
        }
    }

    // Record для маппинга ответа от API.
    // Имена полей должны совпадать с ключами в JSON от НБ РБ.
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NbrbResponse(
            int Cur_ID,
            String Date,
            String Cur_Abbreviation,
            int Cur_Scale,
            String Cur_Name,
            double Cur_OfficialRate
    ) {}
}