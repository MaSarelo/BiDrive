package com.bidrive.backend.controller;

import com.bidrive.backend.entity.Transmission;
import com.bidrive.backend.repository.TransmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transmissions")
public class TransmissionController {

    @Autowired
    private TransmissionRepository transmissionRepository;

    @GetMapping
    public List<Transmission> getAll() {
        return transmissionRepository.findAll();
    }
}