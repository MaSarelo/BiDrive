package com.bidrive.backend.controller;

import com.bidrive.backend.entity.Bid;
import com.bidrive.backend.repository.BidRepository;
import com.bidrive.backend.service.BidService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/bids")
public class BidController {

    @Autowired
    private BidRepository bidRepository;

    // Добавляем сервис
    @Autowired
    private BidService bidService;

    // GET: Получить все ставки
    @GetMapping
    public List<Bid> getAllBids() {
        return bidRepository.findAll();
    }

    // POST: Сделать ставку (Создать ставку)
    // Чтобы протестировать этот метод, нужен Postman (браузер не умеет отправлять POST так просто)
    @PostMapping
    public Bid createBid(
            @RequestParam Long auctionId,
            @RequestParam Long userId,
            @RequestParam BigDecimal amount
    ) {
        return bidService.placeBid(auctionId, userId, amount);
    }
}