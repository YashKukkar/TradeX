package com.tradex.api.service;
import com.tradex.api.mapper.UserMapper;

import com.tradex.api.config.audit.AdminAudited;
import com.tradex.api.dto.AdminAdjustPointsRequest;
import com.tradex.api.dto.AdminAdjustWalletRequest;
import com.tradex.api.dto.AdminAuditLogDTO;
import com.tradex.api.dto.PointsTransactionDTO;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.dto.WalletTransactionDTO;
import com.tradex.api.entity.*;
import com.tradex.api.enums.*;
import com.tradex.api.exception.AppException.*;
import com.tradex.api.repository.AdminAuditLogRepository;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.math.BigDecimal;
import java.time.Instant;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AdminUserService {

    private final UserRepository userRepository;
    private final AdminAuditLogRepository auditLogRepository;
    private final PointsTransactionRepository pointsTransactionRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final VerificationService verificationService;
    private final UserMapper userMapper;
    private final WalletBalanceManager walletBalanceManager;
    private final Cache<Long, Instant> passwordResetCooldowns = Caffeine.newBuilder()
            .expireAfterWrite(60, TimeUnit.SECONDS)
            .build();


    private User loadTargetForUpdate(Long userId) {
        return userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private void selfActionGuard(String adminEmail, User target, String action) {
        if (target.getEmail().equalsIgnoreCase(adminEmail)) {
            log.warn("Forbidden admin self-action: Admin {} tried to {} their own account", adminEmail, action);
            throw new BadRequestException("Admin cannot " + action + " their own account");
        }
    }

    // ── Lock / Unlock ────────────────────────────────────────────────────────

    @Transactional
    @AdminAudited(action = AdminAction.LOCK, details = "'Account locked by admin'")
    public UserDTO lockUser(String adminEmail, Long userId) {
        User target = loadTargetForUpdate(userId);
        selfActionGuard(adminEmail, target, "lock");

        if (target.isLocked()) {
            log.warn("Admin action failed: User {} is already locked (requested by admin {})", target.getEmail(), adminEmail);
            throw new BadRequestException("User account is already locked");
        }

        target.setLocked(true);
        return userMapper.toDTO(target);
    }

    @Transactional
    @AdminAudited(action = AdminAction.UNLOCK, details = "'Account unlocked by admin'")
    public UserDTO unlockUser(String adminEmail, Long userId) {
        User target = loadTargetForUpdate(userId);

        if (!target.isLocked()) {
            log.warn("Admin action failed: User {} is not locked (requested by admin {})", target.getEmail(), adminEmail);
            throw new BadRequestException("User account is not locked");
        }

        target.setLocked(false);
        return userMapper.toDTO(target);
    }

    // ── Enable / Disable ─────────────────────────────────────────────────────

    @Transactional
    @AdminAudited(action = AdminAction.DISABLE, details = "'Account disabled by admin'")
    public UserDTO disableUser(String adminEmail, Long userId) {
        User target = loadTargetForUpdate(userId);
        selfActionGuard(adminEmail, target, "disable");

        if (!target.isEnabled()) {
            log.warn("Admin action failed: User {} is already disabled (requested by admin {})", target.getEmail(), adminEmail);
            throw new BadRequestException("User account is already disabled");
        }

        target.setEnabled(false);
        return userMapper.toDTO(target);
    }

    @Transactional
    @AdminAudited(action = AdminAction.ENABLE, details = "'Account enabled by admin'")
    public UserDTO enableUser(String adminEmail, Long userId) {
        User target = loadTargetForUpdate(userId);

        if (target.isEnabled()) {
            log.warn("Admin action failed: User {} is already enabled (requested by admin {})", target.getEmail(), adminEmail);
            throw new BadRequestException("User account is already enabled");
        }

        target.setEnabled(true);
        return userMapper.toDTO(target);
    }

    // ── Force Email Verification ──────────────────────────────────────────────

    @Transactional
    @AdminAudited(action = AdminAction.FORCE_EMAIL_VERIFY, details = "'Email manually verified by admin'")
    public UserDTO forceVerifyEmail(String adminEmail, Long userId) {
        User target = loadTargetForUpdate(userId);

        if (target.isEmailVerified()) {
            log.warn("Admin action failed: User {} email is already verified (requested by admin {})", target.getEmail(), adminEmail);
            throw new BadRequestException("User email is already verified");
        }

        target.setEmailVerified(true);
        return userMapper.toDTO(target);
    }

    // ── Password Reset Email ──────────────────────────────────────────────────

    @Transactional
    @AdminAudited(action = AdminAction.PASSWORD_RESET_EMAIL_SENT, details = "'Password reset email triggered by admin'")
    public void sendPasswordResetEmail(String adminEmail, Long userId) {
        Instant now = Instant.now();
        Instant lastReset = passwordResetCooldowns.getIfPresent(userId);
        if (lastReset != null && now.isBefore(lastReset.plusSeconds(60))) {
            log.warn("Admin action failed: Password reset cooldown active for user ID {} (requested by admin {})", userId, adminEmail);
            throw new BadRequestException("Please wait at least 60 seconds between password reset requests for this user.");
        }
 
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
 
        target.setCredentialsExpired(true);
        verificationService.createVerificationToken(target, VerificationType.PASSWORD_RESET);
 
        passwordResetCooldowns.put(userId, now);
    }

    // ── Adjust Points ─────────────────────────────────────────────────────────

    @Transactional
    @AdminAudited(
        action = AdminAction.POINTS_ADJUSTMENT,
        details = "'Points adjusted by ' + #request.delta + ' (new balance: ' + #result.pointsBalance + '). Reason: ' + #request.reason"
    )
    public UserDTO adjustPoints(String adminEmail, Long userId, AdminAdjustPointsRequest request) {
        User target = loadTargetForUpdate(userId);

        long currentBalance = target.getPointsBalance() != null ? target.getPointsBalance() : 0L;
        long newBalance = currentBalance + request.delta();

        if (newBalance < 0) {
            log.warn("Admin action failed: Adjusting points by {} would result in negative points balance ({}) for user {} (requested by admin {})",
                    request.delta(), newBalance, target.getEmail(), adminEmail);
            throw new BadRequestException(
                    "Adjustment would result in a negative points balance (current: " + currentBalance +
                    ", delta: " + request.delta() + ")");
        }

        target.setPointsBalance(newBalance);

        // Reuse the existing PointsTransaction entity to maintain the full audit trail
        PointsTransaction tx = new PointsTransaction(
                target,
                request.delta(),
                newBalance,
                PointsTransactionType.ADMIN_ADJUSTMENT,
                "Admin adjustment: " + request.reason());
        pointsTransactionRepository.save(tx);

        return userMapper.toDTO(target);
    }

    @Transactional
    @AdminAudited(
        action = AdminAction.WALLET_ADJUSTMENT,
        details = "'Wallet adjusted: type=' + #request.walletType + ', delta=' + #request.delta + '. Reason: ' + #request.reason"
    )
    public UserDTO adjustWallet(String adminEmail, Long userId, AdminAdjustWalletRequest request) {
        User target = loadTargetForUpdate(userId);

        BigDecimal delta = request.delta();
        BigDecimal newBalance;

        try {
            if ("BONUS".equalsIgnoreCase(request.walletType())) {
                target = walletBalanceManager.mutateBonusBalance(target, delta);
                newBalance = target.getBonusBalance();
            } else if ("CASH".equalsIgnoreCase(request.walletType())) {
                target = walletBalanceManager.mutateWithdrawableBalance(target, delta);
                newBalance = target.getWithdrawableBalance();
            } else {
                log.warn("Admin action failed: Invalid wallet type {} requested by admin {}", request.walletType(), adminEmail);
                throw new BadRequestException("Invalid wallet type: " + request.walletType());
            }
        } catch (IllegalArgumentException e) {
            log.warn("Admin action failed: Wallet adjustment by {} failed for user {} due to: {} (requested by admin {})",
                    delta, target.getEmail(), e.getMessage(), adminEmail);
            throw new BadRequestException("Adjustment failed: " + e.getMessage());
        }

        WalletTransaction tx = new WalletTransaction(
                target,
                delta,
                newBalance,
                WalletTransactionType.ADMIN_ADJUSTMENT,
                WalletTransactionStatus.SUCCESS,
                "Admin adjustment: " + request.reason());
        walletTransactionRepository.save(tx);

        return userMapper.toDTO(target);
    }

    // ── Audit Logs & User Transactions Queries ────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AdminAuditLogDTO> getAuditLogs(String targetEmail, Pageable pageable) {
        if (targetEmail != null && !targetEmail.isBlank()) {
            return auditLogRepository.findByTargetEmail(targetEmail, pageable).map(AdminAuditLogDTO::new);
        }
        return auditLogRepository.findAll(pageable).map(AdminAuditLogDTO::new);
    }

    @Transactional(readOnly = true)
    public List<PointsTransactionDTO> getUserPointsHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return pointsTransactionRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(tx -> new PointsTransactionDTO(
                        tx.getId(),
                        tx.getAmount(),
                        tx.getBalanceAfter(),
                        tx.getType().name(),
                        tx.getNotes(),
                        tx.getCreatedAt() != null
                                ? tx.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toEpochSecond()
                                : System.currentTimeMillis() / 1000
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionDTO> getUserWalletHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return walletTransactionRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(WalletTransactionDTO::new)
                .toList();
    }
}
