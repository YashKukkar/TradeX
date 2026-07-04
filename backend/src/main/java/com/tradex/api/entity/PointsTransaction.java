package com.tradex.api.entity;

import jakarta.persistence.*;
import com.tradex.api.enums.PointsTransactionType;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "points_transactions", indexes = {
    @Index(name = "idx_tx_user_created", columnList = "user_id, created_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointsTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Long amount;

    @Column(name = "balance_after", nullable = false)
    private Long balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(50)")
    private PointsTransactionType type;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(length = 255)
    private String notes;

    public PointsTransaction(User user, Long amount, Long balanceAfter, PointsTransactionType type, String notes) {
        this.user = user;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.type = type;
        this.notes = notes;
        this.createdAt = LocalDateTime.now();
    }
}

