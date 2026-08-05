package com.tradex.api.service.seed;

import com.tradex.api.config.AppProperties;
import com.tradex.api.entity.PointsTransaction;
import com.tradex.api.entity.WalletTransaction;
import com.tradex.api.entity.User;
import com.tradex.api.enums.PointsTransactionType;
import com.tradex.api.enums.WalletTransactionType;
import com.tradex.api.enums.WalletTransactionStatus;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionSeeder {

        private final PointsTransactionRepository pointsTransactionRepository;
        private final WalletTransactionRepository walletTransactionRepository;
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
                User u5 = seededUsers.get(4);

                // -- Referral u2 (referred by u1) --
                allTransactions.add(PointsTransaction.builder()
                                .user(u1)
                                .amount(500L)
                                .balanceAfter(1500L)
                                .type(PointsTransactionType.REFERRAL_L1)
                                .notes("Referral reward (Level 1) from " + u2.getEmail())
                                .createdAt(u2.getCreatedAt())
                                .build());

                // -- Referral u3 (referred by u2) --
                allTransactions.add(PointsTransaction.builder()
                                .user(u2)
                                .amount(500L)
                                .balanceAfter(1500L)
                                .type(PointsTransactionType.REFERRAL_L1)
                                .notes("Referral reward (Level 1) from " + u3.getEmail())
                                .createdAt(u3.getCreatedAt())
                                .build());

                allTransactions.add(PointsTransaction.builder()
                                .user(u1)
                                .amount(200L)
                                .balanceAfter(1700L)
                                .type(PointsTransactionType.REFERRAL_L2)
                                .notes("Referral reward (Level 2) from " + u3.getEmail())
                                .createdAt(u3.getCreatedAt())
                                .build());

                // -- Referral u4 (referred by u3) --
                allTransactions.add(PointsTransaction.builder()
                                .user(u3)
                                .amount(500L)
                                .balanceAfter(1500L)
                                .type(PointsTransactionType.REFERRAL_L1)
                                .notes("Referral reward (Level 1) from " + u4.getEmail())
                                .createdAt(u4.getCreatedAt())
                                .build());

                allTransactions.add(PointsTransaction.builder()
                                .user(u2)
                                .amount(200L)
                                .balanceAfter(1700L)
                                .type(PointsTransactionType.REFERRAL_L2)
                                .notes("Referral reward (Level 2) from " + u4.getEmail())
                                .createdAt(u4.getCreatedAt())
                                .build());

                allTransactions.add(PointsTransaction.builder()
                                .user(u1)
                                .amount(100L)
                                .balanceAfter(1800L)
                                .type(PointsTransactionType.REFERRAL_L3)
                                .notes("Referral reward (Level 3) from " + u4.getEmail())
                                .createdAt(u4.getCreatedAt())
                                .build());

                // -- Referral u5 (referred by u4) --
                allTransactions.add(PointsTransaction.builder()
                                .user(u4)
                                .amount(500L)
                                .balanceAfter(1000L)
                                .type(PointsTransactionType.REFERRAL_L1)
                                .notes("Referral reward (Level 1) from " + u5.getEmail())
                                .createdAt(u5.getCreatedAt())
                                .build());

                allTransactions.add(PointsTransaction.builder()
                                .user(u3)
                                .amount(200L)
                                .balanceAfter(1500L)
                                .type(PointsTransactionType.REFERRAL_L2)
                                .notes("Referral reward (Level 2) from " + u5.getEmail())
                                .createdAt(u5.getCreatedAt())
                                .build());

                allTransactions.add(PointsTransaction.builder()
                                .user(u2)
                                .amount(100L)
                                .balanceAfter(1700L)
                                .type(PointsTransactionType.REFERRAL_L3)
                                .notes("Referral reward (Level 3) from " + u5.getEmail())
                                .createdAt(u5.getCreatedAt())
                                .build());

                pointsTransactionRepository.saveAll(allTransactions);

                // ── Wallet Transactions ──────────────────────────────────────────────
                seedWalletTransactions(u1, u2, u3, u4);
        }

        private void seedWalletTransactions(User u1, User u2, User u3, User u4) {
                List<WalletTransaction> walletTxs = new ArrayList<>();
                LocalDateTime now = LocalDateTime.now();

                // u1 — approved deposit (submitted ~4h after registration, approved same day at
                // 1:22 PM)
                walletTxs.add(WalletTransaction.builder()
                                .user(u1)
                                .amount(new BigDecimal("12500.00"))
                                .balanceAfter(new BigDecimal("12500.00"))
                                .type(WalletTransactionType.DEPOSIT)
                                .status(WalletTransactionStatus.SUCCESS)
                                .notes("Deposit approved by admin")
                                .idempotencyKey(UUID.randomUUID().toString())
                                .createdAt(u1.getCreatedAt().plusHours(4))
                                .build());

                // u1 — first deposit bonus (credited immediately after deposit approval)
                walletTxs.add(WalletTransaction.builder()
                                .user(u1)
                                .amount(new BigDecimal("800.00"))
                                .balanceAfter(new BigDecimal("800.00"))
                                .type(WalletTransactionType.FIRST_DEPOSIT_BONUS)
                                .status(WalletTransactionStatus.SUCCESS)
                                .notes("First-time wallet load bonus reward")
                                .idempotencyKey(UUID.randomUUID().toString())
                                .createdAt(u1.getCreatedAt().withHour(13).withMinute(23))
                                .build());

                // u2 — approved deposit (submitted 2h after joining, approved at 5:10 PM same
                // day)
                walletTxs.add(WalletTransaction.builder()
                                .user(u2)
                                .amount(new BigDecimal("5000.00"))
                                .balanceAfter(new BigDecimal("5000.00"))
                                .type(WalletTransactionType.DEPOSIT)
                                .status(WalletTransactionStatus.SUCCESS)
                                .notes("Deposit approved by admin")
                                .idempotencyKey(UUID.randomUUID().toString())
                                .createdAt(u2.getCreatedAt().plusHours(2))
                                .build());

                // u2 — withdrawal the next morning at 10:45 AM
                walletTxs.add(WalletTransaction.builder()
                                .user(u2)
                                .amount(new BigDecimal("250.00"))
                                .balanceAfter(new BigDecimal("4750.00"))
                                .type(WalletTransactionType.WITHDRAWAL)
                                .status(WalletTransactionStatus.SUCCESS)
                                .notes("Withdrawal approved by admin")
                                .idempotencyKey(UUID.randomUUID().toString())
                                .createdAt(u2.getCreatedAt().plusDays(1).withHour(10).withMinute(45))
                                .build());

                // u3 — pending deposit (submitted ~3 hours ago — fresh in the admin queue)
                walletTxs.add(WalletTransaction.builder()
                                .user(u3)
                                .amount(new BigDecimal("2000.00"))
                                .balanceAfter(new BigDecimal("0.00"))
                                .type(WalletTransactionType.DEPOSIT)
                                .status(WalletTransactionStatus.PENDING)
                                .notes("Deposit request pending approval")
                                .idempotencyKey(UUID.randomUUID().toString())
                                .createdAt(now.minusHours(3).withSecond(0).withNano(0))
                                .build());

                // u4 — pending withdrawal (submitted ~45 minutes ago — very fresh)
                walletTxs.add(WalletTransaction.builder()
                                .user(u4)
                                .amount(new BigDecimal("500.00"))
                                .balanceAfter(new BigDecimal("0.00"))
                                .type(WalletTransactionType.WITHDRAWAL)
                                .status(WalletTransactionStatus.PENDING)
                                .notes("Withdrawal of funds from wallet to bank account ACCU104")
                                .idempotencyKey(UUID.randomUUID().toString())
                                .createdAt(now.minusMinutes(45).withSecond(0).withNano(0))
                                .build());

                walletTransactionRepository.saveAll(walletTxs);
        }
}
