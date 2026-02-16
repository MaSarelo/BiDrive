package com.bidrive.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List; // Обязательно для списка фото
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "auctions")
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Связь с продавцом (User)
    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    // Связь с брендом (Brand)
    @ManyToOne
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    // Связь с моделью (Model)
    @ManyToOne
    @JoinColumn(name = "model_id", nullable = false)
    private Model model;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "mileage", nullable = false)
    private Integer mileage;

    // Нормализованная связь с таблицей КПП (объект, а не строка)
    @ManyToOne
    @JoinColumn(name = "transmission_id", nullable = false)
    private Transmission transmission;

    // Нормализованная связь с таблицей Топлива
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

    // Победитель
    @ManyToOne
    @JoinColumn(name = "winner_id")
    private User winner;

    // Ссылка на главное фото (обложка)
    @Column(name = "main_image_url")
    private String mainImageUrl;

    // ============================================
    // ГАЛЕРЕЯ ФОТОГРАФИЙ (Связь OneToMany)
    // ============================================
    @OneToMany(mappedBy = "auction", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<CarImage> images;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Пустой конструктор (обязателен JPA)
    public Auction() {}

    // ============================================
    // Геттеры и Сеттеры
    // ============================================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getSeller() { return seller; }
    public void setSeller(User seller) { this.seller = seller; }

    public Brand getBrand() { return brand; }
    public void setBrand(Brand brand) { this.brand = brand; }

    public Model getModel() { return model; }
    public void setModel(Model model) { this.model = model; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public Integer getMileage() { return mileage; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }

    public Transmission getTransmission() { return transmission; }
    public void setTransmission(Transmission transmission) { this.transmission = transmission; }

    public FuelType getFuelType() { return fuelType; }
    public void setFuelType(FuelType fuelType) { this.fuelType = fuelType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getStartingPrice() { return startingPrice; }
    public void setStartingPrice(BigDecimal startingPrice) { this.startingPrice = startingPrice; }

    public BigDecimal getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(BigDecimal currentPrice) { this.currentPrice = currentPrice; }

    public BigDecimal getMinBidStep() { return minBidStep; }
    public void setMinBidStep(BigDecimal minBidStep) { this.minBidStep = minBidStep; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getModerationStatus() { return moderationStatus; }
    public void setModerationStatus(String moderationStatus) { this.moderationStatus = moderationStatus; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public User getWinner() { return winner; }
    public void setWinner(User winner) { this.winner = winner; }

    public String getMainImageUrl() { return mainImageUrl; }
    public void setMainImageUrl(String mainImageUrl) { this.mainImageUrl = mainImageUrl; }

    public List<CarImage> getImages() { return images; }
    public void setImages(List<CarImage> images) { this.images = images; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public City getCity() { return city; }
    public void setCity(City city) { this.city = city; }
}