package com.tradex.api.service;

import com.tradex.api.security.JwtUtil;
import com.tradex.api.security.TokenBlacklistCache;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class SecurityService {

    private final TokenBlacklistCache tokenBlacklistCache;
    private final JwtUtil jwtUtil;

    public String getAuthenticatedUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return auth.getName();
    }

    public void setTokenCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("token", token)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(86400) // 1 day
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String jwt = extractJwt(request);

        if (jwt != null && !"dummy".equals(jwt) && !"session".equals(jwt)) {
            try {
                Date expiry = jwtUtil.extractExpiration(jwt);
                long expirySeconds = expiry.getTime() / 1000;
                tokenBlacklistCache.blacklistToken(jwt, expirySeconds);
            } catch (Exception e) {
                log.warn("Failed to blacklist token during logout: {}", e.getMessage());
            }
        }

        clearTokenCookie(response);
    }

    private String extractJwt(HttpServletRequest request) {
        String jwt = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("token".equals(cookie.getName())) {
                    jwt = cookie.getValue();
                    break;
                }
            }
        }
        if (jwt == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
            }
        }
        return jwt;
    }

    private void clearTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
