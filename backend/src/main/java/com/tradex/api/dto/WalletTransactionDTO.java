package com.tradex.api.dto;

import com.tradex.api.entity.WalletTransaction;
import java.math.BigDecimal;
import java.time.ZoneId;

public record WalletTransactionDTO(
    Long id,
    BigDecimal amount,
    BigDecimal balanceAfter,
    String type,
    String status,
    String notes,
    Long createdAt,
    Long approvedAt,
    String userEmail,
    String userPhone,
    String userAccountNumber
) {
    public WalletTransactionDTO(
        Long id,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String type,
        String status,
        String notes,
        Long createdAt,
        String userEmail,
        String userPhone,
        String userAccountNumber
    ) {
        this(id, amount, balanceAfter, type, status, notes, createdAt, createdAt, userEmail, userPhone, userAccountNumber);
    }

    public WalletTransactionDTO(WalletTransaction tx) {
        this(
            tx.getId(),
            tx.getAmount(),
            tx.getBalanceAfter(),
            tx.getType().name(),
            tx.getStatus().name(),
            tx.getNotes(),
            tx.getCreatedAt() != null
                ? tx.getCreatedAt().atZone(ZoneId.systemDefault()).toEpochSecond()
                : System.currentTimeMillis() / 1000,
            tx.getApprovedAt() != null
                ? tx.getApprovedAt().atZone(ZoneId.systemDefault()).toEpochSecond()
                : (tx.getCreatedAt() != null ? tx.getCreatedAt().atZone(ZoneId.systemDefault()).toEpochSecond() : System.currentTimeMillis() / 1000),
            tx.getUser() != null ? tx.getUser().getEmail() : null,
            tx.getUser() != null ? tx.getUser().getPhoneNumber() : null,
            tx.getUser() != null
                ? tx.getUser().getPrimaryBank().map(b -> b.getAccountNumber()).orElse(null)
                : null
        );
    }
}

