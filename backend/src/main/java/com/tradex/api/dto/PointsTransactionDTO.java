package com.tradex.api.dto;

public record PointsTransactionDTO(
    Long id,
    Long amount,
    Long balanceAfter,
    String type,
    String notes,
    Long createdAt
) {}

