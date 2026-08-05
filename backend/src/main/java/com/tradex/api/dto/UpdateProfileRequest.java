package com.tradex.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank(message = "Phone number cannot be blank")
    @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "Phone number must be a valid national or international format")
    String phoneNumber,

    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    String fullName
) {
    public UpdateProfileRequest {
        fullName = normalizeName(fullName);
    }

    private static String normalizeName(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim().replaceAll("\\s+", " ");
    }
}
