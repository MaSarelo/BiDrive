package com.bidrive.backend.service;

import com.bidrive.backend.entity.User;
import com.bidrive.backend.repository.RoleRepository;
import com.bidrive.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    // Метод для блокировки или разблокировки пользователя
    public void blockUser(Long userId, Boolean isBlocked) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        user.setIsBlocked(isBlocked);
        userRepository.save(user);
    }

    // === НОВЫЙ МЕТОД: Смена роли пользователя ===
    @Transactional
    public void changeRole(Long userId, Long newRoleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Проверка: роль существует
        if (!roleRepository.existsById(newRoleId)) {
            throw new RuntimeException("Роль не найдена");
        }

        // Критичная проверка: не удаляем последнего админа
        if (user.getRoleId() == 2L && newRoleId != 2L) {
            long adminCount = userRepository.countByRoleId(2L);
            if (adminCount <= 1) {
                throw new RuntimeException("Нельзя снять роль с последнего администратора");
            }
        }

        user.setRoleId(newRoleId);
        userRepository.save(user);
    }
}