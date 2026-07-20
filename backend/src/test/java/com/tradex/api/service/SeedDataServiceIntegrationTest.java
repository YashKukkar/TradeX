package com.tradex.api.service;

import com.tradex.api.entity.*;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.repository.ReferralRewardRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import com.tradex.api.service.seed.SeedDataService;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class SeedDataServiceIntegrationTest {

    @Autowired
    private SeedDataService seedDataService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PointsTransactionRepository pointsTransactionRepository;

    @Autowired
    private ReferralRewardRepository referralRewardRepository;

    @Test
    @SuppressWarnings("null")
    void testSeedTestDataIntegrity() {
        // Run seed
        seedDataService.seedTestData();

        // 1. Verify users exist with correct balances
        User u1 = userRepository.findByEmail("u1@test.com").orElseThrow();
        User u2 = userRepository.findByEmail("u2@test.com").orElseThrow();
        User u3 = userRepository.findByEmail("u3@test.com").orElseThrow();
        User u4 = userRepository.findByEmail("u4@test.com").orElseThrow();

        assertEquals(1800L, u1.getPointsBalance());
        assertEquals(1700L, u2.getPointsBalance());
        assertEquals(1500L, u3.getPointsBalance());
        assertEquals(1000L, u4.getPointsBalance());

        // 2. Verify points transactions are populated and match balances
        List<PointsTransaction> u1Txs = pointsTransactionRepository.findByUserOrderByCreatedAtDesc(u1);
        // Welcome bonus (1000) + Referral L1 (500) + Referral L2 (200) + Referral L3
        // (100) = 4 transactions
        assertEquals(4, u1Txs.size());
        assertEquals(1800L, u1Txs.stream().mapToLong(PointsTransaction::getAmount).sum());

        List<PointsTransaction> u2Txs = pointsTransactionRepository.findByUserOrderByCreatedAtDesc(u2);
        // Welcome bonus (1000) + Referral L1 (500) + Referral L2 (200) = 3 transactions
        assertEquals(3, u2Txs.size());
        assertEquals(1700L, u2Txs.stream().mapToLong(PointsTransaction::getAmount).sum());

        List<PointsTransaction> u3Txs = pointsTransactionRepository.findByUserOrderByCreatedAtDesc(u3);
        // Welcome bonus (1000) + Referral L1 (500) = 2 transactions
        assertEquals(2, u3Txs.size());
        assertEquals(1500L, u3Txs.stream().mapToLong(PointsTransaction::getAmount).sum());

        List<PointsTransaction> u4Txs = pointsTransactionRepository.findByUserOrderByCreatedAtDesc(u4);
        // Welcome bonus (1000) = 1 transaction
        assertEquals(1, u4Txs.size());
        assertEquals(1000L, u4Txs.stream().mapToLong(PointsTransaction::getAmount).sum());

        // 3. Verify referral rewards are populated
        List<ReferralReward> u1Rewards = referralRewardRepository.findByReferrerOrderByCreatedAtDesc(u1);
        assertEquals(3, u1Rewards.size()); // Referred u2 (L1), u3 (L2), u4 (L3)

        List<ReferralReward> u2Rewards = referralRewardRepository.findByReferrerOrderByCreatedAtDesc(u2);
        assertEquals(2, u2Rewards.size()); // Referred u3 (L1), u4 (L2)

        List<ReferralReward> u3Rewards = referralRewardRepository.findByReferrerOrderByCreatedAtDesc(u3);
        assertEquals(1, u3Rewards.size()); // Referred u4 (L1)

        List<ReferralReward> u4Rewards = referralRewardRepository.findByReferrerOrderByCreatedAtDesc(u4);
        assertEquals(0, u4Rewards.size());
    }
}
