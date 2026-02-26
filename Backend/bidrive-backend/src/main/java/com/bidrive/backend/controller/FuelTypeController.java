package com.bidrive.backend.controller;

import com.bidrive.backend.entity.FuelType;
import com.bidrive.backend.repository.FuelTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fuel-types")
public class FuelTypeController {

    @Autowired
    private FuelTypeRepository fuelTypeRepository;

    @GetMapping
    public List<FuelType> getAll() {
        return fuelTypeRepository.findAllByOrderByNameAsc();
    }
}