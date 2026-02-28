package com.bidrive.backend.controller;

import com.bidrive.backend.dto.DashboardStats;
import com.bidrive.backend.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @GetMapping("/stats")
    public DashboardStats getStats() {
        return statsService.getDashboardStats();
    }
}