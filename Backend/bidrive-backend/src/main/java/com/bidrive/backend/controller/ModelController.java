package com.bidrive.backend.controller;

import com.bidrive.backend.entity.Model;
import com.bidrive.backend.repository.ModelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Добавили CORS
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/models")
public class ModelController {

    @Autowired
    private ModelRepository modelRepository;

    @GetMapping
    public List<Model> getAllModels() {
        return modelRepository.findAllByOrderByNameAsc();
    }

    // === НОВЫЙ МЕТОД (обязателен для React) ===
    @GetMapping("/by-brand")
    public List<Model> getModelsByBrand(@RequestParam Long brandId) {
        return modelRepository.findByBrandIdOrderByNameAsc(brandId);
    }
}