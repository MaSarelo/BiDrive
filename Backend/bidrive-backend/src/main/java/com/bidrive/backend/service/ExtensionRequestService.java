package com.bidrive.backend.service;

import com.bidrive.backend.entity.*;
import com.bidrive.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExtensionRequestService {

    private final ExtensionRequestRepository extensionRequestRepository;
    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final NotificationRepository notificationRepository;

    @Transactional
    public ExtensionRequest createRequest(Long auctionId, Long userId, String reason) {
        if (extensionRequestRepository.existsByAuctionIdAndStatus(auctionId, ExtensionRequest.RequestStatus.APPROVED)) {
            throw new RuntimeException("Этот лот уже был продлён один раз. Повторное продление невозможно.");
        }
        if (extensionRequestRepository.existsByAuctionIdAndStatus(auctionId, ExtensionRequest.RequestStatus.PENDING)) {
            throw new RuntimeException("Уже существует активный запрос на продление для этого лота");
        }

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Аукцион не найден"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (!auction.getSeller().getId().equals(user.getId())) {
            throw new RuntimeException("Только продавец лота может запросить продление");
        }

        // Проверяем, что аукцион активен
        if (!"ACTIVE".equals(auction.getStatus())) {
            throw new RuntimeException("Продление возможно только для активных аукционов");
        }

        ExtensionRequest request = new ExtensionRequest();
        request.setAuction(auction);
        request.setUser(user);
        request.setStatus(ExtensionRequest.RequestStatus.PENDING);
        request.setReason(reason);
        return extensionRequestRepository.save(request);
    }

    @Transactional
    public void approveRequest(Long requestId) {
        ExtensionRequest request = extensionRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Запрос не найден"));

        if (request.getStatus() != ExtensionRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Запрос уже обработан");
        }

        Auction auction = request.getAuction();

        // === НОВОЕ: Проверяем статус аукциона ===
        if (!"ACTIVE".equals(auction.getStatus())) {
            // Аукцион уже не активен — отклоняем запрос
            request.setStatus(ExtensionRequest.RequestStatus.REJECTED);
            request.setDecidedAt(LocalDateTime.now());
            extensionRequestRepository.save(request);

            // Уведомляем продавца
            Notification sellerNotif = new Notification();
            sellerNotif.setUser(auction.getSeller());
            sellerNotif.setType("AUCTION_EXTENSION_REJECTED");
            sellerNotif.setAuctionId(auction.getId());
            sellerNotif.setMessage("[REJECT:" + auction.getId() + "] Запрос на продление лота \""
                    + auction.getBrand().getName() + " " + auction.getModel().getName()
                    + "\" отклонён: аукцион уже завершён.");
            sellerNotif.setIsRead(false);
            sellerNotif.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(sellerNotif);

            throw new RuntimeException("Аукцион уже завершён, продление невозможно");
        }
        // ========================================

        // Проверка: лот уже продлевался?
        boolean alreadyExtended = extensionRequestRepository.existsByAuctionIdAndStatus(
                auction.getId(),
                ExtensionRequest.RequestStatus.APPROVED
        );
        if (alreadyExtended) {
            throw new RuntimeException("Этот лот уже был продлён. Одобрение невозможно.");
        }

        User seller = auction.getSeller();
        String carName = auction.getBrand().getName() + " " + auction.getModel().getName();

        // === НОВОЕ: Если endTime уже прошёл, но лот ещё ACTIVE (окно 0-10 сек до планировщика) ===
        // Сначала продлеваем, чтобы планировщик не завершил лот в следующем цикле
        LocalDateTime newEndTime;
        if (auction.getEndTime().isBefore(LocalDateTime.now())) {
            // Время уже прошло — отсчитываем 24 часа от текущего момента
            newEndTime = LocalDateTime.now().plusDays(1);
        } else {
            // Время ещё не прошло — добавляем 24 часа к текущему endTime
            newEndTime = auction.getEndTime().plusDays(1);
        }
        auction.setEndTime(newEndTime);
        auctionRepository.save(auction);
        // ============================================================================

        // === УВЕДОМЛЕНИЕ ПРОДАВЦУ ===
        Notification sellerNotif = new Notification();
        sellerNotif.setUser(seller);
        sellerNotif.setType("AUCTION_EXTENDED");
        sellerNotif.setAuctionId(auction.getId());
        sellerNotif.setMessage("[EXTEND:" + auction.getId() + "] ✅ Ваш лот \"" + carName + "\" продлён на 24 часа.");
        sellerNotif.setIsRead(false);
        sellerNotif.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(sellerNotif);

        // === УВЕДОМЛЕНИЯ ВСЕМ, КТО ДЕЛАЛ СТАВКИ ===
        List<Bid> bids = bidRepository.findByAuctionIdOrderByAmountDesc(auction.getId());
        if (bids != null && !bids.isEmpty()) {
            for (Bid bid : bids) {
                User bidder = bid.getUser();
                if (bidder != null && !bidder.getId().equals(seller.getId())) {
                    Notification bidderNotif = new Notification();
                    bidderNotif.setUser(bidder);
                    bidderNotif.setType("AUCTION_EXTENDED");
                    bidderNotif.setAuctionId(auction.getId());
                    bidderNotif.setMessage("[EXTEND:" + auction.getId() + "] ⏰ Аукцион \"" + carName + "\" продлён на 24 часа. У вас есть дополнительное время для ставок!");
                    bidderNotif.setIsRead(false);
                    bidderNotif.setCreatedAt(LocalDateTime.now());
                    notificationRepository.save(bidderNotif);
                }
            }
        }

        // === Обновляем статус запроса ===
        request.setStatus(ExtensionRequest.RequestStatus.APPROVED);
        request.setDecidedAt(LocalDateTime.now());
        extensionRequestRepository.save(request);
    }

    @Transactional
    public void rejectRequest(Long requestId) {
        ExtensionRequest request = extensionRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Запрос не найден"));

        if (request.getStatus() != ExtensionRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Запрос уже обработан");
        }

        Auction auction = request.getAuction();
        User seller = auction.getSeller();
        String carName = auction.getBrand().getName() + " " + auction.getModel().getName();
        String reason = request.getReason() != null ? "Причина: " + request.getReason() : "";

        // === УВЕДОМЛЕНИЕ ПРОДАВЦУ (только ему!) ===
        Notification sellerNotif = new Notification();
        sellerNotif.setUser(seller);
        sellerNotif.setType("AUCTION_EXTENSION_REJECTED");
        sellerNotif.setAuctionId(auction.getId());
        sellerNotif.setMessage("[REJECT:" + auction.getId() + "] Запрос на продление лота \"" + carName + "\" отклонён. " + reason);
        sellerNotif.setIsRead(false);
        sellerNotif.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(sellerNotif);

        // === Обновляем статус запроса ===
        request.setStatus(ExtensionRequest.RequestStatus.REJECTED);
        request.setDecidedAt(LocalDateTime.now());
        extensionRequestRepository.save(request);
    }
}