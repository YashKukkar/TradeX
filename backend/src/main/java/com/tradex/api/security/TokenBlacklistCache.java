package com.tradex.api.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Component
public class TokenBlacklistCache {

    private final Cache<String, Long> blacklist = Caffeine.newBuilder()
            .expireAfterWrite(24, TimeUnit.HOURS)
            .build();

    public void blacklistToken(String token, long expiryTimeSeconds) {
        if (token != null) {
            blacklist.put(token, expiryTimeSeconds * 1000);
        }
    }

    public boolean isBlacklisted(String token) {
        if (token == null) {
            return false;
        }
        Long expiry = blacklist.getIfPresent(token);
        if (expiry == null) {
            return false;
        }
        if (Instant.now().toEpochMilli() > expiry) {
            blacklist.invalidate(token);
            return false;
        }
        return true;
    }

    public void cleanExpiredTokens() {
        blacklist.cleanUp();
    }
}
