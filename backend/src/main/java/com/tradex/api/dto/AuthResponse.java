package com.tradex.api.dto;

public record AuthResponse(
        String token,
        String email) {
}
