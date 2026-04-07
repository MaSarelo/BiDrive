package com.bidrive.backend.controller;

import com.bidrive.backend.service.CurrencyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/currency")
public class CurrencyController {

    @Autowired
    private CurrencyService currencyService;

    @GetMapping("/rate")
    public Map<String, Double> getUsdRate() {
        return Collections.singletonMap("rate", currencyService.getUsdRate());
    }
}