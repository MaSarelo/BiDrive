package com.bidrive.backend.repository;
import com.bidrive.backend.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CityRepository extends JpaRepository<City, Long> {
    // Метод: найти все города, которые принадлежат конкретной области
    List<City> findByRegionId(Long regionId);
}