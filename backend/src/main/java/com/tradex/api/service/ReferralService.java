package com.tradex.api.service;

import com.tradex.api.entity.ReferralReward;
import com.tradex.api.enums.ReferralRewardStatus;
import com.tradex.api.entity.User;
import com.tradex.api.entity.SystemSetting;
import com.tradex.api.entity.PointsTransaction;
import com.tradex.api.enums.PointsTransactionType;
import com.tradex.api.repository.ReferralRewardRepository;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.dto.ReferralRewardDTO;
import com.tradex.api.dto.PointsTransactionDTO;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.exception.AppException.*;
import com.tradex.api.util.DataFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.ZoneId;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class ReferralService {

    private final UserRepository userRepository;
    private final ReferralRewardRepository rewardRepository;
    private final SystemSettingService systemSettingService;
    private final PointsTransactionRepository pointsTransactionRepository;

    private static final String REFERRAL_CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final int REFERRAL_CODE_LENGTH = 8;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public String generateUniqueReferralCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(REFERRAL_CODE_LENGTH);
            for (int i = 0; i < REFERRAL_CODE_LENGTH; i++) {
                sb.append(REFERRAL_CODE_CHARS.charAt(SECURE_RANDOM.nextInt(REFERRAL_CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (userRepository.existsByReferralCode(code));
        return code;
    }

    @Transactional
    public void processReferralRewards(Long newUserId) {
        if (newUserId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        User newUser = userRepository.findByIdForUpdate(newUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + newUserId));

        if (rewardRepository.existsByReferredUserId(newUserId)) {
            log.warn("Referral rewards already processed for user ID: {}", newUserId);
            return;
        }

        if (newUser.getReferredBy() == null) {
            return;
        }

        String path = newUser.getReferralPath();
        if (path == null || path.isBlank()) {
            if (newUser.getReferredBy() != null) {
                path = buildReferralPath(newUser);
                newUser.setReferralPath(path);
            } else {
                return;
            }
        }

        log.info("Processing referral rewards for user: {}", newUser.getEmail());

        SystemSetting settings = systemSettingService.getSettings();
        if (!settings.isReferralCoinsEnabled()) {
            return;
        }

        String[] parts = path.split("\\.");
        List<Long> referrerIds = new ArrayList<>();
        for (int i = parts.length - 2; i >= 1; i--) {
            if (!parts[i].isBlank()) {
                referrerIds.add(Long.parseLong(parts[i]));
            }
        }

        if (referrerIds.isEmpty()) {
            return;
        }

        // Lock all referrers in a single batch database query
        List<User> referrers = userRepository.findAllByIdForUpdate(referrerIds);
        Map<Long, User> referrerMap = referrers.stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        if (newUser.getReferredBy() != null && !referrerMap.containsKey(newUser.getReferredBy().getId())) {
            throw new ResourceNotFoundException("User not found: " + newUser.getReferredBy().getId());
        }

        List<ReferralReward> rewardsToSave = new ArrayList<>();
        List<PointsTransaction> transactionsToSave = new ArrayList<>();
        List<User> referrersToSave = new ArrayList<>();

        int level = 1;
        int limitTier = settings.getReferralCoinsLimitTier();

        for (Long referrerId : referrerIds) {
            User referrer = referrerMap.get(referrerId);
            if (referrer == null) {
                continue;
            }

            long points = calculateReferralPoints(level, limitTier, settings);

            if (points == -1L) {
                break;
            }

            ReferralReward reward = new ReferralReward(
                    referrer,
                    newUser,
                    level,
                    points,
                    ReferralRewardStatus.CREDITED);
            rewardsToSave.add(reward);

            long currentBalance = referrer.getPointsBalance() != null ? referrer.getPointsBalance() : 0L;
            long balanceAfter = currentBalance + points;
            referrer.setPointsBalance(balanceAfter);
            referrersToSave.add(referrer);

            PointsTransactionType txType = switch (level) {
                case 1 -> PointsTransactionType.REFERRAL_L1;
                case 2 -> PointsTransactionType.REFERRAL_L2;
                case 3 -> PointsTransactionType.REFERRAL_L3;
                default -> PointsTransactionType.SUBSEQUENT_REFERRAL;
            };

            PointsTransaction refTx = new PointsTransaction(
                    referrer,
                    points,
                    balanceAfter,
                    txType,
                    "Referral reward (Level " + level + ") from " + DataFormatter.maskEmail(newUser.getEmail()));
            transactionsToSave.add(refTx);

            log.info("Awarded {} referral points to {} (Level {})", points, referrer.getEmail(), level);
            level++;
        }

        if (!rewardsToSave.isEmpty()) {
            rewardRepository.saveAll(rewardsToSave);
        }
        if (!transactionsToSave.isEmpty()) {
            pointsTransactionRepository.saveAll(transactionsToSave);
        }
    }

    @Async
    @Transactional
    public void processReferralRewardsAsync(Long newUserId) {
        processReferralRewards(newUserId);
    }

    @Transactional(readOnly = true)
    public List<ReferralRewardDTO> getMyReferrals(String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        return rewardRepository.findByReferrerOrderByCreatedAtDesc(currentUser).stream()
                .map(reward -> {
                    String referredEmail = reward.getReferredUser() != null 
                            ? reward.getReferredUser().getEmail() 
                            : "Unknown";
                    return new ReferralRewardDTO(
                            reward.getId(),
                            DataFormatter.maskEmail(referredEmail),
                            reward.getLevel(),
                            reward.getPointsAwarded(),
                            reward.getStatus().name(),
                            reward.getCreatedAt());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PointsTransactionDTO> getMyTransactions(String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        return pointsTransactionRepository.findByUserOrderByCreatedAtDesc(currentUser).stream()
                .map(tx -> new PointsTransactionDTO(
                        tx.getId(),
                        tx.getAmount(),
                        tx.getBalanceAfter(),
                        tx.getType().name(),
                        tx.getNotes(),
                        tx.getCreatedAt() != null ? tx.getCreatedAt().atZone(ZoneId.systemDefault()).toEpochSecond()
                                : (System.currentTimeMillis() / 1000)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getReferralTree(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String path = normalizeReferralPath(user);

        return userRepository.findByReferralPathStartingWith(path)
                .stream()
                .filter(u -> !u.getId().equals(userId))
                .map(UserDTO::new)
                .toList();
    }

    public String buildReferralPath(User user) {
        if (user.getReferredBy() == null) {
            return "." + user.getId() + ".";
        }

        String parentPath = normalizeReferralPath(user.getReferredBy());

        return parentPath + user.getId() + ".";
    }

    public String normalizeReferralPath(User user) {
        String path = user.getReferralPath();

        if (path == null || path.isBlank()) {
            return "." + user.getId() + ".";
        }

        return path;
    }

    private long calculateReferralPoints(int level, int limitTier, SystemSetting settings) {
        return switch (level) {
            case 1 -> settings.getReferralCoinsL1Amount();
            case 2 -> settings.getReferralCoinsL2Amount();
            case 3 -> settings.getReferralCoinsL3Amount();
            default -> {
                if (level <= limitTier) {
                    yield settings.getReferralCoinsL3Amount();
                }
                if (!settings.isReferralCoinsSubsequentEnabled()) {
                    yield -1L;
                }
                yield settings.getReferralCoinsSubsequentAmount();
            }
        };
    }
}
