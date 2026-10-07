package com.tradex.api.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.tradex.api.exception.AppException.TooManyRequestsException;
import com.tradex.api.util.AuthUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Slf4j
public class AuthRateLimiter {

    // Failed logins per email, fixed window. After MAX_LOGIN_FAILURES wrong passwords the email is paused
    // until the window ends. Short on purpose: it slows guessing without locking the real owner out for long.
    private static final int MAX_LOGIN_FAILURES = 5;
    private final Cache<String, AtomicInteger> loginFailureCache = Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(100_000)
            .build();

    // 3 forgot-password requests per 5 minutes per Email
    private final Cache<String, AtomicInteger> forgotPasswordEmailCache = Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(50_000)
            .build();

    // 5 OTP verification attempts per 5 minutes per Email
    private final Cache<String, AtomicInteger> otpVerifyCache = Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(50_000)
            .build();

    public void checkLoginAllowed(String email) {
        AtomicInteger failures = loginFailureCache.getIfPresent(AuthUtils.normalizeEmail(email));
        if (failures != null && failures.get() >= MAX_LOGIN_FAILURES) {
            log.warn("[RATE_LIMIT] Too many failed logins for {}", AuthUtils.maskEmail(email));
            throw new TooManyRequestsException("Too many failed login attempts. Please try again in a few minutes or reset your password.");
        }
    }

    public void recordLoginFailure(String email) {
        loginFailureCache.get(AuthUtils.normalizeEmail(email), k -> new AtomicInteger(0)).incrementAndGet();
    }

    public void clearLoginFailures(String email) {
        loginFailureCache.invalidate(AuthUtils.normalizeEmail(email));
    }

    public void checkForgotPasswordRateLimit(String email) {
        if (email == null || email.isBlank()) return;
        String normalized = AuthUtils.normalizeEmail(email);
        AtomicInteger counter = forgotPasswordEmailCache.get(normalized, k -> new AtomicInteger(0));
        if (counter != null && counter.incrementAndGet() > 3) {
            log.warn("[RATE_LIMIT] Exceeded forgot-password rate limit for: {}", AuthUtils.maskEmail(normalized));
            throw new TooManyRequestsException("Too many password reset requests. Please wait a few minutes before trying again.");
        }
    }

    public void checkOtpVerifyRateLimit(String email) {
        if (email == null || email.isBlank()) return;
        String normalized = AuthUtils.normalizeEmail(email);
        AtomicInteger counter = otpVerifyCache.get(normalized, k -> new AtomicInteger(0));
        if (counter != null && counter.incrementAndGet() > 5) {
            log.warn("[RATE_LIMIT] Exceeded OTP verification attempts for: {}", AuthUtils.maskEmail(normalized));
            throw new TooManyRequestsException("Too many verification attempts. Please wait 5 minutes before trying again.");
        }
    }
}
