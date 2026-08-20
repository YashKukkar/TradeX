package com.tradex.api.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();

        // (15 Seconds TTL) Transaction Stats
        cacheManager.registerCustomCache("transactionStats",
                Caffeine.newBuilder()
                        .expireAfterWrite(15, TimeUnit.SECONDS)
                        .maximumSize(500)
                        .build());

        // (30 Seconds TTL) Support Ticket
        cacheManager.registerCustomCache("ticketStats",
                Caffeine.newBuilder()
                        .expireAfterWrite(30, TimeUnit.SECONDS)
                        .maximumSize(500)
                        .build());

        // (60 Seconds / 1 Min TTL) Employee Performance
        cacheManager.registerCustomCache("employeePerformance",
                Caffeine.newBuilder()
                        .expireAfterWrite(60, TimeUnit.SECONDS)
                        .maximumSize(500)
                        .build());

        // (300 Seconds / 5 Mins TTL) User Profile
        cacheManager.registerCustomCache("userStats",
                Caffeine.newBuilder()
                        .expireAfterWrite(300, TimeUnit.SECONDS)
                        .maximumSize(500)
                        .build());

        // (30 Seconds TTL) Aggregated Dashboard Metrics
        cacheManager.registerCustomCache("dashboardMetrics",
                Caffeine.newBuilder()
                        .expireAfterWrite(30, TimeUnit.SECONDS)
                        .maximumSize(500)
                        .build());

        // (30 Seconds TTL) System Health Ping
        cacheManager.registerCustomCache("systemHealth",
                Caffeine.newBuilder()
                        .expireAfterWrite(30, TimeUnit.SECONDS)
                        .maximumSize(50)
                        .build());

        return cacheManager;
    }
}
