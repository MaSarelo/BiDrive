package com.bidrive.backend.repository;

import com.bidrive.backend.entity.Auction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {

    List<Auction> findByStatus(String status);
    List<Auction> findBySellerId(Long sellerId);
    List<Auction> findByBrandIdAndStatus(Long brandId, String status);
    List<Auction> findByModerationStatus(String moderationStatus);

    // === ОБНОВЛЕННЫЙ ЗАПРОС ===
    // Используем LEFT JOIN, чтобы не терять лоты, где город/топливо могут быть NULL
    @Query("SELECT DISTINCT a FROM Auction a " +
            "LEFT JOIN a.city c " + // Присоединяем город (если есть)
            "WHERE a.status = 'ACTIVE' AND " +
            "(:brandId IS NULL OR a.brand.id = :brandId) AND " +
            "(:modelId IS NULL OR a.model.id = :modelId) AND " +
            "(:fuelTypeId IS NULL OR a.fuelType.id = :fuelTypeId) AND " +
            "(:transmissionId IS NULL OR a.transmission.id = :transmissionId) AND " +
            "(:regionId IS NULL OR (c IS NOT NULL AND c.region.id = :regionId)) AND " + // Проверка на NULL
            "(:cityId IS NULL OR a.city.id = :cityId) AND " +
            "(:yearFrom IS NULL OR a.year >= :yearFrom) AND " +
            "(:yearTo IS NULL OR a.year <= :yearTo) AND " +
            "(:priceFrom IS NULL OR a.currentPrice >= :priceFrom) AND " +
            "(:priceTo IS NULL OR a.currentPrice <= :priceTo) AND " +
            "(:mileageFrom IS NULL OR a.mileage >= :mileageFrom) AND " +
            "(:mileageTo IS NULL OR a.mileage <= :mileageTo)")
    List<Auction> searchAuctions(
            @Param("brandId") Long brandId,
            @Param("modelId") Long modelId,
            @Param("fuelTypeId") Integer fuelTypeId,
            @Param("transmissionId") Integer transmissionId,
            @Param("regionId") Integer regionId,
            @Param("cityId") Integer cityId,
            @Param("yearFrom") Integer yearFrom,
            @Param("yearTo") Integer yearTo,
            @Param("priceFrom") Double priceFrom,
            @Param("priceTo") Double priceTo,
            @Param("mileageFrom") Integer mileageFrom,
            @Param("mileageTo") Integer mileageTo
    );
}