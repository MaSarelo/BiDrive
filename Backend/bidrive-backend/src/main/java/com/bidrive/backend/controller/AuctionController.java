package com.bidrive.backend.controller;

import com.bidrive.backend.entity.Auction;
import com.bidrive.backend.repository.AuctionRepository;
import com.bidrive.backend.service.AuctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private AuctionService auctionService;

    // GET: Список всех
    @GetMapping
    public List<Auction> getAllAuctions() {
        return auctionRepository.findByStatus("ACTIVE");
    }

    // GET: Расширенный поиск (с безопасной конвертацией)
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

    // Вспомогательные методы (должны быть в конце класса!)
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

    // --- Остальные методы (Create, Approve, etc.) ---

    @GetMapping("/{id}")
    public Auction getAuctionById(@PathVariable Long id) {
        return auctionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Аукцион не найден"));
    }

    @PostMapping
    public Auction createAuction(
            @RequestParam Long sellerId,
            @RequestParam Long brandId,
            @RequestParam Long modelId,
            @RequestParam Integer year,
            @RequestParam Integer mileage,
            @RequestParam Integer transmissionId,
            @RequestParam Integer fuelTypeId,
            @RequestParam String description,
            @RequestParam BigDecimal startingPrice,
            @RequestParam String mainImageUrl,
            @RequestParam Long cityId
    ) {
        return auctionService.createAuction(
                sellerId, brandId, modelId, year, mileage,
                transmissionId, fuelTypeId, description, startingPrice, mainImageUrl, cityId
        );
    }

    @PutMapping("/{id}/approve")
    public void approveAuction(@PathVariable Long id) {
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

    @GetMapping("/pending")
    public List<Auction> getPendingAuctions() {
        return auctionRepository.findByModerationStatus("PENDING");
    }
}