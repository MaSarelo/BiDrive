package com.bidrive.backend.dto;

import java.math.BigDecimal;

public class DashboardStats {
    private Long totalUsers;
    private Long activeAuctions;
    private Long totalBids;
    private BigDecimal totalTurnover;

    // Пустой конструктор
    public DashboardStats() {}

    // Геттеры и сеттеры
    public Long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(Long totalUsers) { this.totalUsers = totalUsers; }

    public Long getActiveAuctions() { return activeAuctions; }
    public void setActiveAuctions(Long activeAuctions) { this.activeAuctions = activeAuctions; }

    public Long getTotalBids() { return totalBids; }
    public void setTotalBids(Long totalBids) { this.totalBids = totalBids; }

    public BigDecimal getTotalTurnover() { return totalTurnover; }
    public void setTotalTurnover(BigDecimal totalTurnover) { this.totalTurnover = totalTurnover; }
}