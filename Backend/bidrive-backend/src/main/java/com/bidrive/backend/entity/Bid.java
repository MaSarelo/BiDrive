package com.bidrive.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "bids")
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === ИСПРАВЛЕНО: Игнорируем auction при сериализации ===
    @ManyToOne
    @JoinColumn(name = "auction_id", nullable = false)
    @JsonIgnore // <--- Чтобы не было цикла Bid -> Auction -> Bids
    private Auction auction;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Bid() {}

}