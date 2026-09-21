package com.tradex.api.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Expiry;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class TokenBlacklistCache {

    private final Cache<String, Long> blacklist = Caffeine.newBuilder()
            .expireAfter(new Expiry<String, Long>() {
                @Override
                public long expireAfterCreate(String key, Long expiryEpochMilli, long currentTime) {
                    if (expiryEpochMilli == null) {
                        return TimeUnit.HOURS.toNanos(24);
                    }
                    long remainingMs = expiryEpochMilli - System.currentTimeMillis();
                    return remainingMs > 0 ? TimeUnit.MILLISECONDS.toNanos(remainingMs) : 0L;
                }

                @Override
                public long expireAfterUpdate(String key, Long value, long currentTime, long currentDuration) {
                    return currentDuration;
                }

                @Override
                public long expireAfterRead(String key, Long value, long currentTime, long currentDuration) {
                    return currentDuration;
                }
            })
            .build();

    public void blacklistToken(String token, long expiryTimeSeconds) {
        if (token != null) {
            blacklist.put(token, expiryTimeSeconds * 1000);
        }
    }

    public boolean isBlacklisted(String token) {
        return token != null && blacklist.getIfPresent(token) != null;
    }

    public void cleanExpiredTokens() {
        blacklist.cleanUp();
    }
}
