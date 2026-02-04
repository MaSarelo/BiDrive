package com.bidrive.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "cities")
public class City {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false)
    private String name;

    // Связь с областью (один город относится к одной области)
    @ManyToOne
    @JoinColumn(name = "region_id")
    private Region region;

    public City() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Region getRegion() { return region; }
    public void setRegion(Region region) { this.region = region; }
}