package com.bidrive.backend.service;

import com.bidrive.backend.entity.User;
import com.bidrive.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Метод для блокировки или разблокировки пользователя
    public void blockUser(Long userId, Boolean isBlocked) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        user.setIsBlocked(isBlocked);
        userRepository.save(user);
    }
}