package com.bidrive.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        System.out.println("=== SECURITY CONFIG WORKING ===");

        http
                .cors(Customizer.withDefaults()) // <=== ВАЖНО: Включаем CORS настройки
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Разрешаем всем:
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/brands").permitAll()
                        .requestMatchers("/api/models/**").permitAll()
                        .requestMatchers("/api/auctions/**").permitAll()
                        .requestMatchers("/api/regions/**").permitAll()
                        .requestMatchers("/api/cities/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/api/bids/**").permitAll()
                        .requestMatchers("/api/fuel-types/**").permitAll()
                        .requestMatchers("/api/transmissions/**").permitAll()
                        .requestMatchers("/api/users/**").permitAll() // Для админки
                        .requestMatchers("/api/files/**").permitAll() // Разрешаем загрузку файлов
                        .requestMatchers("/api/admin/**").permitAll()
                        .requestMatchers("/api/notifications/**").permitAll()
                        .requestMatchers("/api/currency/rate").permitAll()

                        .anyRequest().authenticated()
                );

        return http.build();
    }
}