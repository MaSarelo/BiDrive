package com.bidrive.backend.repository;

import com.bidrive.backend.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import  java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {

    // Находит последнюю ставку для аукциона
    Optional<Bid> findTopByAuctionIdOrderByAmountDesc(Long auctionId);

    // === НОВЫЙ МЕТОД: Все ставки для аукциона ===
    List<Bid> findByAuctionIdOrderByAmountDesc(Long auctionId);

    // Найти ставки пользователя по аукциону
    List<Bid> findByAuctionIdAndUserId(Long auctionId, Long userId);

    boolean existsByAuctionId(Long auctionId);
}