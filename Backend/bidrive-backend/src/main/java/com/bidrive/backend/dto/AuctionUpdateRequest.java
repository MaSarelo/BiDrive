package com.bidrive.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AuctionUpdateRequest {
    private Long brandId;
    private Long modelId;
    private Integer year;
    private Integer mileage;

    // === ИСПРАВЛЕНО: Integer вместо Long ===
    private Integer transmissionId;
    private Integer fuelTypeId;
    private Integer cityId;
    // ======================================

    private String description;
    private BigDecimal startingPrice;
    private BigDecimal minBidStep;
    private LocalDateTime endTime;
    private String vin;
    private List<String> imageUrls;
    private String status;
}