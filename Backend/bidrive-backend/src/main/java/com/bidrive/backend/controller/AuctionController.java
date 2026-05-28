package com.bidrive.backend.controller;

import com.bidrive.backend.entity.Auction;
import com.bidrive.backend.repository.AuctionRepository;
import com.bidrive.backend.service.AuctionService;
import com.bidrive.backend.dto.AuctionUpdateRequest;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.bidrive.backend.dto.BidHistoryDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private AuctionService auctionService;

    // TelegramService здесь больше не нужен - логика внутри AuctionService

    // GET: Список всех активных аукционов
    @GetMapping
    public List<Auction> getAllAuctions() {
        return auctionRepository.findByStatus("ACTIVE");
    }

    // GET: Расширенный поиск
    @GetMapping("/search")
    public List<Auction> searchAuctions(
            @RequestParam(required = false) String brandId,
            @RequestParam(required = false) String modelId,
            @RequestParam(required = false) String fuelTypeId,
            @RequestParam(required = false) String transmissionId,
            @RequestParam(required = false) String regionId,
            @RequestParam(required = false) String cityId,
            @RequestParam(required = false) String yearFrom,
            @RequestParam(required = false) String yearTo,
            @RequestParam(required = false) String priceFrom,
            @RequestParam(required = false) String priceTo,
            @RequestParam(required = false) String mileageFrom,
            @RequestParam(required = false) String mileageTo
    ) {
        Long bId = toLong(brandId);
        Long mId = toLong(modelId);
        Integer fId = toInt(fuelTypeId);
        Integer tId = toInt(transmissionId);
        Integer rId = toInt(regionId);
        Integer cId = toInt(cityId);

        return auctionRepository.searchAuctions(
                bId, mId, fId, tId, rId, cId,
                toInt(yearFrom), toInt(yearTo),
                toDouble(priceFrom), toDouble(priceTo),
                toInt(mileageFrom), toInt(mileageTo)
        );
    }

    // Вспомогательные методы конвертации
    private Long toLong(String val) {
        if (val == null || val.isEmpty()) return null;
        try { return Long.parseLong(val); } catch (Exception e) { return null; }
    }
    private Integer toInt(String val) {
        if (val == null || val.isEmpty()) return null;
        try { return Integer.parseInt(val); } catch (Exception e) { return null; }
    }
    private Double toDouble(String val) {
        if (val == null || val.isEmpty()) return null;
        try { return Double.parseDouble(val); } catch (Exception e) { return null; }
    }

    @GetMapping("/{id}")
    public Auction getAuctionById(@PathVariable Long id) {
        return auctionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Аукцион не найден"));
    }

    @GetMapping("/{id}/bids-history")
    public List<BidHistoryDTO> getBidsHistory(@PathVariable Long id) {
        return auctionService.getBidHistory(id);
    }

    // === СОЗДАНИЕ АУКЦИОНА ===
    @PostMapping
    public Auction createAuction(@RequestBody CreateAuctionRequest request) {
        return auctionService.createAuction(
                request.getSellerId(),
                request.getBrandId(),
                request.getModelId(),
                request.getYear(),
                request.getMileage(),
                request.getTransmissionId(),
                request.getFuelTypeId(),
                request.getDescription(),
                request.getStartingPrice(),
                request.getMinBidStep(),
                request.getCityId(),
                request.getImageUrls(),
                request.getEndTime(),
                request.getVin()
        );
    }

    // Вспомогательный класс
    @Setter
    @Getter
    public static class CreateAuctionRequest {
        // Геттеры и сеттеры
        private Long sellerId;
        private Long brandId;
        private Long modelId;
        private Integer year;
        private Integer mileage;
        private Integer transmissionId;
        private Integer fuelTypeId;
        private String description;
        private BigDecimal startingPrice;
        private BigDecimal minBidStep;
        private Integer cityId;
        private List<String> imageUrls;
        private LocalDateTime endTime;
        private String vin;

    }

    // === ОДОБРЕНИЕ АУКЦИОНА ===
    @PutMapping("/{id}/approve")
    public void approveAuction(@PathVariable Long id) {
        // Просто вызываем сервис. Отправка в Telegram происходит внутри сервиса.
        auctionService.approveAuction(id);
    }

    @GetMapping("/my")
    public List<Auction> getMyAuctions(@RequestParam Long sellerId) {
        return auctionRepository.findBySellerId(sellerId);
    }

    @DeleteMapping("/{id}")
    public void deleteAuction(@PathVariable Long id, @RequestParam Long userId) {
        auctionService.deleteAuction(id, userId);
    }

    @PutMapping("/{id}/publish")
    public void publishAuction(@PathVariable Long id, @RequestParam Long userId) {
        auctionService.publishAuction(id, userId);
    }

    @PutMapping("/{id}/finish")
    public void finishAuction(@PathVariable Long id, @RequestParam Long userId) {
        auctionService.finishAuction(id, userId);
    }

    // Получение списка лотов на модерации
    @GetMapping("/pending")
    public List<Auction> getPendingAuctions() {
        return auctionRepository.findByStatus("PENDING");
    }

    // === ОТКЛОНЕНИЕ АУКЦИОНА ===
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectAuction(@PathVariable Long id, @RequestParam String reason) {
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Auction not found"));

        auction.setStatus("REJECTED");
        auction.setRejectionReason(reason);
        auctionRepository.save(auction);

        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAuction(
            @PathVariable Long id,
            @RequestBody AuctionUpdateRequest request,
            @RequestParam Long userId // ID пользователя, который редактирует
    ) {
        try {
            auctionService.updateAuction(id, userId, request);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}