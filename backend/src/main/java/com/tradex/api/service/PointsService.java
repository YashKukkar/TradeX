package com.tradex.api.service;

import com.tradex.api.dto.WalletTransactionDTO;
import com.tradex.api.entity.*;
import com.tradex.api.enums.*;
import com.tradex.api.exception.AppException.BadRequestException;
import com.tradex.api.exception.AppException.ForbiddenException;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import com.tradex.api.repository.AdminAuditLogRepository;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Slf4j
public class PointsService {

    private final UserRepository userRepository;
    private final SystemSettingService systemSettingService;
    private final WalletBalanceManager walletBalanceManager;
    private final PointsTransactionRepository pointsTransactionRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;

    @Transactional
    public WalletTransactionDTO convertPoints(String email, Long points) {
        if (points == null || points <= 0) {
            throw new BadRequestException("Points to convert must be greater than zero");
        }

        SystemSetting settings = systemSettingService.getSettings();
        if (!settings.isPointsConversionEnabled()) {
            throw new ForbiddenException("Points conversion is currently disabled by system configuration");
        }

        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (user.getRole() == Role.EMPLOYEE || user.getRole() == Role.SUPER_ADMIN) {
            throw new ForbiddenException("This operation is only available to customers");
        }

        Long currentPoints = user.getPointsBalance();
        if (currentPoints < points) {
            throw new BadRequestException("Insufficient TradeX Points balance");
        }

        BigDecimal rate = settings.getPointsToCashConversionRate();
        if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Invalid points-to-cash conversion rate setting");
        }

        BigDecimal cashAwarded = new BigDecimal(points)
                .divide(rate, 4, RoundingMode.HALF_UP);

        Long newPoints = currentPoints - points;
        user.setPointsBalance(newPoints);

        user = walletBalanceManager.mutateBonusBalance(user, cashAwarded);
        BigDecimal newBonus = user.getBonusBalance();

        PointsTransaction pointsTx = new PointsTransaction(
                user,
                -points,
                newPoints,
                PointsTransactionType.CONVERT_TO_CASH,
                "Converted " + points + " points to bonus cash");
        pointsTransactionRepository.save(pointsTx);

        WalletTransaction walletTx = new WalletTransaction(
                user,
                cashAwarded,
                newBonus,
                WalletTransactionType.POINTS_CONVERSION,
                WalletTransactionStatus.SUCCESS,
                "Converted " + points + " TradeX Points into bonus cash");
        walletTx.setApprovedAt(java.time.LocalDateTime.now());
        walletTransactionRepository.save(walletTx);

        AdminAuditLog auditLog = new AdminAuditLog(
                user,
                user,
                AdminAction.POINTS_CONVERSION,
                "Converted " + points + " points to ₹" + cashAwarded.setScale(2, RoundingMode.HALF_UP) + " bonus cash"
        );
        adminAuditLogRepository.save(auditLog);

        log.info("Converted {} points to {} bonus cash for user {}", points, cashAwarded, email);

        return new WalletTransactionDTO(walletTx);
    }
}
