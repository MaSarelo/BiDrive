package com.bidrive.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // ДОБАВЛЕНО: Для отладки. Если при старте не видишь эту надпись - конфиг не подгрузился!
        System.out.println("=== SECURITY CONFIG WORKING ===");

        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Разрешаем всем (публичные данные):
                        .requestMatchers("/api/auth/**").permitAll()   // Регистрация и Вход
                        .requestMatchers("/api/brands").permitAll()      // Бренды
                        .requestMatchers("/3/api/models/**").permitAll()    // Модели (убрал лишний слэш, если путь такой)
                        .requestMatchers("/api/auctions/**").permitAll()  // Лоты
                        .requestMatchers("/api/regions/**").permitAll()   // Области
                        .requestMatchers("/api/cities/**").permitAll()       // Города
                        .requestMatchers("/uploads/**").permitAll()       // Фотографии
                        .requestMatchers("/api/bids/**").permitAll()       // Ставки

                        // Всё остальное требует авторизации
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}