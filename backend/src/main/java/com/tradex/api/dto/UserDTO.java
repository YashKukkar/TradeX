package com.tradex.api.dto;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

public record UserDTO(
    Long id,
    String email,
    String fullName,
    String firstName,
    String referralCode,
    Long pointsBalance,
    String referralPath,
    String referredByEmail,
    String phoneNumber,
    String role,
    Long createdAt,
    boolean emailVerified,
    boolean phoneVerified,
    BigDecimal withdrawableBalance,
    BigDecimal bonusBalance,
    boolean enabled,
    boolean locked,
    List<String> permissions,
    List<String> teams,
    List<BankDetailDTO> bankAccounts,
    List<String> effectivePermissions,
    Long pointsAcquired
) {
    // Compact constructor for minimal contexts (e.g. referral tree nodes)
    public UserDTO(Long id, String email, String referralCode, Long pointsBalance, String referralPath, String referredByEmail, String phoneNumber) {
        this(id, email, null, null, referralCode, pointsBalance, referralPath, referredByEmail, phoneNumber, "USER", System.currentTimeMillis() / 1000, false, false, BigDecimal.ZERO, BigDecimal.ZERO, true, false, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), 0L);
    }

    public UserDTO(Long id, String email, String referralCode, Long pointsBalance, String referralPath, String referredByEmail, String phoneNumber, String role, Long createdAt) {
        this(id, email, null, null, referralCode, pointsBalance, referralPath, referredByEmail, phoneNumber, role, createdAt, false, false, BigDecimal.ZERO, BigDecimal.ZERO, true, false, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), 0L);
    }

    public UserDTO(Long id, String email, String referralCode, Long pointsBalance, String referralPath, String referredByEmail, String phoneNumber, String role, Long createdAt, boolean emailVerified, boolean phoneVerified, BigDecimal withdrawableBalance, BigDecimal bonusBalance, boolean enabled, boolean locked, List<String> permissions) {
        this(id, email, null, null, referralCode, pointsBalance, referralPath, referredByEmail, phoneNumber, role, createdAt, emailVerified, phoneVerified, withdrawableBalance, bonusBalance, enabled, locked, permissions, Collections.emptyList(), Collections.emptyList(), permissions, 0L);
    }
}
