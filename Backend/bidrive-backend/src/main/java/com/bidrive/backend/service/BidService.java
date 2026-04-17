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
                    "Минимальный шаг ставки: %s BYN. Минимальная ставка: %s BYN.",
                    minStep, currentPrice.add(minStep)
            ));
        }

        // Уведомление тому, кого перебили
        Optional<Bid> currentTopBid = bidRepository.findTopByAuctionIdOrderByAmountDesc(auctionId);

        if (currentTopBid.isPresent()) {
            User previousLeader = currentTopBid.get().getUser();
            // Не шлем уведомление самому себе (если юзер перебивает свою же ставку, чего быть не должно, но проверка не мешает)
            if (!previousLeader.getId().equals(userId)) {
                Notification notification = new Notification();
                notification.setUser(previousLeader);
                notification.setType("BID_OUTBID");
                notification.setMessage("Вашу ставку на аукцион №" + auctionId + " перебили!");

                // === ИСПРАВЛЕНО: используем setAuctionId ===
                notification.setAuctionId(auctionId);
                // =======================================

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