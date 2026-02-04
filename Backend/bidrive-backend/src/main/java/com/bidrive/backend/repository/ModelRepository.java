package com.bidrive.backend.repository;

import com.bidrive.backend.entity.Model;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ModelRepository extends JpaRepository<Model, Long> {

    // Метод для поиска моделей по ID бренда
    List<Model> findByBrandId(Long brandId);
}