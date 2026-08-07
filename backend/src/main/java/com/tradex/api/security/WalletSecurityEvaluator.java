package com.tradex.api.security;

import com.tradex.api.entity.WalletTransaction;
import com.tradex.api.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("walletSecurity")
@RequiredArgsConstructor

public class WalletSecurityEvaluator {

    private final WalletTransactionRepository walletTransactionRepository;

    public boolean canManageTransaction(Long transactionId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        boolean isSuperAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        if (isSuperAdmin) {
            return true;
        }

        WalletTransaction tx = walletTransactionRepository.findById(transactionId).orElse(null);
        if (tx == null) {
            return false;
        }

        String requiredPerm = switch (tx.getType()) {
            case DEPOSIT -> "PERM_MANAGE_DEPOSITS";
            case WITHDRAWAL -> "PERM_MANAGE_WITHDRAWALS";
            default -> null;
        };

        if (requiredPerm == null) {
            return false;
        }

        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(requiredPerm));
    }
}
