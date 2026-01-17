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

    // GET: Получить все уведомления пользователя
    @GetMapping
    public List<Notification> getUserNotifications(@RequestParam Long userId) {
        return notificationRepository.findByUserId(userId);
    }
}