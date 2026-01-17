package com.bidrive.backend.service;

import com.bidrive.backend.entity.Auction;
import com.bidrive.backend.entity.Bid;
import com.bidrive.backend.entity.Notification;
import com.bidrive.backend.entity.User;
import com.bidrive.backend.repository.AuctionRepository;
import com.bidrive.backend.repository.BidRepository;
import com.bidrive.backend.repository.NotificationRepository;
import com.bidrive.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class BidService {

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public Bid placeBid(Long auctionId, Long userId, BigDecimal amount) {
        // 1. Находим аукцион и пользователя
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Аукцион не найден"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // 2. Проверки (Валидация)
        if (!"ACTIVE".equals(auction.getStatus())) {
            throw new RuntimeException("Ставки возможны только на активные аукционы!");
        }

        if (amount.compareTo(auction.getCurrentPrice()) <= 0) {
            throw new RuntimeException("Ставка должна быть выше текущей цены!");
        }

        // --- НОВАЯ ЛОГИКА: Уведомления ---

        // Находим текущую максимальную ставку (перед сохранением новой)
        Optional<Bid> currentTopBid = bidRepository.findTopByAuctionIdOrderByAmountDesc(auctionId);

        // Если ставка была, и делал её другой человек
        if (currentTopBid.isPresent()) {
            User previousLeader = currentTopBid.get().getUser();
            if (!previousLeader.getId().equals(userId)) {
                // Создаем уведомление о том, что ставку перебили
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

        // --- КОНЕЦ НОВОЙ ЛОГИКИ ---

        // 3. Создаем и сохраняем новую ставку
        Bid bid = new Bid();
        bid.setAuction(auction);
        bid.setUser(user);
        bid.setAmount(amount);
        bid.setCreatedAt(LocalDateTime.now());

        Bid savedBid = bidRepository.save(bid);

        // 4. Обновляем текущую цену в аукционе
        auction.setCurrentPrice(amount);
        auctionRepository.save(auction);

        return savedBid;
    }
}