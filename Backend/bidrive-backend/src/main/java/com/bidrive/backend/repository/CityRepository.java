package com.bidrive.backend.repository;

import com.bidrive.backend.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CityRepository extends JpaRepository<City, Integer> { // Integer

    List<City> findByRegionIdOrderByNameAsc(Long regionId);
    List<City> findAllByOrderByNameAsc();
}