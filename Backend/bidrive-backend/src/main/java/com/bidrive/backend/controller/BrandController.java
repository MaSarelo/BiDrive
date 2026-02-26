package com.bidrive.backend.controller;

import com.bidrive.backend.entity.Brand;
import com.bidrive.backend.repository.BrandRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/brands")
public class BrandController {

    @Autowired
    private BrandRepository brandRepository;

    // Этот метод вернет список брендов (Toyota, BMW и т.д.)
    @GetMapping
    public List<Brand> getAllBrands() {
        return brandRepository.findAllByOrderByNameAsc();
    }
}