package com.bidrive.backend.service;

import com.bidrive.backend.dto.BidHistoryDTO;
import com.bidrive.backend.dto.AuctionUpdateRequest;
import com.bidrive.backend.entity.CarImage;
import com.bidrive.backend.repository.CarImageRepository;
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
import java.util.Optional;

@Service
public class AuctionService {

    private static final Logger log = LoggerFactory.getLogger(AuctionService.class);

    @Autowired private TelegramService telegramService;
    @Autowired private AuctionRepository auctionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BrandRepository brandRepository;
    @Autowired private ModelRepository modelRepository;
    @Autowired private TransmissionRepository transmissionRepository;
    @Autowired private FuelTypeRepository fuelTypeRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private BidRepository bidRepository;
    @Autowired private CityRepository cityRepository;
    @Autowired private CarImageRepository carImageRepository;
    @Autowired private EntityManager entityManager;

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

    @Transactional
    public Auction createAuction(Long sellerId, Long brandId, Long modelId, Integer year, Integer mileage,
                                 Integer transmissionId, Integer fuelTypeId, String description,
                                 BigDecimal startingPrice, BigDecimal minBidStep, Integer cityId,
                                 List<String> imageUrls, LocalDateTime endTime, String vin) {
        User seller = userRepository.findById(sellerId).orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        Brand brand = brandRepository.findById(brandId).orElseThrow(() -> new RuntimeException("Бренд не найден"));
        Model model = modelRepository.findById(modelId).orElseThrow(() -> new RuntimeException("Модель не найдена"));
        Transmission transmission = transmissionRepository.findById(transmissionId).orElseThrow(() -> new RuntimeException("Тип КПП не найден"));
        FuelType fuelType = fuelTypeRepository.findById(fuelTypeId).orElseThrow(() -> new RuntimeException("Тип топлива не найден"));
        City city = cityRepository.findById(cityId).orElseThrow(() -> new RuntimeException("Город не найден"));

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
        if (vin != null && !vin.trim().isEmpty()) auction.setVin(vin.trim().toUpperCase());
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
            savedAuction.setMainImageUrl(imageUrls.getFirst());
            auctionRepository.save(savedAuction);
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

        // Проверка истёкшего времени
        if (auction.getEndTime() != null && auction.getEndTime().isBefore(LocalDateTime.now())) {
            auction.setModerationStatus("APPROVED");
            auction.setStatus("FINISHED");
            auction.setUpdatedAt(LocalDateTime.now());
            auctionRepository.save(auction);

            Notification notif = new Notification();
            notif.setUser(auction.getSeller());
            notif.setAuctionId(auction.getId());
            notif.setType("AUCTION_UNSOLD");
            notif.setMessage("️ Ваш лот \"" + auction.getBrand().getName() + " "
                    + auction.getModel().getName() + "\" одобрен, но время аукциона уже истекло. "
                    + "Лот завершён без ставок.");
            notif.setIsRead(false);
            notif.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(notif);

            log.warn("Аукцион {} одобрен, но время уже истекло. Завершён без ставок.", auctionId);
            return;
        }

        auction.setModerationStatus("APPROVED");
        auction.setStatus("ACTIVE");
        auction.setUpdatedAt(LocalDateTime.now());
        auctionRepository.save(auction);

        // УВЕДОМЛЕНИЕ ПРОДАВЦУ ОБ ОДОБРЕНИИ ===
        Notification approvalNotif = new Notification();
        approvalNotif.setUser(auction.getSeller());
        approvalNotif.setAuctionId(auction.getId());
        approvalNotif.setType("AUCTION_APPROVED");
        approvalNotif.setMessage("✅ Ваш лот \"" + auction.getBrand().getName() + " "
                + auction.getModel().getName() + "\" прошёл модерацию и появился в каталоге. "
                + "Удачи в торгах!");
        approvalNotif.setIsRead(false);
        approvalNotif.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(approvalNotif);


        try {
            telegramService.sendNewLotNotification(auction);
        } catch (Exception e) {
            log.error("Ошибка отправки в Telegram для аукциона {}", auctionId, e);
        }
    }

