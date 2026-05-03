package com.bidrive.backend.controller;

import com.bidrive.backend.entity.Notification;
import com.bidrive.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    // Получить все уведомления для пользователя
    @GetMapping("/user/{userId}")
    public List<Notification> getUserNotifications(@PathVariable Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // Пометить уведомление как прочитанное
    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        notificationRepository.findById(id).ifPresent(notif -> {
            notif.setIsRead(true);
            notificationRepository.save(notif);
        });
    }

    // Пометить ВСЕ как прочитанные
    @PutMapping("/user/{userId}/read-all")
    public void markAllAsRead(@PathVariable Long userId) {
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notifs.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifs);
    }

    // Удалить уведомление
    @DeleteMapping("/{id}")
    public void deleteNotification(@PathVariable Long id) {
        notificationRepository.deleteById(id);
    }
}