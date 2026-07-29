package com.tradex.api.service.handler;

import com.tradex.api.entity.User;
import com.tradex.api.entity.WalletTransaction;
import com.tradex.api.enums.WalletTransactionType;

public interface TransactionHandler {
    WalletTransactionType getType();
    void approve(User actor, User target, WalletTransaction tx);
    void reject(User actor, User target, WalletTransaction tx, String reason);
}
