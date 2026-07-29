package com.tradex.api.service.seed;

import com.tradex.api.config.AppProperties;
import com.tradex.api.entity.BankDetail;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.service.ReferralService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class UserSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ReferralService referralService;
    private final AppProperties appProperties;

    public record SeedUserConfig(
            String email,
            Long points,
            String referralCode,
            int parentIndex,
            int daysAgo,
            int hoursOffset,   // hour-of-day the user registered (0-23)
            int minutesOffset, // minute within that hour
            String phone,
            String accountNumber,
            BigDecimal withdrawableBalance,
            BigDecimal bonusBalance
    ) {}

    public static final List<SeedUserConfig> SEED_USER_CONFIGS = List.of(
            // email,       points, refCode,     parentIdx, daysAgo, hour, min,  phone,            account,    withdrawable,              bonus
            new SeedUserConfig("u1@test.com", 1800L, "U1REFCODE", -1, 10,  9, 14, "+919999999901", "ACCU101",
                    new BigDecimal("12500.00"), new BigDecimal("800.00")),
            new SeedUserConfig("u2@test.com", 1800L, "U2REFCODE",  0,  8, 14, 33, "+919999999902", "ACCU102",
                    new BigDecimal("4750.00"),  new BigDecimal("200.00")),
            new SeedUserConfig("u3@test.com", 1700L, "U3REFCODE",  1,  5, 11,  5, "+919999999903", "ACCU103",
                    new BigDecimal("2000.00"),  BigDecimal.ZERO),
            new SeedUserConfig("u4@test.com", 1500L, "U4REFCODE",  2,  2, 18, 48, "+919999999904", "ACCU104",
                    new BigDecimal("500.00"),   BigDecimal.ZERO),
            new SeedUserConfig("u5@test.com", 1000L, "U5REFCODE",  3,  1, 10, 21, "+919999999905", "ACCU105",
                    BigDecimal.ZERO, BigDecimal.ZERO)
    );

    @Transactional
    public List<User> seedUsers() {
        String encodedPassword = passwordEncoder.encode(appProperties.getSeed().getDefaultPassword());
        LocalDateTime now = LocalDateTime.now();

        List<User> seededUsers = new ArrayList<>();
        for (SeedUserConfig config : SEED_USER_CONFIGS) {
            User referrer = config.parentIndex() >= 0 ? seededUsers.get(config.parentIndex()) : null;
            // Pin each user to a specific hour:minute so timestamps look natural, not all seeded at the same second
            LocalDateTime createdAt = now
                    .minusDays(config.daysAgo())
                    .withHour(config.hoursOffset())
                    .withMinute(config.minutesOffset())
                    .withSecond(0)
                    .withNano(0);

            User user = User.builder()
                    .email(config.email())
                    .password(encodedPassword)
                    .pointsBalance(config.points())
                    .withdrawableBalance(config.withdrawableBalance())
                    .bonusBalance(config.bonusBalance())
                    .referralCode(config.referralCode())
                    .referredBy(referrer)
                    .role(Role.USER)
                    .emailVerified(true)
                    .phoneVerified(true)
                    .phoneNumber(config.phone())
                    .createdAt(createdAt)
                    .build();

            if (config.accountNumber() != null) {
                String prefix = config.email().split("@")[0];
                String displayHolderName = prefix.substring(0, 1).toUpperCase() + prefix.substring(1) + " User";

                BankDetail bank = BankDetail.builder()
                        .user(user)
                        .accountNumber(config.accountNumber())
                        .ifscCode("TEMP0123456")
                        .holderName(displayHolderName)
                        .bankName("Default Seeder Bank")
                        .isPrimary(true)
                        .build();
                user.setBankDetails(new java.util.ArrayList<>(java.util.List.of(bank)));
            }

            user = userRepository.save(user);
            user.setReferralPath(referralService.buildReferralPath(user));
            seededUsers.add(user);
        }

        userRepository.saveAll(seededUsers);
        log.info("Test users seeded successfully");
        return seededUsers;
    }
}
