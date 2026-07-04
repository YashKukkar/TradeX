package com.tradex.api.entity;

import jakarta.persistence.*;
import com.tradex.api.enums.VerificationType;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "verification_tokens", uniqueConstraints = {
        @UniqueConstraint(name = "uc_verification_user_type", columnNames = {"user_id", "type"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(50)")
    private VerificationType type;

    @Column(name = "expiry_time", nullable = false)
    private LocalDateTime expiryTime;

    @Column(nullable = false)
    private int attempts = 0;

    public VerificationToken(
            User user,
            String token,
            VerificationType type,
            LocalDateTime expiryTime) {
        this.user = user;
        this.token = token;
        this.type = type;
        this.expiryTime = expiryTime;
        this.attempts = 0;
    }

    public boolean isExpired() {
        return expiryTime.isBefore(LocalDateTime.now());
    }

    public boolean isBlocked(int maxAttempts) {
        return attempts >= maxAttempts;
    }

    public void incrementAttempts() {
        attempts++;
    }
}
