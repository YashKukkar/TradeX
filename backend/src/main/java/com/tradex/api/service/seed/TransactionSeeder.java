package com.tradex.api.service.seed;

import com.tradex.api.config.AppProperties;
import com.tradex.api.entity.PointsTransaction;
import com.tradex.api.entity.User;
import com.tradex.api.enums.PointsTransactionType;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.util.DataFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionSeeder {

    private final PointsTransactionRepository pointsTransactionRepository;
    private final AppProperties appProperties;

    @Transactional
    public void seedTransactions(List<User> seededUsers) {
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

        User u1 = seededUsers.get(0);
        User u2 = seededUsers.get(1);
        User u3 = seededUsers.get(2);
        User u4 = seededUsers.get(3);

        // -- Referral u2 (referred by u1) --
        allTransactions.add(PointsTransaction.builder()
                .user(u1)
                .amount(500L)
                .balanceAfter(1500L)
                .type(PointsTransactionType.REFERRAL_L1)
                .notes("Referral reward (Level 1) from " + DataFormatter.maskEmail(u2.getEmail()))
                .createdAt(u2.getCreatedAt())
                .build());

        // -- Referral u3 (referred by u2) --
        allTransactions.add(PointsTransaction.builder()
                .user(u2)
                .amount(500L)
                .balanceAfter(1500L)
                .type(PointsTransactionType.REFERRAL_L1)
                .notes("Referral reward (Level 1) from " + DataFormatter.maskEmail(u3.getEmail()))
                .createdAt(u3.getCreatedAt())
                .build());

        allTransactions.add(PointsTransaction.builder()
                .user(u1)
                .amount(200L)
                .balanceAfter(1700L)
                .type(PointsTransactionType.REFERRAL_L2)
                .notes("Referral reward (Level 2) from " + DataFormatter.maskEmail(u3.getEmail()))
                .createdAt(u3.getCreatedAt())
                .build());

        // -- Referral u4 (referred by u3) --
        allTransactions.add(PointsTransaction.builder()
                .user(u3)
                .amount(500L)
                .balanceAfter(1500L)
                .type(PointsTransactionType.REFERRAL_L1)
                .notes("Referral reward (Level 1) from " + DataFormatter.maskEmail(u4.getEmail()))
                .createdAt(u4.getCreatedAt())
                .build());

        allTransactions.add(PointsTransaction.builder()
                .user(u2)
                .amount(200L)
                .balanceAfter(1700L)
                .type(PointsTransactionType.REFERRAL_L2)
                .notes("Referral reward (Level 2) from " + DataFormatter.maskEmail(u4.getEmail()))
                .createdAt(u4.getCreatedAt())
                .build());

        allTransactions.add(PointsTransaction.builder()
                .user(u1)
                .amount(100L)
                .balanceAfter(1800L)
                .type(PointsTransactionType.REFERRAL_L3)
                .notes("Referral reward (Level 3) from " + DataFormatter.maskEmail(u4.getEmail()))
                .createdAt(u4.getCreatedAt())
                .build());

        pointsTransactionRepository.saveAll(allTransactions);
    }
}
