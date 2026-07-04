package com.tradex.api.security;

import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;

@Component
public class TokenBlacklistCache {

    private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();

    public void blacklistToken(String token, long expiryTimeSeconds) {
        if (token != null) {
            blacklist.put(token, expiryTimeSeconds * 1000);
        }
    }

    public boolean isBlacklisted(String token) {
        if (token == null) {
            return false;
        }
        Long expiry = blacklist.get(token);
        if (expiry == null) {
            return false;
        }
        if (Instant.now().toEpochMilli() > expiry) {
            blacklist.remove(token);
            return false;
        }
        return true;
    }

    @Scheduled(fixedRate = 3600000) // hourly sweep
    public void cleanExpiredTokens() {
        long now = Instant.now().toEpochMilli();
        blacklist.entrySet().removeIf(entry -> now > entry.getValue());
    }
}

