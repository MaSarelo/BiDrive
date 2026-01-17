package com.bidrive.backend.service;

import com.bidrive.backend.entity.Auction;
import com.bidrive.backend.entity.Brand;
import com.bidrive.backend.entity.Model;
import com.bidrive.backend.entity.User;
import com.bidrive.backend.repository.AuctionRepository;
import com.bidrive.backend.repository.BrandRepository;
import com.bidrive.backend.repository.ModelRepository;
import com.bidrive.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class AuctionService {

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private ModelRepository modelRepository;

    // Метод для создания нового аукциона
    @Transactional
    public Auction createAuction(
            Long sellerId,
            Long brandId,
            Long modelId,
            Integer year,
            Integer mileage,
            String transmission,
            String fuelType,
            String description,
            BigDecimal startingPrice
    ) {
        // Находим связанные сущности
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new RuntimeException("Бренд не найден"));
        Model model = modelRepository.findById(modelId)
                .orElseThrow(() -> new RuntimeException("Модель не найден"));

        // Создаем объект аукциона
        Auction auction = new Auction();
        auction.setSeller(seller);
        auction.setBrand(brand);
        auction.setModel(model);
        auction.setYear(year);
        auction.setMileage(mileage);
        auction.setTransmission(transmission);
        auction.setFuelType(fuelType);

        auction.setDescription(description);

        auction.setStartingPrice(startingPrice);
        auction.setCurrentPrice(startingPrice);
        auction.setMinBidStep(BigDecimal.valueOf(100));

        auction.setStatus("DRAFT");
        auction.setModerationStatus("PENDING");

        auction.setCreatedAt(LocalDateTime.now());
        auction.setUpdatedAt(LocalDateTime.now());

        return auctionRepository.save(auction);
    }

    // Метод для одобрения аукциона администратором
    @Transactional
    public void approveAuction(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Аукцион не найден"));

        if ("APPROVED".equals(auction.getModerationStatus())) {
            throw new RuntimeException("Аукцион уже одобрен");
        }

        // Меняем статусы
        auction.setModerationStatus("APPROVED");
        auction.setStatus("ACTIVE"); // Аукцион становится активным
        auction.setUpdatedAt(LocalDateTime.now());

        auctionRepository.save(auction);
    }
}