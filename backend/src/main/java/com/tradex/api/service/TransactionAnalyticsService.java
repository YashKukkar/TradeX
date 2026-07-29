package com.tradex.api.service;

import com.tradex.api.enums.WalletTransactionStatus;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionAnalyticsService {

    private final WalletTransactionRepository walletTransactionRepository;

    public record TransactionAnalytics(
        BigDecimal totalDeposits,
        long totalDepositsCount,
        BigDecimal totalWithdrawals,
        long totalWithdrawalsCount,
        long pendingDepositsCount,
        BigDecimal pendingDepositsAmount,
        long pendingWithdrawalsCount,
        BigDecimal pendingWithdrawalsAmount
    ) {}

    @Transactional(readOnly = true)
    @Cacheable(value = "transactionStats", key = "{#start, #end}")
    public TransactionAnalytics getTransactionAnalytics(LocalDateTime start, LocalDateTime end) {
        return new TransactionAnalytics(
            sumSuccessAmount(WalletTransactionType.DEPOSIT, start, end),
            countSuccessTx(WalletTransactionType.DEPOSIT, start, end),
            sumSuccessAmount(WalletTransactionType.WITHDRAWAL, start, end),
            countSuccessTx(WalletTransactionType.WITHDRAWAL, start, end),
            countPendingTx(WalletTransactionType.DEPOSIT),
            sumPendingAmount(WalletTransactionType.DEPOSIT),
            countPendingTx(WalletTransactionType.WITHDRAWAL),
            sumPendingAmount(WalletTransactionType.WITHDRAWAL)
        );
    }

    @Transactional(readOnly = true)
    public BigDecimal sumSuccessAmount(WalletTransactionType type, LocalDateTime start, LocalDateTime end) {
        return walletTransactionRepository.sumAmountByTypeAndStatusAndCreatedAtBetween(
                type, WalletTransactionStatus.SUCCESS, start, end);
    }

    @Transactional(readOnly = true)
    public long countSuccessTx(WalletTransactionType type, LocalDateTime start, LocalDateTime end) {
        return walletTransactionRepository.countByTypeAndStatusAndCreatedAtBetween(
                type, WalletTransactionStatus.SUCCESS, start, end);
    }

    @Transactional(readOnly = true)
    public long countPendingTx(WalletTransactionType type) {
        return walletTransactionRepository.countByTypeAndStatus(type, WalletTransactionStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public BigDecimal sumPendingAmount(WalletTransactionType type) {
        return walletTransactionRepository.sumAmountByTypeAndStatus(type, WalletTransactionStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionRepository.EmployeeWalletPerformanceProjection> getEmployeeWalletPerformance(LocalDateTime start, LocalDateTime end) {
        return walletTransactionRepository.getEmployeeWalletPerformance(WalletTransactionStatus.SUCCESS, start, end);
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionRepository.EmployeeTxProcessingTimeProjection> getEmployeeTxProcessingTimes(LocalDateTime start, LocalDateTime end) {
        return walletTransactionRepository.getEmployeeTxProcessingTimes(WalletTransactionStatus.SUCCESS, start, end);
    }
}
