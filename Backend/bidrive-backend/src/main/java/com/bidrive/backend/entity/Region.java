package com.bidrive.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "regions")
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; // Возвращаем Integer

    @Column(name = "name", nullable = false)
    private String name;

    public Region() {}

}