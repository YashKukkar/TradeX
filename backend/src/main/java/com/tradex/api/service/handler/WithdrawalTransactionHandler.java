package com.tradex.api.service.handler;

import com.tradex.api.entity.AdminAuditLog;
import com.tradex.api.entity.User;
import com.tradex.api.entity.WalletTransaction;
import com.tradex.api.enums.AdminAction;
import com.tradex.api.enums.WalletTransactionStatus;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.repository.AdminAuditLogRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import com.tradex.api.service.WalletBalanceManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class WithdrawalTransactionHandler implements TransactionHandler {

    private final WalletTransactionRepository walletTransactionRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final WalletBalanceManager walletBalanceManager;

    @Override
    public WalletTransactionType getType() {
        return WalletTransactionType.WITHDRAWAL;
    }

    @Override
    public void approve(User actor, User target, WalletTransaction tx) {
        tx.setStatus(WalletTransactionStatus.SUCCESS);
        tx.setBalanceAfter(target.getWithdrawableBalance());
        tx.setNotes("Withdrawal approved by admin");
        tx.setApprovedAt(LocalDateTime.now());
        walletTransactionRepository.save(tx);

        // Audit Log
        AdminAuditLog auditLog = new AdminAuditLog(
                actor,
                target,
                AdminAction.APPROVE_WITHDRAWAL,
                "Withdrawal approved: amount=" + tx.getAmount().stripTrailingZeros().toPlainString() + " | Notes: " + tx.getNotes()
        );
        adminAuditLogRepository.save(auditLog);
    }

    @Override
    public void reject(User actor, User target, WalletTransaction tx, String reason) {
        // Refund withdrawable balance (since it was deducted on request)
        walletBalanceManager.mutateWithdrawableBalance(target, tx.getAmount());

        tx.setStatus(WalletTransactionStatus.FAILED);
        tx.setBalanceAfter(target.getWithdrawableBalance());
        tx.setNotes("Withdrawal rejected by admin: " + reason);
        tx.setApprovedAt(LocalDateTime.now());
        walletTransactionRepository.save(tx);

        // Audit Log
        AdminAuditLog auditLog = new AdminAuditLog(
                actor,
                target,
                AdminAction.REJECT_WITHDRAWAL,
                "Withdrawal rejected: amount=" + tx.getAmount().stripTrailingZeros().toPlainString() + " | Reason: " + reason
        );
        adminAuditLogRepository.save(auditLog);
    }
}
