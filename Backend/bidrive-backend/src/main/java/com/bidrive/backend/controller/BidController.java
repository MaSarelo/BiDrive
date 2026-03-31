package com.bidrive.backend.controller;

import com.bidrive.backend.entity.Bid;
import com.bidrive.backend.repository.BidRepository;
import com.bidrive.backend.service.AuctionService; // <--- ИМПОРТИРУЕМ AuctionService
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/bids")
public class BidController {

    @Autowired
    private BidRepository bidRepository;

    // Подключаем AuctionService, там где проверка продавца
    @Autowired
    private AuctionService auctionService;

    // GET: Получить все ставки
    @GetMapping
    public List<Bid> getAllBids() {
        return bidRepository.findAll();
    }

    // POST: Сделать ставку
    @PostMapping
    public Bid createBid(
            @RequestParam Long auctionId,
            @RequestParam Long userId,
            @RequestParam BigDecimal amount
    ) {
        // ВЫЗЫВАЕМ МЕТОД ИЗ AuctionService (там работает проверка!)
        return auctionService.placeBid(auctionId, userId, amount);
    }
}