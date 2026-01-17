package com.bidrive.backend.repository;

import com.bidrive.backend.entity.Auction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {

    // Метод для поиска аукционов по ID бренда
    // Spring сам поймет, что нужно SELECT * FROM auctions WHERE brand_id = ?
    List<Auction> findByBrandId(Long brandId);

    // Дополнительно: поиск только активных аукционов конкретного бренда
    List<Auction> findByBrandIdAndStatus(Long brandId, String status);
}