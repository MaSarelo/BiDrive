package com.bidrive.backend.controller;

import com.bidrive.backend.entity.Auction;
import com.bidrive.backend.repository.AuctionRepository;
import com.bidrive.backend.service.AuctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private AuctionService auctionService;

    // GET: Получить все аукционы
    @GetMapping
    public List<Auction> getAllAuctions() {
        return auctionRepository.findAll();
    }

    // POST: Создать новый аукцион
    @PostMapping
    public Auction createAuction(
            @RequestParam Long sellerId,
            @RequestParam Long brandId,
            @RequestParam Long modelId,
            @RequestParam Integer year,
            @RequestParam Integer mileage,
            @RequestParam String transmission,
            @RequestParam String fuelType,
            @RequestParam String description,
            @RequestParam BigDecimal startingPrice
    ) {
        return auctionService.createAuction(sellerId, brandId, modelId, year, mileage, transmission, fuelType, description, startingPrice);
    }
    // PUT: Одобрить аукцион (для администратора)
    @PutMapping("/{id}/approve")
    public void approveAuction(@PathVariable Long id) {
        auctionService.approveAuction(id);
    }

    // GET: Найти аукционы по ID бренда
    @GetMapping("/search")
    public List<Auction> searchAuctions(@RequestParam Long brandId) {
        // Будем искать только активные аукционы этого бренда
        return auctionRepository.findByBrandIdAndStatus(brandId, "ACTIVE");
    }

    // GET: Получить один аукцион по ID (для страницы детальной информации)
    @GetMapping("/{id}")
    public Auction getAuctionById(@PathVariable Long id) {
        return auctionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Аукцион не найден"));
    }
}