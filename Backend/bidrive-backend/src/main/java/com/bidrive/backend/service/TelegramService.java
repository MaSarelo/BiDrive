package com.bidrive.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
public class TelegramService {

    @Value("${telegram.bot.token}")
    private String botToken;

    @Value("${telegram.chat.id}")
    private String chatId;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendNewLotNotification(String carName, String city, String price) {
        String message = String.format(
                "🚗 Новый лот на BiDrive!\n\n" +
                        "📌 Автомобиль: %s\n" +
                        "📍 Город: %s\n" +
                        "💰 Цена: %s $",
                carName, city, price
        );

        sendMessage(message);
    }

    private void sendMessage(String text) {
        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";

        Map<String, Object> payload = new HashMap<>();
        payload.put("chat_id", chatId);
        payload.put("text", text);

        try {
            restTemplate.postForObject(url, payload, String.class);
        } catch (Exception e) {
            System.err.println("Ошибка отправки в Telegram: " + e.getMessage());
        }
    }
}