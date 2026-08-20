package com.tradex.api.service;

import com.tradex.api.dto.WalletTransactionDTO;
import com.tradex.api.entity.*;
import com.tradex.api.enums.*;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import com.tradex.api.util.WalletTransactionHelper;
import com.tradex.api.repository.AdminAuditLogRepository;
import com.tradex.api.exception.AppException.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.tradex.api.service.handler.DepositTransactionHandler;
import com.tradex.api.service.handler.WithdrawalTransactionHandler;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

        @Mock
        private UserRepository userRepository;

        @Mock
        private WalletTransactionRepository walletTransactionRepository;

        @Mock
        private SystemSettingService systemSettingService;

        @Mock
        private WalletTransactionHelper walletTransactionHelper;

        @Mock
        private AdminAuditLogRepository adminAuditLogRepository;

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
                user.setBankDetails(new ArrayList<>(List.of(
                                BankDetail.builder()
                                                .user(user)
                                                .accountNumber("1234567890")
                                                .ifscCode("BANK0000001")
                                                .holderName("Test User")
                                                .bankName("Test Bank")
                                                .isPrimary(true)
                                                .build())));

                settings = new SystemSetting();
                settings.setFirstDepositRewardEnabled(true);
                settings.setFirstDepositRewardAmount(new BigDecimal("100.00"));
                settings.setFirstDepositRewardThreshold(new BigDecimal("500.00"));
                settings.setPointsConversionEnabled(true);
                settings.setPointsToCashConversionRate(new BigDecimal("10.00"));

                appProperties = new com.tradex.api.config.AppProperties();
                appProperties.getWallet().setMinWithdrawalAmount(new BigDecimal("100.00"));
                appProperties.getWallet().setMaxWithdrawalAmount(new BigDecimal("50000.00"));

                lenient().when(systemSettingService.getSettings()).thenReturn(settings);
                lenient().when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

                WalletBalanceManager walletBalanceManager = new WalletBalanceManager(userRepository);
                DepositTransactionHandler depositHandler = new DepositTransactionHandler(
                                walletTransactionRepository,
                                adminAuditLogRepository,
                                walletBalanceManager,
                                systemSettingService);
                WithdrawalTransactionHandler withdrawalHandler = new WithdrawalTransactionHandler(
                                walletTransactionRepository,
                                adminAuditLogRepository,
                                walletBalanceManager);

                walletService = new WalletService(
                                userRepository,
                                walletTransactionRepository,
                                walletTransactionHelper,
                                appProperties,
                                walletBalanceManager,
                                List.of(depositHandler, withdrawalHandler));
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
                WalletTransaction pendingTx = new WalletTransaction(user, new BigDecimal("500.00"), BigDecimal.ZERO,
                                WalletTransactionType.DEPOSIT, WalletTransactionStatus.PENDING, "Pending");
                pendingTx.setId(10L);

                when(walletTransactionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(pendingTx));
                when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));
                when(walletTransactionRepository.existsByUserIdAndTypeAndStatus(1L, WalletTransactionType.DEPOSIT,
                                WalletTransactionStatus.SUCCESS)).thenReturn(false);
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
                WalletTransaction pendingTx = new WalletTransaction(user, new BigDecimal("50.00"), BigDecimal.ZERO,
                                WalletTransactionType.DEPOSIT, WalletTransactionStatus.PENDING, "Pending");
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
                WalletTransaction pendingTx = new WalletTransaction(user, new BigDecimal("100.00"),
                                new BigDecimal("100.00"),
                                WalletTransactionType.WITHDRAWAL, WalletTransactionStatus.PENDING, "Pending");
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
                WalletTransaction pendingTx = new WalletTransaction(user, new BigDecimal("100.00"),
                                new BigDecimal("100.00"),
                                WalletTransactionType.WITHDRAWAL, WalletTransactionStatus.PENDING, "Pending");
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

                assertThrows(BadRequestException.class,
                                () -> walletService.withdraw("user@example.com", new BigDecimal("50.00")));
                verify(walletTransactionHelper, times(1)).logFailedTransaction(
                                eq(1L), eq(new BigDecimal("50.00")), eq(BigDecimal.ZERO),
                                eq(WalletTransactionType.WITHDRAWAL),
                                anyString());
        }

        @Test
        @DisplayName("Should fail withdrawal when requested amount exceeds the ₹50,000 maximum limit")
        void testWithdrawAboveMaximumLimit() {
                when(userRepository.findByEmailForUpdate("user@example.com")).thenReturn(Optional.of(user));

                assertThrows(BadRequestException.class,
                                () -> walletService.withdraw("user@example.com", new BigDecimal("60000.00")));
                verify(walletTransactionHelper, times(1)).logFailedTransaction(
                                eq(1L), eq(new BigDecimal("60000.00")), eq(BigDecimal.ZERO),
                                eq(WalletTransactionType.WITHDRAWAL),
                                anyString());
        }

        @Test
        @DisplayName("Should fail withdrawal when user does not have a linked bank account")
        void testWithdrawMissingBankAccount() {
                user.setBankDetails(new java.util.ArrayList<>());
                when(userRepository.findByEmailForUpdate("user@example.com")).thenReturn(Optional.of(user));

                assertThrows(BadRequestException.class,
                                () -> walletService.withdraw("user@example.com", new BigDecimal("100.00")));
                verify(walletTransactionHelper, times(1)).logFailedTransaction(
                                eq(1L), eq(new BigDecimal("100.00")), eq(BigDecimal.ZERO),
                                eq(WalletTransactionType.WITHDRAWAL),
                                anyString());
        }

        @Test
        @DisplayName("Should fail withdrawal when user has insufficient withdrawable balance")
        void testWithdrawInsufficientBalance() {
                user.setWithdrawableBalance(new BigDecimal("10.00"));
                when(userRepository.findByEmailForUpdate("user@example.com")).thenReturn(Optional.of(user));

                assertThrows(BadRequestException.class,
                                () -> walletService.withdraw("user@example.com", new BigDecimal("100.00")));
                verify(walletTransactionHelper, times(1)).logFailedTransaction(
                                eq(1L), eq(new BigDecimal("100.00")), eq(new BigDecimal("10.00")),
                                eq(WalletTransactionType.WITHDRAWAL),
                                anyString());
        }

        @Test
        @DisplayName("Should approve transaction successfully")
        void testApproveTransactionSuccess() {
                WalletTransaction pendingTx = new WalletTransaction(user, new BigDecimal("100.00"), BigDecimal.ZERO,
                                WalletTransactionType.DEPOSIT, WalletTransactionStatus.PENDING, "Pending");
                pendingTx.setId(10L);

                when(walletTransactionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(pendingTx));
                when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));

                WalletTransactionDTO result = walletService.approveTransaction(10L);

                assertNotNull(result);
                assertEquals(WalletTransactionStatus.SUCCESS.name(), result.status());
        }

        @Test
        @DisplayName("Should reject transaction successfully")
        void testRejectTransactionSuccess() {
                WalletTransaction pendingTx = new WalletTransaction(user, new BigDecimal("100.00"), BigDecimal.ZERO,
                                WalletTransactionType.WITHDRAWAL, WalletTransactionStatus.PENDING, "Pending");
                pendingTx.setId(10L);

                when(walletTransactionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(pendingTx));
                when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(user));

                WalletTransactionDTO result = walletService.rejectTransaction(10L, "Incorrect info");

                assertNotNull(result);
                assertEquals(WalletTransactionStatus.FAILED.name(), result.status());
        }
}
