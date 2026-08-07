package com.tradex.api.aspect;

import com.tradex.api.annotation.EvictDashboardCache;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
@Slf4j

public class DashboardCacheAspect {

    private final CacheManager cacheManager;

    public DashboardCacheAspect(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    private void clearCache(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
            log.info("Cleared Spring Cache: {}", cacheName);
        }
    }

    @AfterReturning(value = "@annotation(evictAnnotation)", argNames = "evictAnnotation")
    public void evictCache(EvictDashboardCache evictAnnotation) {
        String[] domains = evictAnnotation.value();
        if (domains == null || domains.length == 0) {
            log.info("Evicting all admin dashboard metrics cache domains due to data mutation");
            clearCache("userStats");
            clearCache("transactionStats");
            clearCache("ticketStats");
            clearCache("employeePerformance");
        } else {
            log.info("Evicting specific admin dashboard metrics cache domains: {}", Arrays.toString(domains));
            for (String domain : domains) {
                switch (domain.toLowerCase()) {
                    case "users" -> clearCache("userStats");
                    case "transactions" -> {
                        clearCache("transactionStats");
                        clearCache("employeePerformance");
                    }
                    case "tickets" -> {
                        clearCache("ticketStats");
                        clearCache("employeePerformance");
                    }
                    default -> log.warn("Unknown cache domain specified in @EvictDashboardCache: {}", domain);
                }
            }
        }
    }
}