    @Transactional
    public Bid placeBid(Long auctionId, Long userId, BigDecimal amount) {
        Auction auction = auctionRepository.findById(auctionId).orElseThrow(() -> new RuntimeException("Аукцион не найден"));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        if (auction.getSeller().getId().equals(userId)) throw new RuntimeException("Нельзя делать ставки на свой лот.");
        if (!"ACTIVE".equals(auction.getStatus())) throw new RuntimeException("Ставки возможны только на активные аукционы!");

        BigDecimal currentPrice = auction.getCurrentPrice();
        BigDecimal minStep = auction.getMinBidStep();
        if (amount.compareTo(currentPrice) <= 0) throw new RuntimeException("Ставка должна быть выше текущей цены!");
        if (amount.subtract(currentPrice).compareTo(minStep) < 0) throw new RuntimeException(String.format("Минимальный шаг ставки: %s BYN.", minStep));

        Optional<Bid> previousTopBid = bidRepository.findTopByAuctionIdOrderByAmountDesc(auctionId);
        if (previousTopBid.isPresent()) {
            User previousLeader = previousTopBid.get().getUser();
            if (!previousLeader.getId().equals(userId)) {
                Notification notif = new Notification();
                notif.setUser(previousLeader);
                notif.setType("BID_OUTBID");
                notif.setAuctionId(auction.getId());
                notif.setMessage("⚠️ Вашу ставку перебили на лоте: " + auction.getBrand().getName() + " " + auction.getModel().getName());
                notif.setIsRead(false);
                notif.setCreatedAt(LocalDateTime.now());
                notificationRepository.save(notif);
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

    @Transactional
    public void deleteAuction(Long auctionId, Long requestingUserId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Лот не найден"));

        // 1. Проверка прав
        if (!auction.getSeller().getId().equals(requestingUserId)) {
            throw new RuntimeException("Вы не можете удалить чужой лот");
        }

        // 2. Логика удаления по статусам
        if ("PENDING".equals(auction.getStatus())) {
            // Если на модерации — удаляем смело
            auctionRepository.delete(auction);
            return;
        }

        if ("ACTIVE".equals(auction.getStatus())) {
            // Если в каталоге — проверяем наличие ставок
            boolean hasBids = bidRepository.existsByAuctionId(auctionId);

            if (hasBids) {
                // Если ставки есть — ЗАПРЕЩАЕМ удаление (защита покупателей)
                throw new RuntimeException("Нельзя удалить лот, на который уже есть ставки");
            }

            // Если ставок нет — РАЗРЕШАЕМ удаление (продавец передумал)
            auctionRepository.delete(auction);
            return;
        }

        // Для статусов FINISHED или REJECTED удаление тоже возможно
        auctionRepository.delete(auction);
    }

    @Transactional
    public void publishAuction(Long auctionId, Long requestingUserId) {
        Auction auction = auctionRepository.findById(auctionId).orElseThrow(() -> new RuntimeException("Лот не найден"));
        if (!auction.getSeller().getId().equals(requestingUserId)) throw new RuntimeException("Вы не можете публиковать чужой лот");
        auction.setStatus("PENDING");
        auction.setModerationStatus("PENDING");
        auction.setUpdatedAt(LocalDateTime.now());
        auctionRepository.save(auction);
    }

    @Transactional
    public void finishAuction(Long auctionId, Long requestingUserId) {
        Auction auction = auctionRepository.findById(auctionId).orElseThrow(() -> new RuntimeException("Аукцион не найден"));
        if (!auction.getSeller().getId().equals(requestingUserId)) throw new RuntimeException("Вы не можете завершить чужой аукцион");

        // Запрет досрочного завершения, если есть ставки
        boolean hasBids = bidRepository.existsByAuctionId(auctionId);
        if (hasBids) {
            throw new RuntimeException("На лот уже есть ставки. Досрочное завершение торгов невозможно. Дождитесь окончания времени аукциона.");
        }

        auction.setStatus("FINISHED");
        auction.setUpdatedAt(LocalDateTime.now());
        auctionRepository.save(auction);

        log.info("Аукцион {} завершен без ставок.", auctionId);
    }

    // ОБНОВЛЕНИЕ АУКЦИОНА (ДЛЯ РЕДАКТИРОВАНИЯ)
    @Transactional
    public void updateAuction(Long auctionId, Long requestingUserId, AuctionUpdateRequest request) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Лот не найден"));

        if (!auction.getSeller().getId().equals(requestingUserId)) {
            throw new RuntimeException("Вы не можете редактировать чужой лот");
        }
        if (!"PENDING".equals(auction.getStatus()) && !"ACTIVE".equals(auction.getStatus())) {
            throw new RuntimeException("Редактирование доступно только для лотов на модерации или активных");
        }
        if (bidRepository.existsByAuctionId(auctionId)) {
            throw new RuntimeException("Нельзя редактировать лот, на который уже есть ставки");
        }

        // Обновление текстовых полей
        if (request.getBrandId() != null) auction.setBrand(brandRepository.findById(request.getBrandId()).orElseThrow());
        if (request.getModelId() != null) auction.setModel(modelRepository.findById(request.getModelId()).orElseThrow());
        if (request.getYear() != null) auction.setYear(request.getYear());
        if (request.getMileage() != null) auction.setMileage(request.getMileage());
        if (request.getTransmissionId() != null) auction.setTransmission(transmissionRepository.findById(request.getTransmissionId()).orElseThrow());
        if (request.getFuelTypeId() != null) auction.setFuelType(fuelTypeRepository.findById(request.getFuelTypeId()).orElseThrow());
        if (request.getCityId() != null) auction.setCity(cityRepository.findById(request.getCityId()).orElseThrow());
        if (request.getDescription() != null) auction.setDescription(request.getDescription());
        if (request.getStartingPrice() != null) {
            auction.setStartingPrice(request.getStartingPrice());
            auction.setCurrentPrice(request.getStartingPrice());
        }
        if (request.getMinBidStep() != null) auction.setMinBidStep(request.getMinBidStep());
        if (request.getEndTime() != null) auction.setEndTime(request.getEndTime());
        if (request.getVin() != null && !request.getVin().trim().isEmpty()) {
            auction.setVin(request.getVin().trim().toUpperCase());
        }

        // === 🔥 ОБНОВЛЕНИЕ ФОТО (НАТИВНЫЙ ПОДХОД HIBERNATE) ===
        if (request.getImageUrls() != null) {
            // 1. Очищаем коллекцию в памяти.
            //    Благодаря orphanRemoval=true Hibernate САМ сделает DELETE
            //    из таблицы car_images для всех старых записей при save().
            auction.getImages().clear();

            // 2. Добавляем новые картинки в коллекцию.
            //    Hibernate при save() сделает INSERT.
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                CarImage img = new CarImage();
                img.setAuction(auction);
                img.setImageUrl(request.getImageUrls().get(i));
                img.setDisplayOrder(i + 1);
                img.setIsMain(i == 0);
                auction.getImages().add(img);  // ← add() вместо save()
            }

            // 3. Обновляем главное фото
            if (!request.getImageUrls().isEmpty()) {
                auction.setMainImageUrl(request.getImageUrls().getFirst());
            } else {
                auction.setMainImageUrl(null);
            }
        }

        auction.setUpdatedAt(LocalDateTime.now());
        auctionRepository.save(auction);
    }
}