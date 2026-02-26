package com.bidrive.backend.repository;

import com.bidrive.backend.entity.FuelType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FuelTypeRepository extends JpaRepository<FuelType, Integer> {
    List<FuelType> findAllByOrderByNameAsc();
}