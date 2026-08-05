package com.tradex.api.mapper;

import com.tradex.api.dto.BankDetailDTO;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.repository.TeamRepository;

import java.util.HashSet;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    private final TeamRepository teamRepository;
    private final PointsTransactionRepository pointsTransactionRepository;

    public UserMapper(TeamRepository teamRepository, PointsTransactionRepository pointsTransactionRepository) {
        this.teamRepository = teamRepository;
        this.pointsTransactionRepository = pointsTransactionRepository;
    }

    public UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }

        Set<String> effective = getEffectivePermissions(user);

        Long pointsAcquired = 0L;
        if (user.getRole() == Role.USER) {
            pointsAcquired = pointsTransactionRepository.sumPositivePointsByUser(user);
        }

        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getFirstName(),
                (user.getRole() == Role.USER) ? user.getReferralCode() : null,
                (user.getRole() == Role.USER) ? user.getPointsBalance() : null,
                (user.getRole() == Role.USER) ? user.getReferralPath() : null,
                (user.getRole() == Role.USER && user.getReferredBy() != null) ? user.getReferredBy().getEmail() : null,
                user.getPhoneNumber(),
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
                        ? new java.util.ArrayList<>(user.getPermissions())
                        : Collections.emptyList(),
                user.getTeams() != null
                        ? new java.util.ArrayList<>(user.getTeams())
                        : Collections.emptyList(),
                user.getBankDetails() != null
                        ? user.getBankDetails().stream().map(b -> new BankDetailDTO(b.getId(), b.getAccountNumber(), b.getIfscCode(), b.getHolderName(), b.getBankName(), b.isPrimary())).collect(Collectors.toList())
                        : Collections.emptyList(),
                new java.util.ArrayList<>(effective),
                pointsAcquired);
    }

    public Set<String> getEffectivePermissions(User user) {
        Set<String> effective = new HashSet<>();
        if (user.getPermissions() != null) {
            effective.addAll(user.getPermissions());
        }
        if (user.getTeams() != null && !user.getTeams().isEmpty()) {
            for (String teamName : user.getTeams()) {
                teamRepository.findByName(teamName).ifPresent(t -> {
                    if (t.getPermissions() != null) {
                        effective.addAll(t.getPermissions());
                    }
                });
            }
        }
        return effective;
    }
}
