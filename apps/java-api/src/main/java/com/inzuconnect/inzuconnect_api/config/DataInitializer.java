package com.inzuconnect.inzuconnect_api.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase() {
        return args -> {
            // Production ready: No hardcoded mock data seeded.
        };
    }
}
