package com.bidrive.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore; // Импорт
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "auctions")
public class Auction {

    // Геттеры и сеттеры
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne
    @JoinColumn(name = "model_id", nullable = false)
    private Model model;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "mileage", nullable = false)
    private Integer mileage;

    @ManyToOne
    @JoinColumn(name = "transmission_id", nullable = false)
    private Transmission transmission;

    @ManyToOne
    @JoinColumn(name = "fuel_type_id", nullable = false)
    private FuelType fuelType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "starting_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal startingPrice;

    @Column(name = "current_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "min_bid_step", precision = 10, scale = 2)
    private BigDecimal minBidStep = BigDecimal.valueOf(100);

    @Column(name = "status", length = 20)
    private String status = "DRAFT";

    @Column(name = "moderation_status", length = 20)
    private String moderationStatus = "PENDING";

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @ManyToOne
    @JoinColumn(name = "city_id")
    private City city;

    @ManyToOne
    @JoinColumn(name = "winner_id")
    private User winner;

    @Column(name = "main_image_url")
    private String mainImageUrl;

    // Фото
    @OneToMany(mappedBy = "auction", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<CarImage> images;

    // Важно: геттер для bids нужен для Scheduler, а сетчик нужен для JPA
    // === ИСПРАВЛЕНО: Добавлен @JsonIgnore ===
    @OneToMany(mappedBy = "auction", fetch = FetchType.LAZY)
    @JsonIgnore // <--- ЭТО РЕШАЕТ ПРОБЛЕМУ РЕКУРСИИ
    private List<Bid> bids;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Геттер и сеттер
    @Column(name = "rejection_reason")
    private String rejectionReason;

    // Конструктор
    public Auction() {}

}