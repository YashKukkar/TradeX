package com.tradex.api.dto;

public record AdminSystemHealthDTO(
    boolean databaseOperational,
    boolean storageOperational,
    String storageProvider
) {}
