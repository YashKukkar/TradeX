package com.tradex.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AddBankAccountRequest(
    @NotBlank(message = "Bank account number cannot be blank")
    @Pattern(regexp = "^[A-Z0-9]{8,30}$", message = "Account number must be alphanumeric and between 8 and 30 characters")
    String accountNumber,

    @NotBlank(message = "IFSC code cannot be blank")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "IFSC must follow official format (e.g. SBIN0123456)")
    String ifscCode,

    @NotBlank(message = "Account holder name cannot be blank")
    String holderName,

    @NotBlank(message = "Bank name cannot be blank")
    String bankName,

    boolean isPrimary
) {}
