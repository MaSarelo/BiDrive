package com.bidrive.backend.scheduler;

import com.bidrive.backend.entity.Auction;
import com.bidrive.backend.entity.Bid;
import com.bidrive.backend.entity.Notification;
import com.bidrive.backend.entity.User;
import com.bidrive.backend.repository.AuctionRepository;
import com.bidrive.backend.repository.BidRepository;
import com.bidrive.backend.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class AuctionScheduler {

    private static final Logger log = LoggerFactory.getLogger(AuctionScheduler.class);

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private BidRepository bidRepository;

    // fixedDelay вместо fixedRate — следующий запуск через 10 сек ПОСЛЕ завершения предыдущего
    @Scheduled(fixedDelay = 10000)
    @Transactional
    public void checkAuctions() {
        List<Auction> expiredAuctions = auctionRepository.findByStatusAndEndTimeBefore("ACTIVE", LocalDateTime.now());

        for (Auction auction : expiredAuctions) {
            // ПОВТОРНАЯ ПРОВЕРКА: статус мог измениться пока мы итерировали список
            Auction fresh = auctionRepository.findById(auction.getId()).orElse(null);
            if (fresh == null || !"ACTIVE".equals(fresh.getStatus())) {
                log.debug("Аукцион {} уже не ACTIVE, пропускаем", auction.getId());
                continue;
            }
            finishAuction(fresh);
        }
    }

    private void finishAuction(Auction auction) {
        log.info(">>> Завершение аукциона ID: {}", auction.getId());

        // СРАЗУ меняем статус, чтобы параллельный запуск планировщика не обработал этот же аукцион
        auction.setStatus("COMPLETED");
        auction.setUpdatedAt(LocalDateTime.now());

        Bid lastBid = bidRepository.findTopByAuctionIdOrderByAmountDesc(auction.getId()).orElse(null);

        if (lastBid != null) {
            User winner = lastBid.getUser();
            User seller = auction.getSeller();

            auction.setWinner(winner);
            auction.setCurrentPrice(lastBid.getAmount());

            // === СНАЧАЛА сохраняем аукцион с новым статусом ===
            auctionRepository.save(auction);

            // === Уведомление ПОБЕДИТЕЛЮ (контакт = продавец) ===
            Notification notifWinner = new Notification();
            notifWinner.setUser(winner);
            notifWinner.setAuctionId(auction.getId());
            notifWinner.setMessage("TEMPLATE:AUCTION_WON:" + auction.getId() + ":" + seller.getId());
            notifWinner.setCreatedAt(LocalDateTime.now());
            notifWinner.setType("AUCTION_WON");
            notifWinner.setIsRead(false);
            notificationRepository.save(notifWinner);

            // === Уведомление ПРОДАВЦУ (контакт = победитель) ===
            Notification notifSeller = new Notification();
            notifSeller.setUser(seller);
            notifSeller.setAuctionId(auction.getId());
            notifSeller.setMessage("TEMPLATE:AUCTION_SOLD:" + auction.getId() + ":" + winner.getId());
            notifSeller.setCreatedAt(LocalDateTime.now());
            notifSeller.setType("AUCTION_SOLD");
            notifSeller.setIsRead(false);
            notificationRepository.save(notifSeller);

            log.info(">>> Победитель: {}", winner.getEmail());
        } else {
            // СНАЧАЛА сохраняем аукцион
            auctionRepository.save(auction);

            // Потом уведомление
            Notification notifSeller = new Notification();
            notifSeller.setUser(auction.getSeller());
            notifSeller.setAuctionId(auction.getId());
            notifSeller.setMessage("Время аукциона истекло, но ставок не было: "
                    + auction.getBrand().getName() + " " + auction.getModel().getName());
            notifSeller.setCreatedAt(LocalDateTime.now());
            notifSeller.setType("AUCTION_UNSOLD");
            notifSeller.setIsRead(false);
            notificationRepository.save(notifSeller);
        }
    }
}