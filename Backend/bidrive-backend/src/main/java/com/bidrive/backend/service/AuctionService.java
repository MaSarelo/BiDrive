package com.bidrive.backend.service;

import com.bidrive.backend.dto.BidHistoryDTO;
import com.bidrive.backend.entity.*;
import com.bidrive.backend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AuctionService {

    private static final Logger log = LoggerFactory.getLogger(AuctionService.class);

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

    @Autowired
    private CarImageRepository carImageRepository;

    @Autowired
    private EntityManager entityManager;

    // === 1. ИСТОРИЯ СТАВОК ===
    @SuppressWarnings("unchecked")
    public List<BidHistoryDTO> getBidHistory(Long auctionId) {
        List<BidHistoryDTO> history = new ArrayList<>();
        try {
            Query query = entityManager.createNativeQuery("SELECT * FROM get_bid_history(:auctionId)");
            query.setParameter("auctionId", auctionId);
            List<Object[]> results = query.getResultList();
            for (Object[] row : results) {
                BidHistoryDTO dto = new BidHistoryDTO();
                dto.setBidId(((Number) row[0]).longValue());
                dto.setUserName((String) row[1]);
                dto.setAmount((BigDecimal) row[2]);
                dto.setCreatedAt((LocalDateTime) row[3]);
                history.add(dto);
            }
        } catch (Exception e) {
            log.error("Ошибка при получении истории ставок для аукциона {}", auctionId, e);
        }
        return history;
    }

    // === 2. СОЗДАНИЕ АУКЦИОНА ===
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
            List<String> imageUrls,
            LocalDateTime endTime
    ) {
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
        auction.setEndTime(endTime);

        auction.setStartingPrice(startingPrice);
        auction.setCurrentPrice(startingPrice);
        auction.setMinBidStep(minBidStep != null ? minBidStep : BigDecimal.valueOf(100));

        auction.setStatus("PENDING");
        auction.setModerationStatus("PENDING");

        auction.setCreatedAt(LocalDateTime.now());
        auction.setUpdatedAt(LocalDateTime.now());

        Auction savedAuction = auctionRepository.save(auction);

        if (imageUrls != null && !imageUrls.isEmpty()) {
            for (int i = 0; i < imageUrls.size(); i++) {
                CarImage img = new CarImage();
                img.setAuction(savedAuction);
                img.setImageUrl(imageUrls.get(i));
                img.setDisplayOrder(i + 1);
                img.setIsMain(i == 0);
                carImageRepository.save(img);
            }
            savedAuction.setMainImageUrl(imageUrls.get(0));
            auctionRepository.save(savedAuction);
        }

        return savedAuction;
    }

    // === 3. ОДОБРЕНИЕ АУКЦИОНА (АДМИН) ===
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

        try {
            telegramService.sendNewLotNotification(auction);
        } catch (Exception e) {
            log.error("Ошибка отправки в Telegram для аукциона {}", auctionId, e);
        }
    }

    // === 4. СТАВКА ===
    @Transactional
    public Bid placeBid(Long auctionId, Long userId, BigDecimal amount) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Аукцион не найден"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        Long sellerId = auction.getSeller().getId();
        if (sellerId.equals(userId)) {
            throw new RuntimeException("Нельзя делать ставки на свой лот.");
        }

        if (!"ACTIVE".equals(auction.getStatus())) {
            throw new RuntimeException("Ставки возможны только на активные аукционы!");
        }

        BigDecimal currentPrice = auction.getCurrentPrice();
        BigDecimal minStep = auction.getMinBidStep();

        if (amount.compareTo(currentPrice) <= 0) {
            throw new RuntimeException("Ставка должна быть выше текущей цены!");
        }
        if (amount.subtract(currentPrice).compareTo(minStep) < 0) {
            throw new RuntimeException(String.format("Минимальный шаг ставки: %s BYN.", minStep));
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

    // === 5. Удаление ===
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

    // === 6. Публикация (из Профиля пользователя) ===
    @Transactional
    public void publishAuction(Long auctionId, Long requestingUserId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Лот не найден"));
        if (!auction.getSeller().getId().equals(requestingUserId)) {
            throw new RuntimeException("Вы не можете публиковать чужой лот");
        }

        auction.setStatus("PENDING");
        auction.setModerationStatus("PENDING");

        auction.setUpdatedAt(LocalDateTime.now());
        auctionRepository.save(auction);
    }

    // === 7. ЗАВЕРШЕНИЕ АУКЦИОНА ===
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

        // === СОЗДАНИЕ УВЕДОМЛЕНИЙ ===
        if (topBid != null) {
            User winner = topBid.getUser();
            User seller = auction.getSeller();
            String carName = auction.getBrand().getName() + " " + auction.getModel().getName();
            String price = auction.getCurrentPrice().toString();

            // === ИСПРАВЛЕНО: Безопасная логика контактов ===

            // 1. Контакты продавца (для победителя)
            String sellerContact = (seller.getPhone() != null && !seller.getPhone().isEmpty())
                    ? "Тел: " + seller.getPhone()
                    : "Email: " + seller.getEmail();

            // 2. Контакты победителя (для продавца)
            String winnerContact = (winner.getPhone() != null && !winner.getPhone().isEmpty())
                    ? "Тел: " + winner.getPhone()
                    : "Email: " + winner.getEmail();

            // 1. Уведомление ПОБЕДИТЕЛЮ
            String winnerMsg = String.format(
                    "Вы выиграли лот %s (%s г.) за %s BYN. Свяжитесь с продавцом: %s",
                    carName, auction.getYear(), price, sellerContact
            );

            Notification notifWinner = new Notification();
            notifWinner.setUser(winner);
            notifWinner.setType("WIN");
            notifWinner.setMessage(winnerMsg);
            notifWinner.setAuctionId(auction.getId());
            notifWinner.setIsRead(false);
            notifWinner.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(notifWinner);

            // 2. Уведомление ПРОДАВЦУ
            String sellerMsg = String.format(
                    "Ваш лот %s (%s г.) продан за %s BYN. Свяжитесь с победителем: %s",
                    carName, auction.getYear(), price, winnerContact
            );

            Notification notifSeller = new Notification();
            notifSeller.setUser(seller);
            notifSeller.setType("SALE");
            notifSeller.setMessage(sellerMsg);
            notifSeller.setAuctionId(auction.getId());
            notifSeller.setIsRead(false);
            notifSeller.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(notifSeller);

            log.info("Аукцион {} завершен. Победитель: {}", auctionId, winner.getEmail());
        } else {
            log.info("Аукцион {} завершен без ставок.", auctionId);
        }
    }
}