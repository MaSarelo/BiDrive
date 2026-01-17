package com.bidrive.backend.controller;

import com.bidrive.backend.entity.User;
import com.bidrive.backend.repository.UserRepository;
import com.bidrive.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
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
    // В Postman нужно будет отправить параметр isBlocked=true или isBlocked=false
    @PutMapping("/{id}/block")
    public void blockUser(@PathVariable Long id, @RequestParam Boolean isBlocked) {
        userService.blockUser(id, isBlocked);
    }
}