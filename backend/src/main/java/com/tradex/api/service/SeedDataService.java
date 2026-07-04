package com.tradex.api.service;

import com.tradex.api.entity.*;
import com.tradex.api.enums.*;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.repository.ReferralRewardRepository;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.VerificationTokenRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import com.tradex.api.repository.AdminAuditLogRepository;
import com.tradex.api.util.DataFormatter;
import com.tradex.api.config.AppProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class SeedDataService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ReferralService referralService;
    private final PointsTransactionRepository pointsTransactionRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final ReferralRewardRepository referralRewardRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final AppProperties appProperties;

    private record SeedUserConfig(
            String email,
            Long points,
            String referralCode,
            int parentIndex, // Index of parent in seededUsers list (-1 if none)
            int daysAgo,
            String phone,
            String accountNumber
    ) {}

    private static final List<SeedUserConfig> SEED_USER_CONFIGS = List.of(
            new SeedUserConfig("u1@test.com", 1800L, "U1REFCODE", -1, 10, "+919999999901", "ACCU101"),
            new SeedUserConfig("u2@test.com", 1700L, "U2REFCODE", 0, 8, "+919999999902", "ACCU102"),
            new SeedUserConfig("u3@test.com", 1500L, "U3REFCODE", 1, 5, "+919999999903", "ACCU103"),
            new SeedUserConfig("u4@test.com", 1000L, "U4REFCODE", 2, 2, "+919999999904", "ACCU104")
    );

    private static final List<String> CLEANUP_EMAILS = List.of(
            "u1@test.com",
            "u2@test.com",
            "u3@test.com",
            "u4@test.com",
            "u5@test.com"
    );

    @Transactional
    public void seedTestData() {
        log.info("Starting database seed process");

        cleanupTestUsers();

        String encodedPassword = passwordEncoder.encode(appProperties.getSeed().getDefaultPassword());
        LocalDateTime now = LocalDateTime.now();

        List<User> seededUsers = new ArrayList<>();
        for (SeedUserConfig config : SEED_USER_CONFIGS) {
            User referrer = config.parentIndex() >= 0 ? seededUsers.get(config.parentIndex()) : null;
            LocalDateTime createdAt = now.minusDays(config.daysAgo());

            User user = User.builder()
                    .email(config.email())
                    .password(encodedPassword)
                    .pointsBalance(config.points())
                    .referralCode(config.referralCode())
                    .referredBy(referrer)
                    .role(Role.USER)
                    .emailVerified(true)
                    .phoneVerified(true)
                    .phoneNumber(config.phone())
                    .accountNumber(config.accountNumber())
                    .createdAt(createdAt)
                    .build();

            user = userRepository.save(user);
            user.setReferralPath(referralService.buildReferralPath(user));
            seededUsers.add(user);
        }

        userRepository.saveAll(seededUsers);

        List<PointsTransaction> transactions = seededUsers.stream()
                .map(user -> PointsTransaction.builder()
                        .user(user)
                        .amount(appProperties.getSeed().getWelcomeBonus())
                        .balanceAfter(appProperties.getSeed().getWelcomeBonus())
                        .type(PointsTransactionType.WELCOME_BONUS)
                        .notes("Welcome bonus")
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();

        List<PointsTransaction> allTransactions = new ArrayList<>(transactions);
        List<ReferralReward> referralRewards = new ArrayList<>();

        User u1 = seededUsers.get(0);
        User u2 = seededUsers.get(1);
        User u3 = seededUsers.get(2);
        User u4 = seededUsers.get(3);

        // -- Referral u2 (referred by u1) --
        referralRewards.add(ReferralReward.builder()
                .referrer(u1)
                .referredUser(u2)
                .level(1)
                .pointsAwarded(500L)
                .status(ReferralRewardStatus.CREDITED)
                .createdAt(u2.getCreatedAt())
                .build());
        allTransactions.add(PointsTransaction.builder()
                .user(u1)
                .amount(500L)
                .balanceAfter(1500L)
                .type(PointsTransactionType.REFERRAL_L1)
                .notes("Referral reward (Level 1) from " + DataFormatter.maskEmail(u2.getEmail()))
                .createdAt(u2.getCreatedAt())
                .build());

        // -- Referral u3 (referred by u2) --
        referralRewards.add(ReferralReward.builder()
                .referrer(u2)
                .referredUser(u3)
                .level(1)
                .pointsAwarded(500L)
                .status(ReferralRewardStatus.CREDITED)
                .createdAt(u3.getCreatedAt())
                .build());
        allTransactions.add(PointsTransaction.builder()
                .user(u2)
                .amount(500L)
                .balanceAfter(1500L)
                .type(PointsTransactionType.REFERRAL_L1)
                .notes("Referral reward (Level 1) from " + com.tradex.api.util.DataFormatter.maskEmail(u3.getEmail()))
                .createdAt(u3.getCreatedAt())
                .build());

        referralRewards.add(ReferralReward.builder()
                .referrer(u1)
                .referredUser(u3)
                .level(2)
                .pointsAwarded(200L)
                .status(ReferralRewardStatus.CREDITED)
                .createdAt(u3.getCreatedAt())
                .build());
        allTransactions.add(PointsTransaction.builder()
                .user(u1)
                .amount(200L)
                .balanceAfter(1700L)
                .type(PointsTransactionType.REFERRAL_L2)
                .notes("Referral reward (Level 2) from " + com.tradex.api.util.DataFormatter.maskEmail(u3.getEmail()))
                .createdAt(u3.getCreatedAt())
                .build());

        // -- Referral u4 (referred by u3) --
        referralRewards.add(ReferralReward.builder()
                .referrer(u3)
                .referredUser(u4)
                .level(1)
                .pointsAwarded(500L)
                .status(ReferralRewardStatus.CREDITED)
                .createdAt(u4.getCreatedAt())
                .build());
        allTransactions.add(PointsTransaction.builder()
                .user(u3)
                .amount(500L)
                .balanceAfter(1500L)
                .type(PointsTransactionType.REFERRAL_L1)
                .notes("Referral reward (Level 1) from " + com.tradex.api.util.DataFormatter.maskEmail(u4.getEmail()))
                .createdAt(u4.getCreatedAt())
                .build());

        referralRewards.add(ReferralReward.builder()
                .referrer(u2)
                .referredUser(u4)
                .level(2)
                .pointsAwarded(200L)
                .status(ReferralRewardStatus.CREDITED)
                .createdAt(u4.getCreatedAt())
                .build());
        allTransactions.add(PointsTransaction.builder()
                .user(u2)
                .amount(200L)
                .balanceAfter(1700L)
                .type(PointsTransactionType.REFERRAL_L2)
                .notes("Referral reward (Level 2) from " + com.tradex.api.util.DataFormatter.maskEmail(u4.getEmail()))
                .createdAt(u4.getCreatedAt())
                .build());

        referralRewards.add(ReferralReward.builder()
                .referrer(u1)
                .referredUser(u4)
                .level(3)
                .pointsAwarded(100L)
                .status(ReferralRewardStatus.CREDITED)
                .createdAt(u4.getCreatedAt())
                .build());
        allTransactions.add(PointsTransaction.builder()
                .user(u1)
                .amount(100L)
                .balanceAfter(1800L)
                .type(PointsTransactionType.REFERRAL_L3)
                .notes("Referral reward (Level 3) from " + com.tradex.api.util.DataFormatter.maskEmail(u4.getEmail()))
                .createdAt(u4.getCreatedAt())
                .build());

        referralRewardRepository.saveAll(referralRewards);
        pointsTransactionRepository.saveAll(allTransactions);

        log.info("Database seed completed successfully");
    }

    private void cleanupTestUsers() {
        List<User> existingUsers = new ArrayList<>();
        for (String email : CLEANUP_EMAILS) {
            userRepository.findByEmail(email).ifPresent(existingUsers::add);
        }

        if (existingUsers.isEmpty()) {
            return;
        }

        verificationTokenRepository.deleteByUserIn(existingUsers);
        adminAuditLogRepository.deleteByActorInOrTargetIn(existingUsers);
        pointsTransactionRepository.deleteByUserIn(existingUsers);
        walletTransactionRepository.deleteByUserIn(existingUsers);
        referralRewardRepository.deleteByReferrerOrReferredUserIn(existingUsers);

        existingUsers.forEach(user -> user.setReferredBy(null));

        userRepository.saveAll(existingUsers);
        userRepository.deleteAll(existingUsers);
        userRepository.flush();

        log.info("Old test users cleaned successfully");
    }
}

