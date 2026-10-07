package com.tradex.api.util;

import com.tradex.api.entity.WalletTransaction;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.exception.AppException;

/**
 * Idempotency keys are globally unique in the database, so a replayed key must only ever
 * return the caller's own transaction of the same kind. Anything else is a key collision.
 */
public final class IdempotencyGuard {

    public static final int MAX_KEY_LENGTH = 100;

    private IdempotencyGuard() {
    }

    public static String requireKey(String key) {
        if (key == null || key.isBlank()) {
            throw new AppException.BadRequestException("Idempotency-Key header is required");
        }
        String trimmed = key.trim();
        if (trimmed.length() > MAX_KEY_LENGTH) {
            throw new AppException.BadRequestException("Idempotency-Key must be at most " + MAX_KEY_LENGTH + " characters");
        }
        return trimmed;
    }

    public static WalletTransaction ownedBy(WalletTransaction existing, String email, WalletTransactionType type) {
        boolean sameUser = existing.getUser() == null || email == null
                || email.equalsIgnoreCase(existing.getUser().getEmail());
        boolean sameType = existing.getType() == null || type == null || existing.getType() == type;
        if (!sameUser || !sameType) {
            throw new AppException.ConflictException("Idempotency-Key has already been used for a different request");
        }
        return existing;
    }
}
