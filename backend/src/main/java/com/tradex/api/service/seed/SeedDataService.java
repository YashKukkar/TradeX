package com.tradex.api.service.seed;

import com.tradex.api.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeedDataService {

    private final CleanupService cleanupService;
    private final UserSeeder userSeeder;
    private final ReferralSeeder referralSeeder;
    private final TransactionSeeder transactionSeeder;
    private final SupportTicketSeeder supportTicketSeeder;

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

        cleanupService.cleanupTestUsers(CLEANUP_EMAILS);

        List<User> seededUsers = userSeeder.seedUsers();

        referralSeeder.seedReferralRewards(seededUsers);

        transactionSeeder.seedTransactions(seededUsers);

        supportTicketSeeder.seedSupportTicket(seededUsers);

        log.info("Database seed completed successfully");
    }
}
