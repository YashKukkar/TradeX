package com.tradex.api.util;

import com.tradex.api.entity.User;
import com.tradex.api.entity.WalletTransaction;
import com.tradex.api.enums.WalletTransactionStatus;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.exception.AppException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class IdempotencyGuardTest {

    private WalletTransaction tx(String email, WalletTransactionType type) {
        return new WalletTransaction(new User(email, "pw"), BigDecimal.TEN, BigDecimal.TEN, type,
                WalletTransactionStatus.PENDING, "n");
    }

    @Test
    void requireKeyRejectsMissingBlankAndOverlong() {
        assertThrows(AppException.BadRequestException.class, () -> IdempotencyGuard.requireKey(null));
        assertThrows(AppException.BadRequestException.class, () -> IdempotencyGuard.requireKey("  "));
        assertThrows(AppException.BadRequestException.class, () -> IdempotencyGuard.requireKey("x".repeat(101)));
        assertEquals("abc", IdempotencyGuard.requireKey(" abc "));
    }

    @Test
    void ownedByReturnsOwnTransactionOfSameType() {
        WalletTransaction own = tx("a@x.com", WalletTransactionType.DEPOSIT);
        assertSame(own, IdempotencyGuard.ownedBy(own, "A@x.com", WalletTransactionType.DEPOSIT));
    }

    @Test
    void ownedByRejectsAnotherUsersTransaction() {
        WalletTransaction other = tx("b@x.com", WalletTransactionType.DEPOSIT);
        assertThrows(AppException.ConflictException.class,
                () -> IdempotencyGuard.ownedBy(other, "a@x.com", WalletTransactionType.DEPOSIT));
    }

    @Test
    void ownedByRejectsKeyReusedForDifferentOperation() {
        WalletTransaction deposit = tx("a@x.com", WalletTransactionType.DEPOSIT);
        assertThrows(AppException.ConflictException.class,
                () -> IdempotencyGuard.ownedBy(deposit, "a@x.com", WalletTransactionType.WITHDRAWAL));
    }
}
