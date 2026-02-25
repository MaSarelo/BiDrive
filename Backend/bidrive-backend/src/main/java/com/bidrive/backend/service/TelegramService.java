package com.bidrive.backend.service;

import com.bidrive.backend.entity.Auction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.File;

@Service
public class TelegramService {

    @Value("${telegram.bot.token}")
    private String botToken;

    @Value("${telegram.chat.id}")
    private String chatId;

    private final RestTemplate restTemplate = new RestTemplate();

    // Метод вызывается из AuctionService
    public void sendNewLotNotification(Auction auction) {
        String caption = formatMessage(auction);

        // Если есть главное фото - отправляем фото с подписью
        if (auction.getMainImageUrl() != null && !auction.getMainImageUrl().isEmpty()) {
            try {
                String filePath = System.getProperty("user.dir") + auction.getMainImageUrl();
                File imageFile = new File(filePath);

                if (imageFile.exists()) {
                    sendPhoto(imageFile, caption);
                } else {
                    // Если файл не нашли, отправляем просто текст
                    sendMessage(caption);
                }
            } catch (Exception e) {
                System.err.println("Ошибка отправки фото в Telegram: " + e.getMessage());
                sendMessage(caption); // Фолбек на текст
            }
        } else {
            // Если фото нет, отправляем текст
            sendMessage(caption);
        }
    }

    // Формирование красивого сообщения
    private String formatMessage(Auction a) {
        StringBuilder sb = new StringBuilder();

        // Заголовок
        sb.append("🚗 <b>").append(a.getBrand().getName())
                .append(" ").append(a.getModel().getName())
                .append(" (").append(a.getYear()).append(")</b>\n\n");

        // Цена
        sb.append("💰 <b>Цена:</b> ").append(a.getCurrentPrice()).append(" BYN\n");

        // Характеристики
        sb.append("⚙️ <b>КПП:</b> ").append(a.getTransmission() != null ? a.getTransmission().getName() : "-").append("\n");
        sb.append("⛽ <b>Топливо:</b> ").append(a.getFuelType() != null ? a.getFuelType().getName() : "-").append("\n");
        sb.append("🛣 <b>Пробег:</b> ").append(String.format("%,d", a.getMileage())).append(" км\n");

        // Локация
        if (a.getCity() != null) {
            sb.append("📍 <b>Локация:</b> ").append(a.getCity().getName());
            if (a.getCity().getRegion() != null) {
                sb.append(", ").append(a.getCity().getRegion().getName());
            }
            sb.append("\n");
        }

        // Описание (обрезаем, если слишком длинное, лимит Telegram ~1024 символа для caption)
        if (a.getDescription() != null && !a.getDescription().isEmpty()) {
            sb.append("\n📝 <b>Описание:</b>\n");
            String desc = a.getDescription();
            if (desc.length() > 300) {
                desc = desc.substring(0, 300) + "...";
            }
            sb.append(desc).append("\n");
        }

        return sb.toString();
    }

    // Отправка ФОТО (Multipart)
    private void sendPhoto(File file, String caption) {
        String url = "https://api.telegram.org/bot" + botToken + "/sendPhoto";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("chat_id", chatId);
        body.add("photo", new FileSystemResource(file));
        body.add("caption", caption);
        body.add("parse_mode", "HTML");

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForObject(url, requestEntity, String.class);
        } catch (Exception e) {
            System.err.println("Ошибка Telegram API (Photo): " + e.getMessage());
        }
    }

    // Отправка ТЕКСТА (fallback)
    private void sendMessage(String text) {
        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";

        MultiValueMap<String, Object> payload = new LinkedMultiValueMap<>();
        payload.add("chat_id", chatId);
        payload.add("text", text);
        payload.add("parse_mode", "HTML");

        try {
            restTemplate.postForObject(url, payload, String.class);
        } catch (Exception e) {
            System.err.println("Ошибка Telegram API (Message): " + e.getMessage());
        }
    }
}