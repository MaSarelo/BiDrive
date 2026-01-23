package com.bidrive.backend.service;

import com.bidrive.backend.entity.*;
import com.bidrive.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

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

    // Новые репозитории для справочников
    @Autowired
    private TransmissionRepository transmissionRepository;

    @Autowired
    private FuelTypeRepository fuelTypeRepository;

    // Репозитории для уведомлений и ставок (чтобы старая логика работала)
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private BidRepository bidRepository;

    // Метод для создания нового аукциона
    @Transactional
    public Auction createAuction(
            Long sellerId,
            Long brandId,
            Long modelId,
            Integer year,
            Integer mileage,
            Integer transmissionId,   // ID КПП
            Integer fuelTypeId,       // ID Топлива
            String description,
            BigDecimal startingPrice, // Исправлено: Принимаем BigDecimal, а не String
            String mainImageUrl     // Ссылка на фото
    ) {
        // 1. Находим связанные сущности
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new RuntimeException("Бренд не найден"));
        Model model = modelRepository.findById(modelId)
                .orElseThrow(() -> new RuntimeException("Модель не найдена"));

        // 2. Находим объекты из справочников (Нормализация)
        Transmission transmission = transmissionRepository.findById(transmissionId)
                .orElseThrow(() -> new RuntimeException("Тип КПП не найден"));
        FuelType fuelType = fuelTypeRepository.findById(fuelTypeId)
                .orElseThrow(() -> new RuntimeException("Тип топлива не найден"));

        // 3. Создаем объект аукциона
        Auction auction = new Auction();
        auction.setSeller(seller);
        auction.setBrand(brand);
        auction.setModel(model);
        auction.setYear(year);
        auction.setMileage(mileage);

        auction.setTransmission(transmission);
        auction.setFuelType(fuelType);

        auction.setDescription(description);

        // Устанавливаем цены (преобразование больше не нужно)
        auction.setStartingPrice(startingPrice);
        auction.setCurrentPrice(startingPrice); // Сначала текущая = начальной
        auction.setMinBidStep(BigDecimal.valueOf(100));

        auction.setMainImageUrl(mainImageUrl); // Сохраняем путь к фото

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

        auction.setModerationStatus("APPROVED");
        auction.setStatus("ACTIVE");
        auction.setUpdatedAt(LocalDateTime.now());

        auctionRepository.save(auction);
    }

    // Метод для создания ставки (логика перебития ставки)
    @Transactional
    public Bid placeBid(Long auctionId, Long userId, BigDecimal amount) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Аукцион не найден"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (!"ACTIVE".equals(auction.getStatus())) {
            throw new RuntimeException("Ставки возможны только на активные аукционы!");
        }

        if (amount.compareTo(auction.getCurrentPrice()) <= 0) {
            throw new RuntimeException("Ставка должна быть выше текущей цены!");
        }

        // Уведомления
        Optional<Bid> currentTopBid = bidRepository.findTopByAuctionIdOrderByAmountDesc(auctionId);

        if (currentTopBid.isPresent()) {
            User previousLeader = currentTopBid.get().getUser();
            if (!previousLeader.getId().equals(userId)) {
                Notification notification = new Notification();
                notification.setUser(previousLeader);
                notification.setType("BID_OUTBID");
                notification.setMessage("Вашу ставку на аукцион №" + auctionId + " перебили!");
                notification.setAuction(auction);
                notification.setIsRead(false);
                notification.setCreatedAt(LocalDateTime.now());
                notificationRepository.save(notification);
            }
        }

        Bid bid = new Bid();
        bid.setAuction(auction);
        bid.setUser(user);
        bid.setAmount(amount);
        bid.setCreatedAt(LocalDateTime.now());

        Bid savedBid = bidRepository.save(bid);

        auction.setCurrentPrice(amount);
        auctionRepository.save(auction);

        return savedBid;
    }
}