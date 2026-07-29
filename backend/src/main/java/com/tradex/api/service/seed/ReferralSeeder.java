package com.tradex.api.service.seed;

import com.tradex.api.entity.ReferralReward;
import com.tradex.api.entity.User;
import com.tradex.api.enums.ReferralRewardStatus;
import com.tradex.api.repository.ReferralRewardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReferralSeeder {

    private final ReferralRewardRepository referralRewardRepository;

    @Transactional
    public List<ReferralReward> seedReferralRewards(List<User> seededUsers) {
        List<ReferralReward> referralRewards = new ArrayList<>();

        User u1 = seededUsers.get(0);
        User u2 = seededUsers.get(1);
        User u3 = seededUsers.get(2);
        User u4 = seededUsers.get(3);
        User u5 = seededUsers.get(4);

        // -- Referral u2 (referred by u1) --
        referralRewards.add(ReferralReward.builder()
                .referrer(u1)
                .referredUser(u2)
                .level(1)
                .pointsAwarded(500L)
                .status(ReferralRewardStatus.CREDITED)
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

        referralRewards.add(ReferralReward.builder()
                .referrer(u1)
                .referredUser(u3)
                .level(2)
                .pointsAwarded(200L)
                .status(ReferralRewardStatus.CREDITED)
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

        referralRewards.add(ReferralReward.builder()
                .referrer(u2)
                .referredUser(u4)
                .level(2)
                .pointsAwarded(200L)
                .status(ReferralRewardStatus.CREDITED)
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

        // -- Referral u5 (referred by u4) --
        referralRewards.add(ReferralReward.builder()
                .referrer(u4)
                .referredUser(u5)
                .level(1)
                .pointsAwarded(500L)
                .status(ReferralRewardStatus.CREDITED)
                .createdAt(u5.getCreatedAt())
                .build());

        referralRewards.add(ReferralReward.builder()
                .referrer(u3)
                .referredUser(u5)
                .level(2)
                .pointsAwarded(200L)
                .status(ReferralRewardStatus.CREDITED)
                .createdAt(u5.getCreatedAt())
                .build());

        referralRewards.add(ReferralReward.builder()
                .referrer(u2)
                .referredUser(u5)
                .level(3)
                .pointsAwarded(100L)
                .status(ReferralRewardStatus.CREDITED)
                .createdAt(u5.getCreatedAt())
                .build());

        referralRewardRepository.saveAll(referralRewards);
        return referralRewards;
    }
}
