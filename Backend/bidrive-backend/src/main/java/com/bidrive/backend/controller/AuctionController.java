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

    // GET: Список всех (ОБНОВЛЕННЫЙ)
    @GetMapping
    public List<Auction> getAllAuctions() {
        // На главной показываем только АКТИВНЫЕ лоты
        return auctionRepository.findByStatus("ACTIVE");
    }

    // GET: Поиск по бренду
    @GetMapping("/search")
    public List<Auction> searchAuctions(@RequestParam Long brandId) {
        return auctionRepository.findByBrandIdAndStatus(brandId, "ACTIVE");
    }

    // GET: Получить один по ID
    @GetMapping("/{id}")
    public Auction getAuctionById(@PathVariable Long id) {
        return auctionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Аукцион не найден"));
    }

    // POST: Создать аукцион (ОБНОВЛЕННЫЙ)
    @PostMapping
    public Auction createAuction(
            @RequestParam Long sellerId,
            @RequestParam Long brandId,
            @RequestParam Long modelId,
            @RequestParam Integer year,
            @RequestParam Integer mileage,
            @RequestParam Integer transmissionId, // Принимаем ID
            @RequestParam Integer fuelTypeId,     // Принимаем ID
            @RequestParam String description,
            @RequestParam BigDecimal startingPrice,
            @RequestParam String mainImageUrl,   // Принимаем ссылку на фото
            @RequestParam Long cityId // Принимаем ID города
    ) {
        return auctionService.createAuction(
                sellerId, brandId, modelId, year, mileage,
                transmissionId, fuelTypeId, description, startingPrice, mainImageUrl, cityId
        );
    }

    // PUT: Одобрить аукцион
    @PutMapping("/{id}/approve")
    public void approveAuction(@PathVariable Long id) {
        auctionService.approveAuction(id);
    }

    // GET: Получить аукционы конкретного пользователя (Личный кабинет)
    @GetMapping("/my")
    public List<Auction> getMyAuctions(@RequestParam Long sellerId) {
        return auctionRepository.findBySellerId(sellerId);
    }

    // DELETE: Удалить лот (только если это черновик и твой)
    @DeleteMapping("/{id}")
    public void deleteAuction(@PathVariable Long id, @RequestParam Long userId) {
        auctionService.deleteAuction(id, userId);
    }

    // PUT: Опубликовать лот (перевести в ACTIVE)
    @PutMapping("/{id}/publish")
    public void publishAuction(@PathVariable Long id, @RequestParam Long userId) {
        auctionService.publishAuction(id, userId);
    }

    // PUT: Завершить торги (назначить победителя)
    @PutMapping("/{id}/finish")
    public void finishAuction(@PathVariable Long id, @RequestParam Long userId) {
        auctionService.finishAuction(id, userId);
    }
}