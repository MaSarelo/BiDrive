package com.bidrive.backend.scheduler;

import com.bidrive.backend.entity.Auction;
import com.bidrive.backend.entity.Bid;
import com.bidrive.backend.entity.Notification;
import com.bidrive.backend.entity.User;
import com.bidrive.backend.repository.AuctionRepository;
import com.bidrive.backend.repository.BidRepository;
import com.bidrive.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class AuctionScheduler {

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private BidRepository bidRepository;

    @Scheduled(fixedRate = 10000)
    @Transactional
    public void checkAuctions() {
        List<Auction> expiredAuctions = auctionRepository.findByStatusAndEndTimeBefore("ACTIVE", LocalDateTime.now());

        for (Auction auction : expiredAuctions) {
            finishAuction(auction);
        }
    }

    @Scheduled(fixedRate = 10000)
    @Transactional
    public void startScheduledAuctions() {
        List<Auction> toStart = auctionRepository.findByStatusAndStartTimeBefore("APPROVED", LocalDateTime.now());

        for (Auction auction : toStart) {
            System.out.println(">>> Старт аукциона ID: " + auction.getId());
            auction.setStatus("ACTIVE");
            auctionRepository.save(auction);
        }
    }

    private void finishAuction(Auction auction) {
        System.out.println(">>> Завершение аукциона ID: " + auction.getId());

        Bid lastBid = bidRepository.findTopByAuctionIdOrderByAmountDesc(auction.getId()).orElse(null);

        if (lastBid != null) {
            User winner = lastBid.getUser();
            User seller = auction.getSeller();

            auction.setWinner(winner);
            auction.setCurrentPrice(lastBid.getAmount());

            // === ИСПРАВЛЕНО: Безопасная логика контактов ===

            // 1. Контакты продавца (для победителя)
            String sellerContact = (seller.getPhone() != null && !seller.getPhone().isEmpty())
                    ? "Тел: " + seller.getPhone()
                    : "Email: " + seller.getEmail();

            // 2. Контакты победителя (для продавца)
            String winnerContact = (winner.getPhone() != null && !winner.getPhone().isEmpty())
                    ? "Тел: " + winner.getPhone()
                    : "Email: " + winner.getEmail();

            // Уведомление ПОБЕДИТЕЛЮ
            Notification notifWinner = new Notification();
            notifWinner.setUser(winner);
            notifWinner.setMessage("🎉 Вы выиграли лот: " + auction.getBrand().getName() + " " + auction.getModel().getName() +
                    "! Свяжитесь с продавцом: " + seller.getFirstName() + " (" + sellerContact + ")");
            notifWinner.setCreatedAt(LocalDateTime.now());
            notifWinner.setType("AUCTION_WON");
            notificationRepository.save(notifWinner);

            // Уведомление ПРОДАВЦУ
            Notification notifSeller = new Notification();
            notifSeller.setUser(seller);
            notifSeller.setMessage("✅ Ваш лот продан: " + auction.getBrand().getName() + " " + auction.getModel().getName() +
                    ". Победитель: " + winner.getFirstName() + " (" + winnerContact + ")");
            notifSeller.setCreatedAt(LocalDateTime.now());
            notifSeller.setType("AUCTION_SOLD");
            notificationRepository.save(notifSeller);

            System.out.println(">>> Победитель: " + winner.getEmail());
        } else {
            System.out.println(">>> Ставок не было. Лот закрыт без продажи.");

            Notification notifSeller = new Notification();
            notifSeller.setUser(auction.getSeller());
            notifSeller.setMessage("⚠️ Время аукциона истекло, но ставок не было: " + auction.getBrand().getName());
            notifSeller.setCreatedAt(LocalDateTime.now());
            notifSeller.setType("AUCTION_UNSOLD");
            notificationRepository.save(notifSeller);
        }

        auction.setStatus("COMPLETED");
        auctionRepository.save(auction);
    }
}