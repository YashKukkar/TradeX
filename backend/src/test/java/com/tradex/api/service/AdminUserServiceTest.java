package com.tradex.api.service;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.tradex.api.mapper.UserMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AdminAuditLogRepository auditLogRepository;

    @Mock
    private PointsTransactionRepository pointsTransactionRepository;

    @Mock
    private WalletTransactionRepository walletTransactionRepository;

    @Mock
    private VerificationService verificationService;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AdminUserService adminUserService;

    private User targetUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        lenient().when(userMapper.toDTO(any())).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            if (u == null) return null;
            return new UserDTO(
                u.getId(),
                u.getEmail(),
                null,
                u.getPointsBalance(),
                null,
                null,
                null,
                null,
                u.getRole() != null ? u.getRole().name() : "USER",
                0L,
                u.isEmailVerified(),
                u.isPhoneVerified(),
                u.getWithdrawableBalance(),
                u.getBonusBalance(),
                u.isEnabled(),
                u.isLocked(),
                java.util.Collections.emptyList()
            );
        });
        targetUser = new User();
        targetUser.setId(2L);
        targetUser.setEmail("user@example.com");
        targetUser.setLocked(false);
        targetUser.setEnabled(true);
        targetUser.setEmailVerified(false);
        targetUser.setPointsBalance(100L);

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setEmail("admin@example.com");
        adminUser.setLocked(false);
        adminUser.setEnabled(true);
        adminUser.setEmailVerified(true);
    }

    // ── Lock / Unlock Tests ──────────────────────────────────────────────────

    @Test
    void testLockUserSuccess() {
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        UserDTO result = adminUserService.lockUser("admin@example.com", 2L);

        assertTrue(result.locked());
        assertTrue(targetUser.isLocked());
    }

    @Test
    void testLockUserSelfActionGuard() {
        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(adminUser));

        assertThrows(BadRequestException.class, () -> 
            adminUserService.lockUser("admin@example.com", 1L)
        );
    }

    @Test
    void testLockUserAlreadyLocked() {
        targetUser.setLocked(true);
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        assertThrows(BadRequestException.class, () -> 
            adminUserService.lockUser("admin@example.com", 2L)
        );
    }

    @Test
    void testLockUserNotFound() {
        when(userRepository.findByIdForUpdate(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> 
            adminUserService.lockUser("admin@example.com", 99L)
        );
    }

    @Test
    void testUnlockUserSuccess() {
        targetUser.setLocked(true);
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        UserDTO result = adminUserService.unlockUser("admin@example.com", 2L);

        assertFalse(result.locked());
        assertFalse(targetUser.isLocked());
    }

    @Test
    void testUnlockUserNotLocked() {
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        assertThrows(BadRequestException.class, () -> 
            adminUserService.unlockUser("admin@example.com", 2L)
        );
    }

    // ── Enable / Disable Tests ────────────────────────────────────────────────

    @Test
    void testDisableUserSuccess() {
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        UserDTO result = adminUserService.disableUser("admin@example.com", 2L);

        assertFalse(result.enabled());
        assertFalse(targetUser.isEnabled());
    }

    @Test
    void testDisableUserSelfActionGuard() {
        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(adminUser));

        assertThrows(BadRequestException.class, () -> 
            adminUserService.disableUser("admin@example.com", 1L)
        );
    }

    @Test
    void testDisableUserAlreadyDisabled() {
        targetUser.setEnabled(false);
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        assertThrows(BadRequestException.class, () -> 
            adminUserService.disableUser("admin@example.com", 2L)
        );
    }

    @Test
    void testEnableUserSuccess() {
        targetUser.setEnabled(false);
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        UserDTO result = adminUserService.enableUser("admin@example.com", 2L);

        assertTrue(result.enabled());
        assertTrue(targetUser.isEnabled());
    }

    @Test
    void testEnableUserAlreadyEnabled() {
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        assertThrows(BadRequestException.class, () -> 
            adminUserService.enableUser("admin@example.com", 2L)
        );
    }

    // ── Force Email Verification Tests ────────────────────────────────────────

    @Test
    void testForceVerifyEmailSuccess() {
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        UserDTO result = adminUserService.forceVerifyEmail("admin@example.com", 2L);

        assertTrue(result.emailVerified());
        assertTrue(targetUser.isEmailVerified());
    }

    @Test
    void testForceVerifyEmailAlreadyVerified() {
        targetUser.setEmailVerified(true);
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        assertThrows(BadRequestException.class, () -> 
            adminUserService.forceVerifyEmail("admin@example.com", 2L)
        );
    }

    // ── Password Reset Email Tests ────────────────────────────────────────────

    @Test
    void testSendPasswordResetEmailSuccess() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));

        adminUserService.sendPasswordResetEmail("admin@example.com", 2L);

        verify(verificationService, times(1)).createVerificationToken(targetUser, VerificationType.PASSWORD_RESET);
    }

    @Test
    void testSendPasswordResetEmailNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> 
            adminUserService.sendPasswordResetEmail("admin@example.com", 99L)
        );
    }

    // ── Adjust Points Tests ───────────────────────────────────────────────────

    @Test
    void testAdjustPointsAddSuccess() {
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        AdminAdjustPointsRequest request = new AdminAdjustPointsRequest(50L, "Good behavior");
        UserDTO result = adminUserService.adjustPoints("admin@example.com", 2L, request);

        assertEquals(150L, result.pointsBalance());
        assertEquals(150L, targetUser.getPointsBalance());
        verify(pointsTransactionRepository, times(1)).save(any(PointsTransaction.class));
    }

    @Test
    void testAdjustPointsSubtractSuccess() {
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        AdminAdjustPointsRequest request = new AdminAdjustPointsRequest(-30L, "Correction");
        UserDTO result = adminUserService.adjustPoints("admin@example.com", 2L, request);

        assertEquals(70L, result.pointsBalance());
        assertEquals(70L, targetUser.getPointsBalance());
        verify(pointsTransactionRepository, times(1)).save(any(PointsTransaction.class));
    }

    @Test
    void testAdjustPointsNegativeBalanceThrows() {
        when(userRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetUser));

        AdminAdjustPointsRequest request = new AdminAdjustPointsRequest(-150L, "Too much deduction");

        assertThrows(BadRequestException.class, () -> 
            adminUserService.adjustPoints("admin@example.com", 2L, request)
        );
    }

    // ── Queries Tests ─────────────────────────────────────────────────────────

    @Test
    void testGetAuditLogs() {
        AdminAuditLog logEntry = new AdminAuditLog(adminUser, targetUser, AdminAction.LOCK, "Account locked");

        Pageable pageable = PageRequest.of(0, 10);
        Page<AdminAuditLog> page = new PageImpl<>(List.of(logEntry), pageable, 1);
        when(auditLogRepository.findAll(pageable)).thenReturn(page);

        Page<AdminAuditLogDTO> result = adminUserService.getAuditLogs(null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("admin@example.com", result.getContent().get(0).actorEmail());
    }

    @Test
    void testGetUserPointsHistorySuccess() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));

        PointsTransaction tx = new PointsTransaction();
        tx.setId(10L);
        tx.setUser(targetUser);
        tx.setAmount(50L);
        tx.setBalanceAfter(150L);
        tx.setType(PointsTransactionType.ADMIN_ADJUSTMENT);
        tx.setNotes("Admin adjustment");
        tx.setCreatedAt(LocalDateTime.now());

        when(pointsTransactionRepository.findByUserOrderByCreatedAtDesc(targetUser))
                .thenReturn(List.of(tx));

        List<PointsTransactionDTO> result = adminUserService.getUserPointsHistory(2L);

        assertEquals(1, result.size());
        assertEquals(50L, result.get(0).amount());
        assertEquals("ADMIN_ADJUSTMENT", result.get(0).type());
    }

    @Test
    void testGetUserWalletHistorySuccess() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));

        WalletTransaction tx = new WalletTransaction();
        tx.setId(20L);
        tx.setUser(targetUser);
        tx.setAmount(BigDecimal.TEN);
        tx.setType(WalletTransactionType.DEPOSIT);
        tx.setStatus(WalletTransactionStatus.SUCCESS);
        tx.setCreatedAt(LocalDateTime.now());

        when(walletTransactionRepository.findByUserOrderByCreatedAtDesc(targetUser))
                .thenReturn(List.of(tx));

        List<WalletTransactionDTO> result = adminUserService.getUserWalletHistory(2L);

        assertEquals(1, result.size());
        assertEquals(BigDecimal.TEN, result.get(0).amount());
    }
}
