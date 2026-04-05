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

    private void finishAuction(Auction auction) {
        System.out.println(">>> Завершение аукциона ID: " + auction.getId());

        Bid lastBid = bidRepository.findTopByAuctionIdOrderByAmountDesc(auction.getId()).orElse(null);

        if (lastBid != null) {
            User winner = lastBid.getUser();
            User seller = auction.getSeller();

            auction.setWinner(winner);
            auction.setCurrentPrice(lastBid.getAmount());

            // 3. УВЕДОМЛЯЕМ ПОБЕДИТЕЛЯ
            Notification notifWinner = new Notification();
            notifWinner.setUser(winner);
            notifWinner.setMessage("🎉 Вы выиграли лот: " + auction.getBrand().getName() + " " + auction.getModel().getName() +
                    "! Свяжитесь с продавцом: " + seller.getFirstName() + " (" + seller.getEmail() + ")");
            notifWinner.setCreatedAt(LocalDateTime.now());
            // ИСПРАВЛЕНО: используем AUCTION_WON
            notifWinner.setType("AUCTION_WON");

            notificationRepository.save(notifWinner);

            // 4. УВЕДОМЛЯЕМ ПРОДАВЦА
            Notification notifSeller = new Notification();
            notifSeller.setUser(seller);
            notifSeller.setMessage("✅ Ваш лот продан: " + auction.getBrand().getName() + " " + auction.getModel().getName() +
                    ". Победитель: " + winner.getFirstName() + " (" + winner.getEmail() + ")");
            notifSeller.setCreatedAt(LocalDateTime.now());
            // Это значение есть в базе
            notifSeller.setType("AUCTION_SOLD");

            notificationRepository.save(notifSeller);

            System.out.println(">>> Победитель: " + winner.getEmail());
        } else {
            System.out.println(">>> Ставок не было. Лот закрыт без продажи.");

            // Уведомляем продавца, что лот не продался
            Notification notifSeller = new Notification();
            notifSeller.setUser(auction.getSeller());
            notifSeller.setMessage("⚠️ Время аукциона истекло, но ставок не было: " + auction.getBrand().getName());
            notifSeller.setCreatedAt(LocalDateTime.now());
            // Используем новое значение, которое добавили в SQL выше
            notifSeller.setType("AUCTION_UNSOLD");

            notificationRepository.save(notifSeller);
        }

        auction.setStatus("COMPLETED");
        auctionRepository.save(auction);
    }
}