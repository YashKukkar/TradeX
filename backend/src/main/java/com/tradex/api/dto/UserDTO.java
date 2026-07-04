package com.tradex.api.dto;

import com.tradex.api.entity.User;
import java.time.ZoneId;
import java.math.BigDecimal;

public record UserDTO(
    Long id,
    String email,
    String referralCode,
    Long pointsBalance,
    String referralPath,
    String referredByEmail,
    String phoneNumber,
    String accountNumber,
    String role,
    Long createdAt,
    boolean emailVerified,
    boolean phoneVerified,
    BigDecimal withdrawableBalance,
    BigDecimal bonusBalance,
    boolean enabled,
    boolean locked
) {
    public UserDTO(User user) {
        this(
            user.getId(),
            user.getEmail(),
            user.getReferralCode(),
            user.getPointsBalance(),
            user.getReferralPath(),
            user.getReferredBy() != null ? user.getReferredBy().getEmail() : null,
            user.getPhoneNumber(),
            user.getAccountNumber(),
            user.getRole() != null ? user.getRole().name() : "USER",
            user.getCreatedAt() != null
                ? user.getCreatedAt().atZone(ZoneId.systemDefault()).toEpochSecond()
                : System.currentTimeMillis() / 1000,
            user.isEmailVerified(),
            user.isPhoneVerified(),
            user.getWithdrawableBalance() != null ? user.getWithdrawableBalance() : BigDecimal.ZERO,
            user.getBonusBalance() != null ? user.getBonusBalance() : BigDecimal.ZERO,
            user.isEnabled(),
            user.isLocked()
        );
    }

    public UserDTO(Long id, String email, String referralCode, Long pointsBalance, String referralPath, String referredByEmail, String phoneNumber, String accountNumber) {
        this(id, email, referralCode, pointsBalance, referralPath, referredByEmail, phoneNumber, accountNumber, "USER", System.currentTimeMillis() / 1000, false, false, BigDecimal.ZERO, BigDecimal.ZERO, true, false);
    }

    public UserDTO(Long id, String email, String referralCode, Long pointsBalance, String referralPath, String referredByEmail, String phoneNumber, String accountNumber, String role, Long createdAt) {
        this(id, email, referralCode, pointsBalance, referralPath, referredByEmail, phoneNumber, accountNumber, role, createdAt, false, false, BigDecimal.ZERO, BigDecimal.ZERO, true, false);
    }
}

