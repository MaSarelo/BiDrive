package com.bidrive.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BidriveBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BidriveBackendApplication.class, args);
    }

}
