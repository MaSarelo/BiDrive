package com.bidrive.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "brands")
public class Brand {

    // Геттеры и сеттеры
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    // Пустой конструктор
    public Brand() {}

    // Конструктор
    public Brand(String name) {
        this.name = name;
    }

}