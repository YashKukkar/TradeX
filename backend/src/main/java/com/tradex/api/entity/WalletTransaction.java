package com.tradex.api.entity;

import jakarta.persistence.*;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.enums.WalletTransactionStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallet_transactions", indexes = {
    @Index(name = "idx_wallet_tx_user_created", columnList = "user_id, created_at DESC")
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

    @Column(length = 255)
    private String notes;

    public WalletTransaction(User user, BigDecimal amount, BigDecimal balanceAfter, WalletTransactionType type, WalletTransactionStatus status, String notes) {
        this.user = user;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.type = type;
        this.status = status;
        this.notes = notes;
        this.createdAt = LocalDateTime.now();
    }
}
