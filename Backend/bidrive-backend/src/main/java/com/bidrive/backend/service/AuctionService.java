package com.bidrive.backend.service;

import com.bidrive.backend.entity.*;
import com.bidrive.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuctionService {

    @Autowired
    private TelegramService telegramService;

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private ModelRepository modelRepository;

    @Autowired
    private TransmissionRepository transmissionRepository;

    @Autowired
    private FuelTypeRepository fuelTypeRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private CityRepository cityRepository;

    // === ДОБАВЛЕН РЕПОЗИТОРИЙ ДЛЯ ФОТО ===
    @Autowired
    private CarImageRepository carImageRepository;
    // =====================================

    // ОБНОВЛЕННЫЙ МЕТОД (Принимает List<String> imageUrls)
    @Transactional
    public Auction createAuction(
            Long sellerId,
            Long brandId,
            Long modelId,
            Integer year,
            Integer mileage,
            Integer transmissionId,
            Integer fuelTypeId,
            String description,
            BigDecimal startingPrice,
            BigDecimal minBidStep,
            Integer cityId,
            List<String> imageUrls // <--- СПИСОК ФОТО
    ) {
        // 1. Находим связанные сущности
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new RuntimeException("Бренд не найден"));
        Model model = modelRepository.findById(modelId)
                .orElseThrow(() -> new RuntimeException("Модель не найдена"));

        Transmission transmission = transmissionRepository.findById(transmissionId)
                .orElseThrow(() -> new RuntimeException("Тип КПП не найден"));
        FuelType fuelType = fuelTypeRepository.findById(fuelTypeId)
                .orElseThrow(() -> new RuntimeException("Тип топлива не найден"));
        City city = cityRepository.findById(cityId)
                .orElseThrow(() -> new RuntimeException("Город не найден"));

        // 2. Создаем объект аукциона
        Auction auction = new Auction();
        auction.setSeller(seller);
        auction.setBrand(brand);
        auction.setModel(model);
        auction.setYear(year);
        auction.setMileage(mileage);
        auction.setTransmission(transmission);
        auction.setFuelType(fuelType);
        auction.setCity(city);
        auction.setDescription(description);

        auction.setStartingPrice(startingPrice);
        auction.setCurrentPrice(startingPrice);
        auction.setMinBidStep(minBidStep != null ? minBidStep : BigDecimal.valueOf(100));

        auction.setStatus("DRAFT");
        auction.setModerationStatus("PENDING");
        auction.setCreatedAt(LocalDateTime.now());
        auction.setUpdatedAt(LocalDateTime.now());

        // Сначала сохраняем аукцион, чтобы получить ID
        Auction savedAuction = auctionRepository.save(auction);

        // 3. СОХРАНЯЕМ ФОТО
        if (imageUrls != null && !imageUrls.isEmpty()) {
            for (int i = 0; i < imageUrls.size(); i++) {
                CarImage img = new CarImage();
                img.setAuction(savedAuction);
                img.setImageUrl(imageUrls.get(i));
                img.setDisplayOrder(i + 1);
                img.setIsMain(i == 0); // Первое фото - главное
                carImageRepository.save(img);
            }
            // Дублируем ссылку на главное фото в таблицу аукционов (для удобства)
            savedAuction.setMainImageUrl(imageUrls.get(0));
            auctionRepository.save(savedAuction);
        }

        // 4. Telegram
        try {
            // Передаем весь объект savedAuction
            telegramService.sendNewLotNotification(savedAuction);
        } catch (Exception e) {
            System.out.println("Ошибка Telegram: " + e.getMessage());
        }

        return savedAuction;
    }

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

    @Transactional
    public Bid placeBid(Long auctionId, Long userId, BigDecimal amount) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Аукцион не найден"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        if (!"ACTIVE".equals(auction.getStatus())) {
            throw new RuntimeException("Ставки возможны только на активные аукционы!");
        }
        BigDecimal currentPrice = auction.getCurrentPrice();
        BigDecimal minStep = auction.getMinBidStep();
        if (amount.compareTo(currentPrice) <= 0) {
            throw new RuntimeException("Ставка должна быть выше текущей цены!");
        }
        if (amount.subtract(currentPrice).compareTo(minStep) < 0) {
            throw new RuntimeException(String.format(
                    "Минимальный шаг ставки: %s$. Текущая цена: %s$. Ваша ставка слишком мала.",
                    minStep, currentPrice
            ));
        }
        // Уведомления

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

    @Transactional
    public void deleteAuction(Long auctionId, Long requestingUserId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Лот не найден"));
        if (!auction.getSeller().getId().equals(requestingUserId)) {
            throw new RuntimeException("Вы не можете удалить чужой лот");
        }
        if ("ACTIVE".equals(auction.getStatus())) {
            throw new RuntimeException("Нельзя удалить активный аукцион");
        }
        auctionRepository.delete(auction);
    }

    @Transactional
    public void publishAuction(Long auctionId, Long requestingUserId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Лот не найден"));
        if (!auction.getSeller().getId().equals(requestingUserId)) {
            throw new RuntimeException("Вы не можете публиковать чужой лот");
        }
        auction.setStatus("ACTIVE");
        auction.setModerationStatus("APPROVED");
        auction.setUpdatedAt(LocalDateTime.now());
        auctionRepository.save(auction);
    }

    @Transactional
    public void finishAuction(Long auctionId, Long requestingUserId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Аукцион не найден"));
        if (!auction.getSeller().getId().equals(requestingUserId)) {
            throw new RuntimeException("Вы не можете завершить чужой аукцион");
        }
        Bid topBid = bidRepository.findTopByAuctionIdOrderByAmountDesc(auctionId).orElse(null);
        if (topBid != null) {
            auction.setWinner(topBid.getUser());
        }
        auction.setStatus("FINISHED");
        auction.setUpdatedAt(LocalDateTime.now());
        auctionRepository.save(auction);
    }
}