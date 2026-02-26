package com.bidrive.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "regions")
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; // Возвращаем Integer

    @Column(name = "name", nullable = false)
    private String name;

    public Region() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}