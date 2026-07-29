package com.tradex.api.dto;

public record BankDetailDTO(
    Long id,
    String accountNumber,
    String ifscCode,
    String holderName,
    String bankName,
    boolean isPrimary
) {}
