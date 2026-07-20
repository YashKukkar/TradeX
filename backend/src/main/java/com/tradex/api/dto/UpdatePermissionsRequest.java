package com.tradex.api.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdatePermissionsRequest(
    @NotNull(message = "Permissions list is required")
    List<String> permissions
) {}
