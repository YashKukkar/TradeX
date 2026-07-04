package com.tradex.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminAdjustPointsRequest(
        @NotNull
        @Min(value = -10_000_000, message = "Delta cannot be less than -10,000,000")
        @Max(value = 10_000_000, message = "Delta cannot exceed 10,000,000")
        Long delta,

        @NotBlank(message = "Reason is required")
        @Size(max = 200, message = "Reason cannot exceed 200 characters")
        String reason
) {}
