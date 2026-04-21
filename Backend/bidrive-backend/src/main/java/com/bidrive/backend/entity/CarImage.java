package com.bidrive.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "car_images")
public class CarImage {

    // Геттеры и сеттеры
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Связь с аукционом (много фото могут относиться к одному лоту)
    @ManyToOne
    @JoinColumn(name = "auction_id", nullable = false)
    @JsonBackReference
    private Auction auction;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "is_main")
    private Boolean isMain = false;

    // Пустой конструктор
    public CarImage() {}

}