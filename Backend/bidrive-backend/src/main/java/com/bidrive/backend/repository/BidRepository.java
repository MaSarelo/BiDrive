package com.bidrive.backend.repository;

import com.bidrive.backend.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {

    // Находит последнюю ставку для аукциона
    Optional<Bid> findTopByAuctionIdOrderByAmountDesc(Long auctionId);
}