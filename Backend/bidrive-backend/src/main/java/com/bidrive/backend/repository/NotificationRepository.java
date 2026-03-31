package com.bidrive.backend.repository;

import com.bidrive.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Найти все уведомления конкретного пользователя
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
}