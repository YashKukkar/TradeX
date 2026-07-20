package com.tradex.api.dto;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

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
    boolean locked,
    List<String> permissions
) {
    public UserDTO(Long id, String email, String referralCode, Long pointsBalance, String referralPath, String referredByEmail, String phoneNumber, String accountNumber) {
        this(id, email, referralCode, pointsBalance, referralPath, referredByEmail, phoneNumber, accountNumber, "USER", System.currentTimeMillis() / 1000, false, false, BigDecimal.ZERO, BigDecimal.ZERO, true, false, Collections.emptyList());
    }

    public UserDTO(Long id, String email, String referralCode, Long pointsBalance, String referralPath, String referredByEmail, String phoneNumber, String accountNumber, String role, Long createdAt) {
        this(id, email, referralCode, pointsBalance, referralPath, referredByEmail, phoneNumber, accountNumber, role, createdAt, false, false, BigDecimal.ZERO, BigDecimal.ZERO, true, false, Collections.emptyList());
    }
}
