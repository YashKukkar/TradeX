package com.tradex.api.entity;

import jakarta.persistence.*;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.enums.WalletTransactionStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallet_transactions", indexes = {
    @Index(name = "idx_wallet_tx_user_created", columnList = "user_id, created_at DESC"),
    @Index(name = "idx_wallet_tx_type_status_created_at", columnList = "type, status, created_at"),
    @Index(name = "idx_wallet_tx_processed_by_status", columnList = "processed_by_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "balance_after", nullable = false, precision = 19, scale = 4)
    private BigDecimal balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(50)")
    private WalletTransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(50)")
    private WalletTransactionStatus status;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "approved_at")
    @Builder.Default
    private LocalDateTime approvedAt = LocalDateTime.now();

    @Column(length = 255)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_id")
    private User processedBy;

    public WalletTransaction(User user, BigDecimal amount, BigDecimal balanceAfter, WalletTransactionType type, WalletTransactionStatus status, String notes) {
        this.user = user;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.type = type;
        this.status = status;
        this.notes = notes;
        this.createdAt = LocalDateTime.now();
        this.approvedAt = LocalDateTime.now();
    }
}
