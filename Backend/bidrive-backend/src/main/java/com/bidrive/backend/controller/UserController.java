package com.bidrive.backend.controller;

import com.bidrive.backend.entity.User;
import com.bidrive.backend.repository.UserRepository;
import com.bidrive.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    // PUT: Заблокировать или разблокировать пользователя
    @PutMapping("/{id}/block")
    public void blockUser(@PathVariable Long id, @RequestParam Boolean isBlocked) {
        userService.blockUser(id, isBlocked);
    }

    // === НОВЫЙ ЭНДПОИНТ: Смена роли пользователя ===
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
}