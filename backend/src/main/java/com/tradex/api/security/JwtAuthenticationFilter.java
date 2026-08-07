package com.tradex.api.security;

import com.tradex.api.entity.User;
import com.tradex.api.entity.SystemSetting;
import com.tradex.api.enums.Role;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.service.SystemSettingService;
import com.tradex.api.dto.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;

import jakarta.servlet.http.Cookie;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final SystemSettingService systemSettingService;
    private final TokenBlacklistCache tokenBlacklistCache;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

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
            final String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
            }
        }

        if (jwt == null || "dummy".equals(jwt) || "session".equals(jwt)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (tokenBlacklistCache.isBlacklisted(jwt)) {
            writeErrorResponse(request, response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized",
                    "Token is blacklisted/revoked.");
            return;
        }

        String userEmail;
        try {
            userEmail = jwtUtil.extractUsername(jwt);
            String role = jwtUtil.extractRole(jwt);

            if (userEmail == null || SecurityContextHolder.getContext().getAuthentication() != null) {
                filterChain.doFilter(request, response);
                return;
            }

            if (!jwtUtil.validateToken(jwt, userEmail)) {
                filterChain.doFilter(request, response);
                return;
            }

            SystemSetting settings = (systemSettingService != null) ? systemSettingService.getSettings() : null;
            User user = null;

            if (settings != null && (settings.isEmailVerificationEnabled() || settings.isPhoneVerificationEnabled())) {
                String path = request.getRequestURI();
                boolean isBypass = path.endsWith("/verify-email") ||
                        path.endsWith("/verify-phone") ||
                        path.endsWith("/logout") ||
                        path.endsWith("/me");

                if (!isBypass) {
                    user = userRepository.findByEmail(userEmail).orElse(null);
                    if (user == null) {
                        filterChain.doFilter(request, response);
                        return;
                    }

                    if (settings.isEmailVerificationEnabled() && !user.isEmailVerified()) {
                        writeErrorResponse(request, response, HttpServletResponse.SC_FORBIDDEN, "Forbidden",
                                "Email verification is required.");
                        return;
                    }

                    if (settings.isPhoneVerificationEnabled() && user.getPhoneNumber() != null
                            && !user.isPhoneVerified()) {
                        writeErrorResponse(request, response, HttpServletResponse.SC_FORBIDDEN, "Forbidden",
                                "Phone verification is required.");
                        return;
                    }
                }
            }

            if (user == null) {
                user = new User();
                user.setEmail(userEmail);
                user.setRole(Role.valueOf(role != null ? role.toUpperCase() : "USER"));
            }
            // Populate permissions from JWT (which includes team inherited permissions)
            List<String> permStrings = jwtUtil.extractPermissions(jwt);
            if (!permStrings.isEmpty()) {
                user.setPermissions(new HashSet<>(permStrings));
            }

            CustomUserPrincipal principal = new CustomUserPrincipal(user);
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    principal.getAuthorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);

        } catch (Exception e) {
            log.warn("JWT Authentication failed: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private void writeErrorResponse(HttpServletRequest request, HttpServletResponse response, int status, String error,
            String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        ErrorResponse errorResponse = new ErrorResponse(status, error, message, request.getRequestURI());

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        response.getWriter().write(mapper.writeValueAsString(errorResponse));
    }
}
