package com.tradex.api.util;

import com.tradex.api.entity.User;
import com.tradex.api.entity.WalletTransaction;
import com.tradex.api.enums.WalletTransactionStatus;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletTransactionHelper {

    private final UserRepository userRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailedTransaction(@NonNull Long userId, BigDecimal amount, BigDecimal balance, WalletTransactionType type, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        WalletTransaction failTx = new WalletTransaction(
                user,
                amount,
                balance,
                type,
                WalletTransactionStatus.FAILED,
                message);
        walletTransactionRepository.save(failTx);
    }
}
