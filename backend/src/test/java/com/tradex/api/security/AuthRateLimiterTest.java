package com.tradex.api.security;

import com.tradex.api.exception.AppException.TooManyRequestsException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthRateLimiterTest {

    private final AuthRateLimiter limiter = new AuthRateLimiter();

    @Test
    void pausesAnEmailAfterFiveFailures() {
        for (int i = 0; i < 5; i++) {
            limiter.checkLoginAllowed("user@example.com");
            limiter.recordLoginFailure("user@example.com");
        }
        assertThrows(TooManyRequestsException.class, () -> limiter.checkLoginAllowed("User@Example.com"));
        assertDoesNotThrow(() -> limiter.checkLoginAllowed("other@example.com"));
    }

    @Test
    void successClearsFailures() {
        for (int i = 0; i < 4; i++) limiter.recordLoginFailure("a@example.com");
        limiter.clearLoginFailures("a@example.com");
        limiter.recordLoginFailure("a@example.com");
        assertDoesNotThrow(() -> limiter.checkLoginAllowed("a@example.com"));
    }
}
