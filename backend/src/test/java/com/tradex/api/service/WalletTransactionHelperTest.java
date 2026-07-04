package com.tradex.api.service;

import com.tradex.api.entity.User;
import com.tradex.api.entity.WalletTransaction;
import com.tradex.api.enums.WalletTransactionStatus;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class WalletTransactionHelperTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private WalletTransactionRepository walletTransactionRepository;

    @InjectMocks
    private WalletTransactionHelper walletTransactionHelper;

    @Test
    @DisplayName("Should successfully log failed transaction")
    void testLogFailedTransaction() {
        User user = new User("user@example.com", "password");
        user.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        walletTransactionHelper.logFailedTransaction(
                1L,
                new BigDecimal("100.00"),
                new BigDecimal("50.00"),
                WalletTransactionType.WITHDRAWAL,
                "Withdrawal failed: Limit exceeded"
        );

        ArgumentCaptor<WalletTransaction> transactionCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(walletTransactionRepository, times(1)).save(transactionCaptor.capture());

        WalletTransaction savedTx = transactionCaptor.getValue();
        assertEquals(user, savedTx.getUser());
        assertEquals(new BigDecimal("100.00"), savedTx.getAmount());
        assertEquals(new BigDecimal("50.00"), savedTx.getBalanceAfter());
        assertEquals(WalletTransactionType.WITHDRAWAL, savedTx.getType());
        assertEquals(WalletTransactionStatus.FAILED, savedTx.getStatus());
        assertEquals("Withdrawal failed: Limit exceeded", savedTx.getNotes());
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when user is not found")
    void testLogFailedTransactionUserNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                walletTransactionHelper.logFailedTransaction(
                        1L,
                        new BigDecimal("100.00"),
                        BigDecimal.ZERO,
                        WalletTransactionType.WITHDRAWAL,
                        "Test"
                )
        );
        verify(walletTransactionRepository, never()).save(any());
    }
}
