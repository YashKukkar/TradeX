package com.tradex.api.mapper;

import com.tradex.api.dto.UserDTO;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Permission;
import com.tradex.api.enums.Role;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.Collections;
import java.util.stream.Collectors;

@Component
@SuppressWarnings("null")
public class UserMapper {

    public UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }
        return new UserDTO(
                user.getId(),
                user.getEmail(),
                (user.getRole() == Role.USER) ? user.getReferralCode() : null,
                (user.getRole() == Role.USER) ? user.getPointsBalance() : null,
                (user.getRole() == Role.USER) ? user.getReferralPath() : null,
                (user.getRole() == Role.USER && user.getReferredBy() != null) ? user.getReferredBy().getEmail() : null,
                user.getPhoneNumber(),
                user.getAccountNumber(),
                user.getRole() != null ? user.getRole().name() : "USER",
                user.getCreatedAt() != null
                        ? user.getCreatedAt().atZone(ZoneId.systemDefault()).toEpochSecond()
                        : System.currentTimeMillis() / 1000,
                user.isEmailVerified(),
                user.isPhoneVerified(),
                (user.getRole() == Role.USER)
                        ? (user.getWithdrawableBalance() != null ? user.getWithdrawableBalance() : BigDecimal.ZERO)
                        : null,
                (user.getRole() == Role.USER)
                        ? (user.getBonusBalance() != null ? user.getBonusBalance() : BigDecimal.ZERO)
                        : null,
                user.isEnabled(),
                user.isLocked(),
                user.getPermissions() != null
                        ? user.getPermissions().stream().map(Permission::name).collect(Collectors.toList())
                        : Collections.emptyList());
    }
}
