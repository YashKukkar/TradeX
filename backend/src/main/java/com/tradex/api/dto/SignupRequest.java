package com.tradex.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(

        @NotBlank @Email String email,

        @NotBlank @Size(min = 8, max = 100) String password,

        @Pattern(regexp = "^[A-Z0-9]{2,10}$") String referralCode,

        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone number must contain between 10 and 15 digits") String phoneNumber,

        @Pattern(regexp = "^[A-Z0-9]{8,20}$", message = "Account number must be between 8 and 20 characters long") String accountNumber

) {

    public SignupRequest {

        email = normalize(email);
        referralCode = normalizeUpper(referralCode);
        accountNumber = normalizeUpper(accountNumber);
        phoneNumber = normalize(phoneNumber);
    }

    private static String normalize(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim();
    }

    private static String normalizeUpper(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim().toUpperCase();
    }
}
