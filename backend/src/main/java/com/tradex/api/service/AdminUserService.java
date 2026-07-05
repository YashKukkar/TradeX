package com.tradex.api.service;

import com.tradex.api.config.audit.AdminAudited;
import com.tradex.api.dto.AdminAdjustPointsRequest;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {

    private final UserRepository userRepository;
    private final AdminAuditLogRepository auditLogRepository;
    private final PointsTransactionRepository pointsTransactionRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final VerificationService verificationService;


    private User loadTargetForUpdate(Long userId) {
        return userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private void selfActionGuard(String adminEmail, User target, String action) {
        if (target.getEmail().equalsIgnoreCase(adminEmail)) {
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
            throw new BadRequestException("User account is already locked");
        }

        target.setLocked(true);
        return new UserDTO(target);
    }

    @Transactional
    @AdminAudited(action = AdminAction.UNLOCK, details = "'Account unlocked by admin'")
    public UserDTO unlockUser(String adminEmail, Long userId) {
        User target = loadTargetForUpdate(userId);

        if (!target.isLocked()) {
            throw new BadRequestException("User account is not locked");
        }

        target.setLocked(false);
        return new UserDTO(target);
    }

    // ── Enable / Disable ─────────────────────────────────────────────────────

    @Transactional
    @AdminAudited(action = AdminAction.DISABLE, details = "'Account disabled by admin'")
    public UserDTO disableUser(String adminEmail, Long userId) {
        User target = loadTargetForUpdate(userId);
        selfActionGuard(adminEmail, target, "disable");

        if (!target.isEnabled()) {
            throw new BadRequestException("User account is already disabled");
        }

        target.setEnabled(false);
        return new UserDTO(target);
    }

    @Transactional
    @AdminAudited(action = AdminAction.ENABLE, details = "'Account enabled by admin'")
    public UserDTO enableUser(String adminEmail, Long userId) {
        User target = loadTargetForUpdate(userId);

        if (target.isEnabled()) {
            throw new BadRequestException("User account is already enabled");
        }

        target.setEnabled(true);
        return new UserDTO(target);
    }

    // ── Force Email Verification ──────────────────────────────────────────────

    @Transactional
    @AdminAudited(action = AdminAction.FORCE_EMAIL_VERIFY, details = "'Email manually verified by admin'")
    public UserDTO forceVerifyEmail(String adminEmail, Long userId) {
        User target = loadTargetForUpdate(userId);

        if (target.isEmailVerified()) {
            throw new BadRequestException("User email is already verified");
        }

        target.setEmailVerified(true);
        return new UserDTO(target);
    }

    // ── Password Reset Email ──────────────────────────────────────────────────

    @Transactional
    @AdminAudited(action = AdminAction.PASSWORD_RESET_EMAIL_SENT, details = "'Password reset email triggered by admin'")
    public void sendPasswordResetEmail(String adminEmail, Long userId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        target.setCredentialsExpired(true);
        verificationService.createVerificationToken(target, VerificationType.PASSWORD_RESET);
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

        return new UserDTO(target);
    }

    // ── Audit Logs & User Transactions Queries ────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AdminAuditLogDTO> getAuditLogs(Pageable pageable) {
        // Find all logs with actor and target fetched eagerly in a clean Page representation
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
