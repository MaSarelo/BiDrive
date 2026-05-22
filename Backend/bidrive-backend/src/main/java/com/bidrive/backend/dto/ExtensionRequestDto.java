package com.bidrive.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ExtensionRequestDto {
    private Long id;
    private Long auctionId;
    private String carName;
    private String sellerName;
    private String status;
    private String reason;
    private LocalDateTime createdAt;
}