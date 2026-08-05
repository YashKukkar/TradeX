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
import com.tradex.api.service.SystemSettingService;
import com.tradex.api.entity.SystemSetting;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class DepositTransactionHandler implements TransactionHandler {

    private final WalletTransactionRepository walletTransactionRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final WalletBalanceManager walletBalanceManager;
    private final SystemSettingService systemSettingService;

    @Override
    public WalletTransactionType getType() {
        return WalletTransactionType.DEPOSIT;
    }

    @Override
    public void approve(User actor, User target, WalletTransaction tx) {
        boolean isFirstDeposit = !walletTransactionRepository.existsByUserIdAndTypeAndStatus(
                target.getId(),
                WalletTransactionType.DEPOSIT,
                WalletTransactionStatus.SUCCESS);

        walletBalanceManager.mutateWithdrawableBalance(target, tx.getAmount());

        tx.setStatus(WalletTransactionStatus.SUCCESS);
        tx.setBalanceAfter(target.getWithdrawableBalance());
        tx.setNotes("Deposit approved by admin");
        tx.setApprovedAt(LocalDateTime.now());
        tx.setProcessedBy(actor);
        walletTransactionRepository.save(tx);

        log.info("Deposit transaction ID {} approved for user: {} by actor: {}, amount: {}",
                tx.getId(), target.getEmail(), actor.getEmail(), tx.getAmount());

        // Audit Log
        AdminAuditLog auditLog = new AdminAuditLog(
                actor,
                target,
                AdminAction.APPROVE_DEPOSIT,
                "Deposit approved: amount=" + tx.getAmount().stripTrailingZeros().toPlainString() + " | Notes: " + tx.getNotes()
        );
        adminAuditLogRepository.save(auditLog);

        applyFirstDepositBonus(target, tx.getAmount(), isFirstDeposit);
    }

    @Override
    public void reject(User actor, User target, WalletTransaction tx, String reason) {
        tx.setStatus(WalletTransactionStatus.FAILED);
        tx.setBalanceAfter(target.getWithdrawableBalance());
        tx.setNotes("Deposit rejected by admin: " + reason);
        tx.setApprovedAt(LocalDateTime.now());
        tx.setProcessedBy(actor);
        walletTransactionRepository.save(tx);

        log.info("Deposit transaction ID {} rejected for user: {} by actor: {}, amount: {}, reason: {}",
                tx.getId(), target.getEmail(), actor.getEmail(), tx.getAmount(), reason);

        // Audit Log
        AdminAuditLog auditLog = new AdminAuditLog(
                actor,
                target,
                AdminAction.REJECT_DEPOSIT,
                "Deposit rejected: amount=" + tx.getAmount().stripTrailingZeros().toPlainString() + " | Reason: " + reason
        );
        adminAuditLogRepository.save(auditLog);
    }

    private void applyFirstDepositBonus(User user, BigDecimal depositAmount, boolean isFirstDeposit) {
        if (!isFirstDeposit) return;

        SystemSetting settings = systemSettingService.getSettings();
        boolean enabled = settings.isFirstDepositRewardEnabled();
        if (!enabled) return;

        BigDecimal threshold = settings.getFirstDepositRewardThreshold();
        if (threshold == null || depositAmount.compareTo(threshold) < 0) {
            log.info("Deposit amount did not meet threshold for first deposit bonus");
            return;
        }

        BigDecimal bonusAmount = settings.getFirstDepositRewardAmount();
        if (bonusAmount == null || bonusAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        walletBalanceManager.mutateBonusBalance(user, bonusAmount);

        WalletTransaction bonusTx = WalletTransaction.builder()
                .user(user)
                .amount(bonusAmount)
                .balanceAfter(user.getBonusBalance())
                .type(WalletTransactionType.FIRST_DEPOSIT_BONUS)
                .status(WalletTransactionStatus.SUCCESS)
                .notes("First-time wallet load bonus reward")
                .approvedAt(LocalDateTime.now())
                .build();

        walletTransactionRepository.save(bonusTx);
        log.info("Awarded first-time deposit bonus of {} to user {}", bonusAmount, user.getEmail());
    }
}
