package com.bidrive.backend.controller;

import com.bidrive.backend.entity.City;
import com.bidrive.backend.repository.CityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cities")
@CrossOrigin(origins = "http://localhost:5173")
public class CityController {
    @Autowired
    private CityRepository cityRepository;

    @GetMapping
    public List<City> getAll() {
        return cityRepository.findAllByOrderByNameAsc();
    }

    // Важно: endpoint для получения городов по ID области
    @GetMapping("/by-region")
    public List<City> getCitiesByRegion(@RequestParam Long regionId) {
        return cityRepository.findByRegionIdOrderByNameAsc(regionId);
    }
}