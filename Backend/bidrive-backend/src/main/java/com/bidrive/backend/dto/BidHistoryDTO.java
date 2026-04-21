package com.bidrive.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Setter
@Getter
public class BidHistoryDTO {
    // Геттеры и сеттеры
    private Long bidId;
    private String userName;
    private BigDecimal amount;
    private LocalDateTime createdAt;

}