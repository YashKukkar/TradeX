package com.tradex.api.dto;

public record PermissionRegistryDTO(
    String key,
    String displayName,
    String description,
    String category
) {}
