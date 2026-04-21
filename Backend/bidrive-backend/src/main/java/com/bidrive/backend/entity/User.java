package com.bidrive.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    // Важно: в базе поле называется password_hash (с подчеркиванием)
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "phone")
    private String phone;

    // Пока просто храним ID роли (Long). Связь с таблицей roles сделаем позже.
    @Column(name = "role_id", nullable = false)
    private Long roleId;

    @Column(name = "is_blocked")
    private Boolean isBlocked = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    // Пустой конструктор обязателен для Hibernate/JPA
    public User() {}


}