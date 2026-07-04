package com.tradex.api.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class TokenBlacklistCacheTest {

    private TokenBlacklistCache cache;

    @BeforeEach
    void setUp() {
        cache = new TokenBlacklistCache();
    }

    @Test
    void testBlacklistTokenAndIsBlacklisted() {
        String token = "some-jwt-token";
        long futureExpiry = (Instant.now().toEpochMilli() + 10000) / 1000;

        assertFalse(cache.isBlacklisted(token));
        cache.blacklistToken(token, futureExpiry);
        assertTrue(cache.isBlacklisted(token));
    }

    @Test
    void testBlacklistNullToken() {
        assertFalse(cache.isBlacklisted(null));
        assertDoesNotThrow(() -> cache.blacklistToken(null, 12345L));
    }

    @Test
    void testTokenExpiry() throws Exception {
        String token = "expired-token";
        long pastExpiry = (Instant.now().toEpochMilli() - 1000) / 1000;

        cache.blacklistToken(token, pastExpiry);
        assertFalse(cache.isBlacklisted(token));
    }

    @Test
    void testCleanExpiredTokens() {
        String validToken = "valid-token";
        String expiredToken = "expired-token";
        long now = Instant.now().toEpochMilli();

        cache.blacklistToken(validToken, (now + 10000) / 1000);
        cache.blacklistToken(expiredToken, (now - 1000) / 1000);

        cache.cleanExpiredTokens();

        assertTrue(cache.isBlacklisted(validToken));
        assertFalse(cache.isBlacklisted(expiredToken));
    }
}
