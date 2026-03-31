package com.bidrive.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BidHistoryDTO {
    private Long bidId;
    private String userName;
    private BigDecimal amount;
    private LocalDateTime createdAt;

    // Геттеры и сеттеры
    public Long getBidId() { return bidId; }
    public void setBidId(Long bidId) { this.bidId = bidId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}