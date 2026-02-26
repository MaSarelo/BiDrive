package com.bidrive.backend.controller;

import com.bidrive.backend.entity.Region;
import com.bidrive.backend.repository.RegionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/regions")
@CrossOrigin(origins = "http://localhost:5173")
public class RegionController {
    @Autowired
    private RegionRepository regionRepository;

    @GetMapping
    public List<Region> getAll() {
        return regionRepository.findAllByOrderByNameAsc();
    }
}