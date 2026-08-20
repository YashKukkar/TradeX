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

    // 10 login requests per minute per IP
    private final Cache<String, AtomicInteger> loginIpCache = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .maximumSize(50_000)
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

    public void checkLoginRateLimit(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) return;
        AtomicInteger counter = loginIpCache.get(clientIp, k -> new AtomicInteger(0));
        if (counter != null && counter.incrementAndGet() > 10) {
            log.warn("[RATE_LIMIT] Exceeded login rate limit from IP: {}", clientIp);
            throw new TooManyRequestsException("Too many login requests. Please try again in 1 minute.");
        }
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
