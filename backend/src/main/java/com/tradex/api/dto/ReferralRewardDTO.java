package com.tradex.api.dto;

import java.time.LocalDateTime;

public record ReferralRewardDTO(
    Long id,
    String referredUserEmail,
    Integer level,
    Long pointsAwarded,
    String status,
    LocalDateTime createdAt
) {}

