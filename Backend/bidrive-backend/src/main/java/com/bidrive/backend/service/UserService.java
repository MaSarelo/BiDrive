package com.bidrive.backend.service;

import com.bidrive.backend.entity.User;
import com.bidrive.backend.repository.RoleRepository;
import com.bidrive.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;  // <-- НЕ final, с @Autowired

    @Autowired
    private RoleRepository roleRepository;

    // Метод для блокировки или разблокировки пользователя
    public void blockUser(Long userId, Boolean isBlocked) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        user.setIsBlocked(isBlocked);
        userRepository.save(user);
    }

    // === СМЕНА РОЛИ ===
    @Transactional
    public void changeRole(Long userId, Long newRoleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (!roleRepository.existsById(newRoleId)) {
            throw new RuntimeException("Роль не найдена");
        }

        if (user.getRoleId() == 2L && newRoleId != 2L) {
            long adminCount = userRepository.countByRoleId(2L);
            if (adminCount <= 1) {
                throw new RuntimeException("Нельзя снять роль с последнего администратора");
            }
        }

        user.setRoleId(newRoleId);
        userRepository.save(user);
    }

    // === ОБНОВЛЕНИЕ ПРОФИЛЯ ===
    @Transactional
    public void updateProfile(Long userId, String firstName, String lastName, String email, String phone) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (firstName != null && !firstName.trim().isEmpty()) {
            user.setFirstName(firstName.trim());
        }
        if (lastName != null && !lastName.trim().isEmpty()) {
            user.setLastName(lastName.trim());
        }
        if (email != null && !email.trim().isEmpty()) {
            // Проверка на уникальность email (если он изменился)
            if (!email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
                throw new RuntimeException("Email уже занят");
            }
            user.setEmail(email.trim());
        }
        if (phone != null) {
            user.setPhone(phone.trim());
        }

        userRepository.save(user);
    }

    // === СМЕНА ПАРОЛЯ (ИСПРАВЛЕНО: passwordHash вместо password) ===
    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("Пароль должен содержать не менее 6 символов");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Проверка текущего пароля (используем getPasswordHash())
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Неверный текущий пароль");
        }

        // Обновляем пароль (используем setPasswordHash())
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}