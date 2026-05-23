package com.bidrive.backend.controller;

import com.bidrive.backend.entity.User;
import com.bidrive.backend.repository.UserRepository;
import com.bidrive.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    // GET: Получить всех пользователей
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // === НОВЫЙ: Получить пользователя по ID ===
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT: Заблокировать или разблокировать пользователя
    @PutMapping("/{id}/block")
    public void blockUser(@PathVariable Long id, @RequestParam Boolean isBlocked) {
        userService.blockUser(id, isBlocked);
    }

    // Смена роли пользователя
    @PutMapping("/{id}/role")
    public ResponseEntity<?> changeUserRole(
            @PathVariable Long id,
            @RequestParam Long roleId
    ) {
        try {
            userService.changeRole(id, roleId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Обновление данных профиля
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, String> updates) {
        try {
            userService.updateProfile(id,
                    updates.get("firstName"),
                    updates.get("lastName"),
                    updates.get("email"),
                    updates.get("phone")
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Смена пароля
    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> passwords) {
        try {
            userService.changePassword(id,
                    passwords.get("currentPassword"),
                    passwords.get("newPassword")
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}