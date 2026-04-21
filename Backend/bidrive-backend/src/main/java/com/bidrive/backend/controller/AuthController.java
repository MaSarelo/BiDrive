package com.bidrive.backend.controller;

import com.bidrive.backend.entity.User;
import com.bidrive.backend.repository.UserRepository;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // 1. Регистрация
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()) != null) {
            return ResponseEntity.badRequest().body("Пользователь с таким email уже существует");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRoleId(1L);

        userRepository.save(user);
        return ResponseEntity.ok("Регистрация успешна! Теперь войдите в систему.");
    }

    // 2. Вход (Login)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail());

        if (user == null) {
            return ResponseEntity.status(401).body("Пользователь не найден");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body("Неверный пароль");
        }

        // === ПРОВЕРКА БЛОКИРОВКИ ===
        // Если isBlocked = true, не даем войти
        if (Boolean.TRUE.equals(user.getIsBlocked())) {
            return ResponseEntity.status(403).body("Ваш аккаунт заблокирован администратором");
        }
        // ==========================

        return ResponseEntity.ok(user);
    }

    // === DTO ===
    @Setter
    @Getter
    public static class LoginRequest {
        private String email;
        private String password;

    }

    @Setter
    @Getter
    public static class RegisterRequest {
        private String firstName;
        private String lastName;
        private String email;
        private String password;
        private String phone;

    }
}