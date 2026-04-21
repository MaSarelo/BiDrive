package com.bidrive.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "cities")
public class City {

    // Геттеры и сеттеры
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; // Возвращаем Integer

    @Column(name = "name", nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "region_id")
    private Region region;

    public City() {}

}