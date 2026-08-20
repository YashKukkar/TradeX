package com.tradex.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long jwtExpirationInMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public List<String> extractPermissions(String token) {
        String perms = extractAllClaims(token).get("permissions", String.class);
        if (perms == null || perms.isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.asList(perms.split(","));
    }

    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    public Date extractIssuedAt(String token) {
        return extractAllClaims(token).getIssuedAt();
    }


    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(String username, String role, List<String> permissions) {
        var builder = Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationInMs));

        if (permissions != null && !permissions.isEmpty()) {
            builder.claim("permissions", permissions.stream().collect(Collectors.joining(",")));
        }

        return builder.signWith(getSigningKey()).compact();
    }

    public String generateToken(String username, String role) {
        return generateToken(username, role, Collections.emptyList());
    }

    public Boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }
}

