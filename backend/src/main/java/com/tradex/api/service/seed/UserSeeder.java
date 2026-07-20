package com.tradex.api.service.seed;

import com.tradex.api.config.AppProperties;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.service.ReferralService;
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
public class UserSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ReferralService referralService;
    private final AppProperties appProperties;

    public record SeedUserConfig(
            String email,
            Long points,
            String referralCode,
            int parentIndex, // Index of parent in seededUsers list (-1 if none)
            int daysAgo,
            String phone,
            String accountNumber
    ) {}

    public static final List<SeedUserConfig> SEED_USER_CONFIGS = List.of(
            new SeedUserConfig("u1@test.com", 1800L, "U1REFCODE", -1, 10, "+919999999901", "ACCU101"),
            new SeedUserConfig("u2@test.com", 1700L, "U2REFCODE", 0, 8, "+919999999902", "ACCU102"),
            new SeedUserConfig("u3@test.com", 1500L, "U3REFCODE", 1, 5, "+919999999903", "ACCU103"),
            new SeedUserConfig("u4@test.com", 1000L, "U4REFCODE", 2, 2, "+919999999904", "ACCU104")
    );

    @Transactional
    public List<User> seedUsers() {
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
        log.info("Test users seeded successfully");
        return seededUsers;
    }
}
