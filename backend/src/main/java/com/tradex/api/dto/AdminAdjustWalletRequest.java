package com.tradex.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record AdminAdjustWalletRequest(
        @NotNull(message = "Delta cannot be null")
        BigDecimal delta,

        @NotBlank(message = "Wallet type is required (CASH or BONUS)")
        String walletType,

        @NotBlank(message = "Reason is required")
        @Size(max = 200, message = "Reason cannot exceed 200 characters")
        String reason
) {}
