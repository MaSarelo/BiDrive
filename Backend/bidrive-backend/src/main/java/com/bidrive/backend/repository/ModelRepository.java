package com.bidrive.backend.repository;

import com.bidrive.backend.entity.Model;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModelRepository extends JpaRepository<Model, Long> {
    List<Model> findAllByOrderByNameAsc();
    List<Model> findByBrandIdOrderByNameAsc(Long brandId);
}