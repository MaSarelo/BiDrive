package com.bidrive.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Setter
@Getter
public class DashboardStats {
    // Геттеры и сеттеры
    private Long totalUsers;
    private Long activeAuctions;
    private Long totalBids;
    private BigDecimal totalTurnover;

    // Пустой конструктор
    public DashboardStats() {}

}