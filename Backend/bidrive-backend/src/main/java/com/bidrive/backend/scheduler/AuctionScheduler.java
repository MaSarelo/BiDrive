package com.bidrive.backend.scheduler;

import com.bidrive.backend.entity.Auction;
import com.bidrive.backend.entity.Notification;
import com.bidrive.backend.entity.User;
import com.bidrive.backend.repository.AuctionRepository;
import com.bidrive.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional; // Импорт

import java.time.LocalDateTime;
import java.util.List;

@Component
public class AuctionScheduler {

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // === ДОБАВЬ @Transactional ===
    @Scheduled(fixedRate = 10000)
    @Transactional // <--- Чтобы работал auction.getBids() без ошибок LazyInit
    public void checkAuctions() {
        List<Auction> activeAuctions = auctionRepository.findByStatus("ACTIVE");
        LocalDateTime now = LocalDateTime.now();

        for (Auction auction : activeAuctions) {
            if (auction.getEndTime() != null && auction.getEndTime().isBefore(now)) {
                finishAuction(auction);
            }
        }
    }

    private void finishAuction(Auction auction) {
        if (auction.getBids() != null && !auction.getBids().isEmpty()) {
            auction.getBids().sort((b1, b2) -> b2.getAmount().compareTo(b1.getAmount()));
            User winner = auction.getBids().get(0).getUser();
            auction.setWinner(winner);

            Notification notif = new Notification();
            notif.setUser(winner);
            notif.setMessage("🎉 Поздравляем! Вы выиграли аукцион: " + auction.getBrand().getName() + " " + auction.getModel().getName());
            notif.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(notif);
        }

        auction.setStatus("FINISHED");
        auctionRepository.save(auction);
        System.out.println(">>> Аукцион ID " + auction.getId() + " автоматически завершен.");
    }
}