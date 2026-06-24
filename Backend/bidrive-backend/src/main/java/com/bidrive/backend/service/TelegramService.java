package com.bidrive.backend.service;

import com.bidrive.backend.entity.Auction;
import com.bidrive.backend.entity.CarImage;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.text.DecimalFormat;
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

    @Value("${app.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Лимит Telegram API для caption в альбоме
    private static final int CAPTION_LIMIT = 1024;
    private static final int DESCRIPTION_LIMIT = 500;

    // === ЭКРАНИРОВАНИЕ HTML-СИМВОЛОВ ДЛЯ БЕЗОПАСНОГО ТЕКСТА ===
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    // === ГЛАВНЫЙ МЕТОД: ОТПРАВКА УВЕДОМЛЕНИЯ О НОВОМ ЛОТЕ ===
    public void sendNewLotNotification(Auction auction) {
        List<CarImage> images = auction.getImages();
        String caption = formatCaption(auction);

        // === 1. Если есть фото — отправляем альбом с caption ===
        if (images != null && !images.isEmpty()) {
            try {
                sendMediaGroupWithCaption(images, caption);
                System.out.println("✅ Альбом с информацией отправлен в Telegram (лот #" + auction.getId() + ")");
                return;
            } catch (Exception e) {
                System.err.println("❌ Ошибка отправки альбома: " + e.getMessage());
                // Пробуем фолбек — одно фото с caption
                try {
                    CarImage mainImage = images.stream()
                            .filter(CarImage::getIsMain)
                            .findFirst()
                            .orElse(images.get(0));
                    sendSinglePhotoWithCaption(mainImage, caption);
                    System.out.println("✅ Одно фото с информацией отправлено (фолбек)");
                    return;
                } catch (Exception ex) {
                    System.err.println("❌ Фолбек с фото тоже не сработал: " + ex.getMessage());
                }
            }
        }

        // === 2. Фолбек: только текст (если фото нет или всё упало) ===
        try {
            sendMessage(caption);
            System.out.println("✅ Текстовое сообщение отправлено (фолбек без фото)");
        } catch (Exception e) {
            System.err.println("❌ Полная ошибка отправки в Telegram: " + e.getMessage());
        }
    }

    // === АЛЬБОМ ФОТО С CAPTION НА ПЕРВОМ ФОТО ===
    private void sendMediaGroupWithCaption(List<CarImage> images, String caption) throws Exception {
        String url = "https://api.telegram.org/bot" + botToken + "/sendMediaGroup";

        int limit = Math.min(images.size(), 10);
        List<Map<String, Object>> mediaList = new ArrayList<>();

        for (int i = 0; i < limit; i++) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "photo");
            item.put("media", "attach://photo" + i);

            // Caption добавляем ТОЛЬКО к первому фото
            if (i == 0) {
                item.put("caption", caption);
                item.put("parse_mode", "HTML");
            }

            mediaList.add(item);
        }

        String mediaJson = objectMapper.writeValueAsString(mediaList);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("chat_id", chatId);
        body.add("media", mediaJson);

        for (int i = 0; i < limit; i++) {
            CarImage img = images.get(i);
            String filePath = System.getProperty("user.dir") + img.getImageUrl();
            File file = new File(filePath);

            if (file.exists()) {
                body.add("photo" + i, new FileSystemResource(file));
            } else {
                System.err.println("⚠️ Файл не найден: " + filePath);
            }
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        restTemplate.postForObject(url, requestEntity, String.class);
    }

    // === Фолбек: ОДНО ФОТО С CAPTION ===
    private void sendSinglePhotoWithCaption(CarImage image, String caption) throws Exception {
        String url = "https://api.telegram.org/bot" + botToken + "/sendPhoto";

        String filePath = System.getProperty("user.dir") + image.getImageUrl();
        File file = new File(filePath);

        if (!file.exists()) {
            throw new RuntimeException("Файл не найден: " + filePath);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("chat_id", chatId);
        body.add("photo", new FileSystemResource(file));
        body.add("caption", caption);
        body.add("parse_mode", "HTML");

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        restTemplate.postForObject(url, requestEntity, String.class);
    }

    // === Фолбек: ТОЛЬКО ТЕКСТ (без фото) ===
    private void sendMessage(String text) throws Exception {
        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";

        MultiValueMap<String, Object> payload = new LinkedMultiValueMap<>();
        payload.add("chat_id", chatId);
        payload.add("text", text);
        payload.add("parse_mode", "HTML");

        restTemplate.postForObject(url, payload, String.class);
    }

    // === ФОРМИРОВАНИЕ CAPTION (общее для всех способов отправки) ===
    private String formatCaption(Auction a) {
        StringBuilder sb = new StringBuilder();
        DecimalFormat df = new DecimalFormat("#,##0");

        // Заголовок с жирным выделением
        sb.append("🚗 <b>")
                .append(escapeHtml(a.getBrand().getName()))
                .append(" ")
                .append(escapeHtml(a.getModel().getName()))
                .append(" (").append(a.getYear()).append(")</b>\n\n");

        // Основные характеристики
        sb.append("💰 <b>Цена:</b> ").append(df.format(a.getCurrentPrice())).append(" BYN\n");
        sb.append("⚙️ <b>КПП:</b> ").append(a.getTransmission() != null ? escapeHtml(a.getTransmission().getName()) : "—").append("\n");
        sb.append("⛽ <b>Топливо:</b> ").append(a.getFuelType() != null ? escapeHtml(a.getFuelType().getName()) : "—").append("\n");
        sb.append("🛣 <b>Пробег:</b> ").append(a.getMileage() != null ? df.format(a.getMileage()) : "—").append(" км\n");

        // Локация
        if (a.getCity() != null) {
            sb.append("📍 <b>Локация:</b> ").append(escapeHtml(a.getCity().getName()));
            if (a.getCity().getRegion() != null) {
                sb.append(", ").append(escapeHtml(a.getCity().getRegion().getName()));
            }
            sb.append("\n");
        }

        // Описание (обрезается до DESCRIPTION_LIMIT, чтобы не превысить CAPTION_LIMIT)
        if (a.getDescription() != null && !a.getDescription().isEmpty()) {
            sb.append("\n📝 <b>Описание:</b>\n");
            String desc = a.getDescription().trim();
            if (desc.length() > DESCRIPTION_LIMIT) {
                desc = desc.substring(0, DESCRIPTION_LIMIT - 3) + "...";
            }
            sb.append(escapeHtml(desc));
        }

        // === ССЫЛКА ПРОСТЫМ ТЕКСТОМ (без HTML-тега <a>) ===
        String lotUrl = baseUrl.trim() + "/auction/" + a.getId();
        sb.append("\n\n🔗 ").append(lotUrl);

        // === ФИНАЛЬНАЯ ОБРЕЗКА: если всё равно длиннее CAPTION_LIMIT ===
        String result = sb.toString();
        if (result.length() > CAPTION_LIMIT) {
            // Обрезаем до 1021 символа и добавляем троеточие
            String trimmed = result.substring(0, CAPTION_LIMIT - 3) + "...";
            return trimmed;
        }

        return result;
    }
}