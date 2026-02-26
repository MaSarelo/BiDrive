package com.bidrive.backend.repository;

import com.bidrive.backend.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegionRepository extends JpaRepository<Region, Integer> { // Integer
    List<Region> findAllByOrderByNameAsc();
}