package com.tradex.api.service;

import com.tradex.api.dto.WalletTransactionDTO;
import com.tradex.api.entity.*;
import com.tradex.api.enums.*;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.exception.AppException.BadRequestException;
import com.tradex.api.exception.AppException.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class WalletServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private WalletTransactionRepository walletTransactionRepository;

    @Mock
    private PointsTransactionRepository pointsTransactionRepository;

    @Mock
    private SystemSettingService systemSettingService;

    @Mock
    private WalletTransactionHelper walletTransactionHelper;

    private WalletService walletService;
    private com.tradex.api.config.AppProperties appProperties;

    private User user;
    private SystemSetting settings;

    @BeforeEach
    void setUp() {
        user = new User("user@example.com", "password");
        user.setId(1L);
        user.setPointsBalance(500L);
        user.setWithdrawableBalance(BigDecimal.ZERO);
        user.setBonusBalance(BigDecimal.ZERO);
        user.setAccountNumber("1234567890");

        settings = new SystemSetting();
        settings.setFirstDepositRewardEnabled(true);
        settings.setFirstDepositRewardAmount(new BigDecimal("100.00"));
        settings.setFirstDepositRewardThreshold(new BigDecimal("500.00"));
        settings.setPointsConversionEnabled(true);
        settings.setPointsToCashConversionRate(new BigDecimal("10.00"));

        appProperties = new com.tradex.api.config.AppProperties();

        walletService = new WalletService(
            userRepository,
            walletTransactionRepository,
            pointsTransactionRepository,
            systemSettingService,
            walletTransactionHelper,
            appProperties
        );
    }

    @Test
    @DisplayName("Should successfully queue a deposit request with PENDING status")
    void testDepositRequest() {
        when(userRepository.findByEmailForUpdate("user@example.com")).thenReturn(Optional.of(user));

        WalletTransactionDTO result = walletService.deposit("user@example.com", new BigDecimal("50.00"));

        assertNotNull(result);
        assertEquals(new BigDecimal("50.00"), result.amount());
        assertEquals(BigDecimal.ZERO, user.getWithdrawableBalance());
        assertEquals(WalletTransactionStatus.PENDING.name(), result.status());
        verify(walletTransactionRepository, times(1)).save(any(WalletTransaction.class));
    }

    @Test
    @DisplayName("Should approve deposit and award first-time bonus")
    void testApproveDepositWithBonus() {
        WalletTransaction pendingTx = new WalletTransaction(user, new BigDecimal("500.00"), BigDecimal.ZERO, WalletTransactionType.DEPOSIT, WalletTransactionStatus.PENDING, "Pending");
        pendingTx.setId(10L);

        when(walletTransactionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(pendingTx));
        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));
        when(walletTransactionRepository.existsByUserIdAndTypeAndStatus(1L, WalletTransactionType.DEPOSIT, WalletTransactionStatus.SUCCESS)).thenReturn(false);
        when(systemSettingService.getSettings()).thenReturn(settings);

        WalletTransactionDTO result = walletService.approveTransaction(10L);

        assertEquals(WalletTransactionStatus.SUCCESS.name(), result.status());
        assertEquals(new BigDecimal("500.00"), user.getWithdrawableBalance());
        assertEquals(new BigDecimal("100.00"), user.getBonusBalance());
        verify(walletTransactionRepository, times(2)).save(any(WalletTransaction.class));
    }

    @Test
    @DisplayName("Should reject deposit and not change balance")
    void testRejectDeposit() {
        WalletTransaction pendingTx = new WalletTransaction(user, new BigDecimal("50.00"), BigDecimal.ZERO, WalletTransactionType.DEPOSIT, WalletTransactionStatus.PENDING, "Pending");
        pendingTx.setId(11L);

        when(walletTransactionRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(pendingTx));
        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));

        WalletTransactionDTO result = walletService.rejectTransaction(11L, "Fake ID");

        assertEquals(WalletTransactionStatus.FAILED.name(), result.status());
        assertEquals(BigDecimal.ZERO, user.getWithdrawableBalance());
        verify(walletTransactionRepository, times(1)).save(pendingTx);
    }

    @Test
    @DisplayName("Should successfully queue a withdrawal request with PENDING status")
    void testWithdrawSuccess() {
        user.setWithdrawableBalance(new BigDecimal("200.00"));
        when(userRepository.findByEmailForUpdate("user@example.com")).thenReturn(Optional.of(user));

        WalletTransactionDTO result = walletService.withdraw("user@example.com", new BigDecimal("100.00"));

        assertNotNull(result);
        assertEquals(new BigDecimal("100.00"), result.amount());
        assertEquals(new BigDecimal("100.00"), user.getWithdrawableBalance());
        assertEquals(WalletTransactionStatus.PENDING.name(), result.status());
        verify(walletTransactionRepository, times(1)).save(any(WalletTransaction.class));
    }

    @Test
    @DisplayName("Should approve withdrawal")
    void testApproveWithdrawal() {
        user.setWithdrawableBalance(new BigDecimal("100.00"));
        WalletTransaction pendingTx = new WalletTransaction(user, new BigDecimal("100.00"), new BigDecimal("100.00"), WalletTransactionType.WITHDRAWAL, WalletTransactionStatus.PENDING, "Pending");
        pendingTx.setId(12L);

        when(walletTransactionRepository.findByIdForUpdate(12L)).thenReturn(Optional.of(pendingTx));
        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));

        WalletTransactionDTO result = walletService.approveTransaction(12L);

        assertEquals(WalletTransactionStatus.SUCCESS.name(), result.status());
        assertEquals(new BigDecimal("100.00"), user.getWithdrawableBalance());
        verify(walletTransactionRepository, times(1)).save(pendingTx);
    }

    @Test
    @DisplayName("Should reject withdrawal and refund balance")
    void testRejectWithdrawal() {
        user.setWithdrawableBalance(new BigDecimal("100.00"));
        WalletTransaction pendingTx = new WalletTransaction(user, new BigDecimal("100.00"), new BigDecimal("100.00"), WalletTransactionType.WITHDRAWAL, WalletTransactionStatus.PENDING, "Pending");
        pendingTx.setId(13L);

        when(walletTransactionRepository.findByIdForUpdate(13L)).thenReturn(Optional.of(pendingTx));
        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));

        WalletTransactionDTO result = walletService.rejectTransaction(13L, "Invalid bank");

        assertEquals(WalletTransactionStatus.FAILED.name(), result.status());
        assertEquals(new BigDecimal("200.00"), user.getWithdrawableBalance());
        verify(walletTransactionRepository, times(1)).save(pendingTx);
    }

    @Test
    @DisplayName("Should fail withdrawal when requested amount is below the ₹100 minimum limit")
    void testWithdrawBelowMinimumLimit() {
        when(userRepository.findByEmailForUpdate("user@example.com")).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () ->
            walletService.withdraw("user@example.com", new BigDecimal("50.00"))
        );
        verify(walletTransactionHelper, times(1)).logFailedTransaction(
                eq(1L), eq(new BigDecimal("50.00")), eq(BigDecimal.ZERO), eq(WalletTransactionType.WITHDRAWAL), anyString()
        );
    }

    @Test
    @DisplayName("Should fail withdrawal when requested amount exceeds the ₹50,000 maximum limit")
    void testWithdrawAboveMaximumLimit() {
        when(userRepository.findByEmailForUpdate("user@example.com")).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () ->
            walletService.withdraw("user@example.com", new BigDecimal("60000.00"))
        );
        verify(walletTransactionHelper, times(1)).logFailedTransaction(
                eq(1L), eq(new BigDecimal("60000.00")), eq(BigDecimal.ZERO), eq(WalletTransactionType.WITHDRAWAL), anyString()
        );
    }

    @Test
    @DisplayName("Should fail withdrawal when user does not have a linked bank account")
    void testWithdrawMissingBankAccount() {
        user.setAccountNumber(null);
        when(userRepository.findByEmailForUpdate("user@example.com")).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () ->
            walletService.withdraw("user@example.com", new BigDecimal("100.00"))
        );
        verify(walletTransactionHelper, times(1)).logFailedTransaction(
                eq(1L), eq(new BigDecimal("100.00")), eq(BigDecimal.ZERO), eq(WalletTransactionType.WITHDRAWAL), anyString()
        );
    }

    @Test
    @DisplayName("Should fail withdrawal when user has insufficient withdrawable balance")
    void testWithdrawInsufficientBalance() {
        user.setWithdrawableBalance(new BigDecimal("10.00"));
        when(userRepository.findByEmailForUpdate("user@example.com")).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () ->
            walletService.withdraw("user@example.com", new BigDecimal("100.00"))
        );
        verify(walletTransactionHelper, times(1)).logFailedTransaction(
                eq(1L), eq(new BigDecimal("100.00")), eq(new BigDecimal("10.00")), eq(WalletTransactionType.WITHDRAWAL), anyString()
        );
    }

    @Test
    @DisplayName("Should successfully convert TradeX points to bonus cash balance")
    void testConvertPointsSuccess() {
        when(systemSettingService.getSettings()).thenReturn(settings);
        when(userRepository.findByEmailForUpdate("user@example.com")).thenReturn(Optional.of(user));

        WalletTransactionDTO result = walletService.convertPoints("user@example.com", 200L);

        assertNotNull(result);
        assertEquals(new BigDecimal("20.0000"), result.amount());
        assertEquals(300L, user.getPointsBalance());
        assertEquals(new BigDecimal("20.0000"), user.getBonusBalance());
        verify(pointsTransactionRepository, times(1)).save(any(PointsTransaction.class));
        verify(walletTransactionRepository, times(1)).save(any(WalletTransaction.class));
    }

    @Test
    @DisplayName("Should fail points conversion when points conversion feature is disabled")
    void testConvertPointsDisabled() {
        settings.setPointsConversionEnabled(false);
        when(systemSettingService.getSettings()).thenReturn(settings);

        assertThrows(ForbiddenException.class, () -> 
            walletService.convertPoints("user@example.com", 100L)
        );
    }

    @Test
    @DisplayName("Should fail points conversion when user has insufficient points balance")
    void testConvertPointsInsufficientPoints() {
        user.setPointsBalance(50L);
        when(systemSettingService.getSettings()).thenReturn(settings);
        when(userRepository.findByEmailForUpdate("user@example.com")).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () -> 
            walletService.convertPoints("user@example.com", 100L)
        );
    }
}
