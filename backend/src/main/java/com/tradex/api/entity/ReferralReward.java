package com.tradex.api.entity;

import jakarta.persistence.*;
import com.tradex.api.enums.ReferralRewardStatus;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "referral_rewards", indexes = {
    @Index(name = "idx_reward_referrer_created", columnList = "referrer_id, created_at DESC")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_referred_user_level", columnNames = {"referred_user_id", "level"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReferralReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referrer_id", nullable = false)
    private User referrer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referred_user_id", nullable = false)
    private User referredUser;

    @Column(nullable = false)
    private Integer level;

    @Column(name = "points_awarded", nullable = false)
    private Long pointsAwarded;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(50)")
    private ReferralRewardStatus status;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public ReferralReward(User referrer, User referredUser, Integer level, Long pointsAwarded, ReferralRewardStatus status) {
        this.referrer = referrer;
        this.referredUser = referredUser;
        this.level = level;
        this.pointsAwarded = pointsAwarded;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }
}

