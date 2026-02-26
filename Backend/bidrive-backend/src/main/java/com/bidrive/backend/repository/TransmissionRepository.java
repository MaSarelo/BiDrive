package com.bidrive.backend.repository;

import com.bidrive.backend.entity.Transmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransmissionRepository extends JpaRepository<Transmission, Integer> {
    List<Transmission> findAllByOrderByNameAsc();
}