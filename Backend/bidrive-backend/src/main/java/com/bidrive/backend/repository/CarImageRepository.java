package com.bidrive.backend.repository;

import com.bidrive.backend.entity.CarImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarImageRepository extends JpaRepository<CarImage, Long> {
}