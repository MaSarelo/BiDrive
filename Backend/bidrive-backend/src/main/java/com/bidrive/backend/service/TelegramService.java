package com.bidrive.backend.service;

import com.bidrive.backend.entity.Auction;
import com.bidrive.backend.entity.CarImage;
import com.fasterxml.jackson.databind.ObjectMapper; // Для создания JSON
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TelegramService {

    @Value("${telegram.bot.token}")
    private String botToken;

    @Value("${telegram.chat.id}")
    private String chatId;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper(); // Для работы с JSON

    public void sendNewLotNotification(Auction auction) {
        List<CarImage> images = auction.getImages();
        String caption = formatMessage(auction);

        // 1. Если есть список изображений, отправляем альбомом
        if (images != null && !images.isEmpty()) {
            try {
                sendMediaGroup(images, caption);
                return; // Успешно отправили альбом
            } catch (Exception e) {
                System.err.println("Ошибка отправки альбома: " + e.getMessage());
                // Если альбом не ушел, пробуем фолбек
            }
        }

        // 2. Фолбек: отправляем одно фото (mainImageUrl) или просто текст
        if (auction.getMainImageUrl() != null && !auction.getMainImageUrl().isEmpty()) {
            try {
                String filePath = System.getProperty("user.dir") + auction.getMainImageUrl();
                File imageFile = new File(filePath);

                if (imageFile.exists()) {
                    sendPhoto(imageFile, caption);
                } else {
                    sendMessage(caption);
                }
            } catch (Exception e) {
                System.err.println("Ошибка отправки фото в Telegram: " + e.getMessage());
                sendMessage(caption);
            }
        } else {
            sendMessage(caption);
        }
    }

    // === НОВЫЙ МЕТОД: Отправка АЛЬБОМА (Media Group) ===
    private void sendMediaGroup(List<CarImage> images, String caption) throws Exception {
        String url = "https://api.telegram.org/bot" + botToken + "/sendMediaGroup";

        // Ограничение Telegram: не более 10 фото в одном альбоме
        int limit = Math.min(images.size(), 10);

        // 1. Формируем JSON массив media
        List<Map<String, Object>> mediaList = new ArrayList<>();
        for (int i = 0; i < limit; i++) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "photo");
            // attach://<key> ссылается на имя файла в multipart форме
            item.put("media", "attach://photo" + i);

            if (i == 0) {
                // Подпись ставим только у первого фото
                item.put("caption", caption);
                item.put("parse_mode", "HTML");
            }
            mediaList.add(item);
        }

        String mediaJson = objectMapper.writeValueAsString(mediaList);

        // 2. Формируем Multipart тело запроса
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("chat_id", chatId);
        body.add("media", mediaJson);

        // Прикрепляем файлы с ключами photo0, photo1 и т.д.
        for (int i = 0; i < limit; i++) {
            CarImage img = images.get(i);
            String filePath = System.getProperty("user.dir") + img.getImageUrl();
            File file = new File(filePath);

            if (file.exists()) {
                body.add("photo" + i, new FileSystemResource(file));
            } else {
                // Если файл не найден, это может сломать весь альбом.
                // Логируем и пропускаем (или можно кинуть исключение)
                System.err.println("Файл не найден для альбома: " + filePath);
            }
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        restTemplate.postForObject(url, requestEntity, String.class);
    }

    // Метод для отправки ОДНОГО фото (для фолбэка)
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

    // Формирование красивого сообщения
    private String formatMessage(Auction a) {
        StringBuilder sb = new StringBuilder();

        sb.append("🚗 <b>").append(a.getBrand().getName())
                .append(" ").append(a.getModel().getName())
                .append(" (").append(a.getYear()).append(")</b>\n\n");

        sb.append("💰 <b>Цена:</b> ").append(a.getCurrentPrice()).append(" BYN\n");

        sb.append("⚙️ <b>КПП:</b> ").append(a.getTransmission() != null ? a.getTransmission().getName() : "-").append("\n");
        sb.append("⛽ <b>Топливо:</b> ").append(a.getFuelType() != null ? a.getFuelType().getName() : "-").append("\n");
        sb.append("🛣 <b>Пробег:</b> ").append(String.format("%,d", a.getMileage())).append(" км\n");

        if (a.getCity() != null) {
            sb.append("📍 <b>Локация:</b> ").append(a.getCity().getName());
            if (a.getCity().getRegion() != null) {
                sb.append(", ").append(a.getCity().getRegion().getName());
            }
            sb.append("\n");
        }

        if (a.getDescription() != null && !a.getDescription().isEmpty()) {
            sb.append("\n📝 <b>Описание:</b>\n");
            sb.append(a.getDescription());
        }

        // Логика обрезки: если сообщение длиннее 1024 символов (лимит Telegram),
        // обрезаем его до 1021 символа и ставим троеточие.
        String result = sb.toString();
        if (result.length() > 1024) {
            return result.substring(0, 1021) + "...";
        }

        return result;
    }
}