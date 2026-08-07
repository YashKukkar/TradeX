package com.tradex.api.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret",
                "9a4f2c8d3b7a1e6f45c8a0b3f267d8b1d4e6f3c8a9d2b5f8e3a9c8b5f6v8a3d9");
        ReflectionTestUtils.setField(jwtUtil, "jwtExpirationInMs", 86400000L);
    }

    @Test
    void testGenerateAndValidateToken() {
        String email = "test@example.com";
        String token = jwtUtil.generateToken(email, "USER");

        assertNotNull(token);

        String extractedEmail = jwtUtil.extractUsername(token);
        assertEquals(email, extractedEmail);

        assertTrue(jwtUtil.validateToken(token, email));
    }

    @Test
    void testInvalidTokenValidation() {
        String token = jwtUtil.generateToken("user1@example.com", "USER");
        assertFalse(jwtUtil.validateToken(token, "wronguser@example.com"));
    }
}
