package com.tradex.api.service;

import com.tradex.api.entity.User;
import com.tradex.api.entity.WalletTransaction;
import com.tradex.api.enums.WalletTransactionStatus;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.exception.AppException.BadRequestException;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Not @Transactional on purpose: withdraw() must commit its own FAILED audit row even though the
 * request is rejected. (A REQUIRES_NEW audit insert deadlocked on the user row lock under MySQL.)
 */
@SpringBootTest
@Sql("/test-data.sql")
class WalletWithdrawalFailureIntegrationTest {

    @Autowired
    private WalletService walletService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Test
    void rejectedWithdrawalIsRecordedAsFailedAndBalanceIsUntouched() {
        User user = userRepository.findByEmail("root@example.com").orElseThrow();
        BigDecimal balanceBefore = user.getWithdrawableBalance();

        assertThrows(BadRequestException.class,
                () -> walletService.withdraw("root@example.com", new BigDecimal("1.00"), "fail-audit-1"));

        List<WalletTransaction> txs = walletTransactionRepository.findByUserOrderByCreatedAtDesc(user);
        assertTrue(txs.stream().anyMatch(t -> t.getType() == WalletTransactionType.WITHDRAWAL
                && t.getStatus() == WalletTransactionStatus.FAILED), "FAILED audit row must be committed");
        assertTrue(txs.stream().noneMatch(t -> t.getStatus() == WalletTransactionStatus.PENDING));
        assertEquals(0, balanceBefore.compareTo(
                userRepository.findByEmail("root@example.com").orElseThrow().getWithdrawableBalance()));
    }
}
