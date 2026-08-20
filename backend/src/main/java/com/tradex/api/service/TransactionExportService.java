package com.tradex.api.service;

import com.tradex.api.entity.PointsTransaction;
import com.tradex.api.entity.WalletTransaction;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import com.tradex.api.util.CsvExportUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionExportService {

    private final WalletTransactionRepository walletTransactionRepository;
    private final PointsTransactionRepository pointsTransactionRepository;

    public TransactionExportService(
            WalletTransactionRepository walletTransactionRepository,
            PointsTransactionRepository pointsTransactionRepository) {
        this.walletTransactionRepository = walletTransactionRepository;
        this.pointsTransactionRepository = pointsTransactionRepository;
    }

    @Transactional(readOnly = true)
    public byte[] generateDepositsCsv(LocalDateTime start, LocalDateTime end) {
        List<WalletTransaction> deposits = (start != null && end != null)
                ? walletTransactionRepository
                        .findByTypeAndCreatedAtBetweenOrderByCreatedAtDesc(WalletTransactionType.DEPOSIT, start, end)
                : walletTransactionRepository.findByTypeOrderByCreatedAtDesc(WalletTransactionType.DEPOSIT);

        StringBuilder sb = new StringBuilder();
        sb.append(
                "Transaction ID,User ID,User Email,Amount (INR),Balance After,Status,Notes / Reference,Approved By Employee,Created At,Approved At\n");

        for (WalletTransaction tx : deposits) {
            sb.append(tx.getId()).append(",");
            sb.append(tx.getUser() != null ? tx.getUser().getId() : "").append(",");
            sb.append(CsvExportUtils.escapeCsv(tx.getUser() != null ? tx.getUser().getEmail() : "")).append(",");
            sb.append(CsvExportUtils.formatDecimal(tx.getAmount())).append(",");
            sb.append(CsvExportUtils.formatDecimal(tx.getBalanceAfter())).append(",");
            sb.append(tx.getStatus() != null ? tx.getStatus().name() : "").append(",");
            sb.append(CsvExportUtils.escapeCsv(tx.getNotes())).append(",");
            sb.append(CsvExportUtils.escapeCsv(tx.getProcessedBy() != null ? tx.getProcessedBy().getEmail() : ""))
                    .append(",");
            sb.append(CsvExportUtils.formatDate(tx.getCreatedAt())).append(",");
            sb.append(CsvExportUtils.formatDate(tx.getApprovedAt())).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Transactional(readOnly = true)
    public byte[] generateWithdrawalsCsv(LocalDateTime start, LocalDateTime end) {
        List<WalletTransaction> withdrawals = (start != null && end != null)
                ? walletTransactionRepository
                        .findByTypeAndCreatedAtBetweenOrderByCreatedAtDesc(WalletTransactionType.WITHDRAWAL, start, end)
                : walletTransactionRepository.findByTypeOrderByCreatedAtDesc(WalletTransactionType.WITHDRAWAL);

        StringBuilder sb = new StringBuilder();
        sb.append(
                "Transaction ID,User ID,User Email,Amount (INR),Balance After,Status,Notes / Payout Details,Approved By Employee,Created At,Approved At\n");

        for (WalletTransaction tx : withdrawals) {
            sb.append(tx.getId()).append(",");
            sb.append(tx.getUser() != null ? tx.getUser().getId() : "").append(",");
            sb.append(CsvExportUtils.escapeCsv(tx.getUser() != null ? tx.getUser().getEmail() : "")).append(",");
            sb.append(CsvExportUtils.formatDecimal(tx.getAmount())).append(",");
            sb.append(CsvExportUtils.formatDecimal(tx.getBalanceAfter())).append(",");
            sb.append(tx.getStatus() != null ? tx.getStatus().name() : "").append(",");
            sb.append(CsvExportUtils.escapeCsv(tx.getNotes())).append(",");
            sb.append(CsvExportUtils.escapeCsv(tx.getProcessedBy() != null ? tx.getProcessedBy().getEmail() : ""))
                    .append(",");
            sb.append(CsvExportUtils.formatDate(tx.getCreatedAt())).append(",");
            sb.append(CsvExportUtils.formatDate(tx.getApprovedAt())).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Transactional(readOnly = true)
    public byte[] generatePointsConversionsCsv(LocalDateTime start, LocalDateTime end) {
        List<PointsTransaction> conversions = (start != null && end != null)
                ? pointsTransactionRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end)
                : pointsTransactionRepository.findAllByOrderByCreatedAtDesc();

        StringBuilder sb = new StringBuilder();
        sb.append(
                "Transaction ID,User ID,User Email,Type,Points Amount,Balance After,Notes / Description,Created At\n");

        for (PointsTransaction tx : conversions) {
            sb.append(tx.getId()).append(",");
            sb.append(tx.getUser() != null ? tx.getUser().getId() : "").append(",");
            sb.append(CsvExportUtils.escapeCsv(tx.getUser() != null ? tx.getUser().getEmail() : "")).append(",");
            sb.append(tx.getType() != null ? tx.getType().name() : "").append(",");
            sb.append(tx.getAmount() != null ? tx.getAmount() : 0).append(",");
            sb.append(tx.getBalanceAfter() != null ? tx.getBalanceAfter() : 0).append(",");
            sb.append(CsvExportUtils.escapeCsv(tx.getNotes())).append(",");
            sb.append(CsvExportUtils.formatDate(tx.getCreatedAt())).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
}
