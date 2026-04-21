package com.bidrive.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "models")
public class Model {

    // Геттеры и сеттеры
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Связь: Одна модель принадлежит одной марке (@ManyToOne)
    // name = "brand_id" указывает на колонку в таблице models
    @ManyToOne
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(name = "name", nullable = false)
    private String name;

    // Пустой конструктор
    public Model() {}

}