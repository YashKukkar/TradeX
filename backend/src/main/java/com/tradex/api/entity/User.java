package com.tradex.api.entity;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import jakarta.persistence.*;
import com.tradex.api.enums.Role;
import lombok.*;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_user_referral_path", columnList = "referral_path")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "referral_code", unique = true)
    private String referralCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referred_by_id")
    private User referredBy;

    @Column(name = "referral_path")
    private String referralPath;

    @Column(name = "points_balance")
    @Builder.Default
    private Long pointsBalance = 0L;

    @Column(name = "withdrawable_balance", nullable = false)
    @Builder.Default
    private BigDecimal withdrawableBalance = BigDecimal.ZERO;

    @Column(name = "bonus_balance", nullable = false)
    @Builder.Default
    private BigDecimal bonusBalance = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(50)")
    @Builder.Default
    private Role role = Role.USER;

    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Column(name = "account_number", length = 20)
    private String accountNumber;

    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "phone_verified", nullable = false)
    @Builder.Default
    private boolean phoneVerified = false;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "locked", nullable = false)
    @Builder.Default
    private boolean locked = false;

    @Column(name = "expired", nullable = false)
    @Builder.Default
    private boolean expired = false;

    @Column(name = "credentials_expired", nullable = false)
    @Builder.Default
    private boolean credentialsExpired = false;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public User(String email, String password) {
        this.email = email;
        this.password = password;
        this.pointsBalance = 0L;
        this.withdrawableBalance = BigDecimal.ZERO;
        this.bonusBalance = BigDecimal.ZERO;
        this.role = Role.USER;
        this.emailVerified = false;
        this.phoneVerified = false;
        this.enabled = true;
        this.locked = false;
        this.expired = false;
        this.credentialsExpired = false;
        this.createdAt = LocalDateTime.now();
    }


}

