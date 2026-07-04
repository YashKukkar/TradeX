package com.tradex.api.service;

import com.tradex.api.dto.WalletTransactionDTO;
import com.tradex.api.entity.*;
import com.tradex.api.enums.*;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.exception.AppException.*;
import com.tradex.api.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final UserRepository userRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final PointsTransactionRepository pointsTransactionRepository;
    private final SystemSettingService systemSettingService;
    private final WalletTransactionHelper walletTransactionHelper;
    private final AppProperties appProperties;

    @Transactional
    public WalletTransactionDTO deposit(String email, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Deposit amount must be greater than zero");
        }

        log.info("Creating pending deposit of {} for user {}", amount, email);

        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        WalletTransaction depositTx = new WalletTransaction(
                user,
                amount,
                user.getWithdrawableBalance(),
                WalletTransactionType.DEPOSIT,
                WalletTransactionStatus.PENDING,
                "Deposit request pending approval");
        walletTransactionRepository.save(depositTx);

        return new WalletTransactionDTO(depositTx);
    }

    private void applyFirstDepositBonus(User user, BigDecimal amount, boolean isFirstDeposit) {
        if (!isFirstDeposit) {
            return;
        }

        SystemSetting settings = systemSettingService.getSettings();
        if (!settings.isFirstDepositRewardEnabled()) {
            return;
        }

        BigDecimal threshold = settings.getFirstDepositRewardThreshold();
        if (threshold == null || amount.compareTo(threshold) < 0) {
            log.info("Deposit amount did not meet threshold for first deposit bonus");
            return;
        }

        BigDecimal rewardAmount = settings.getFirstDepositRewardAmount();
        if (rewardAmount == null || rewardAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal currentBonus = user.getBonusBalance();
        BigDecimal newBonus = currentBonus.add(rewardAmount);
        user.setBonusBalance(newBonus);

        WalletTransaction bonusTx = new WalletTransaction(
                user,
                rewardAmount,
                newBonus,
                WalletTransactionType.FIRST_DEPOSIT_BONUS,
                WalletTransactionStatus.SUCCESS,
                "First-time wallet load bonus reward");
        walletTransactionRepository.save(bonusTx);
        log.info("Awarded first-time deposit bonus of {} to user {}", rewardAmount, user.getEmail());
    }

    @Transactional
    @SuppressWarnings("null")
    public WalletTransactionDTO withdraw(String email, BigDecimal amount) {
        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        validateWithdrawal(user, amount);

        BigDecimal currentBalance = user.getWithdrawableBalance();
        BigDecimal newBalance = currentBalance.subtract(amount);
        user.setWithdrawableBalance(newBalance);

        WalletTransaction withdrawTx = new WalletTransaction(
                user,
                amount,
                newBalance,
                WalletTransactionType.WITHDRAWAL,
                WalletTransactionStatus.PENDING,
                "Withdrawal of funds from wallet to bank account " + user.getAccountNumber());
        walletTransactionRepository.save(withdrawTx);

        log.info("Processed withdrawal request of {} (PENDING) for user {}", amount, email);

        return new WalletTransactionDTO(withdrawTx);
    }

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

        BigDecimal currentBonus = user.getBonusBalance();
        BigDecimal newBonus = currentBonus.add(cashAwarded);
        user.setBonusBalance(newBonus);

        PointsTransaction pointsTx = new PointsTransaction(
                user,
                points,
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
        walletTransactionRepository.save(walletTx);

        log.info("Converted {} points to {} bonus cash for user {}", points, cashAwarded, email);

        return new WalletTransactionDTO(walletTx);
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionDTO> getMyWalletTransactions(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        return walletTransactionRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(WalletTransactionDTO::new)
                .toList();
    }

    @Transactional
    public User updateBankDetails(String email, String accountNumber) {
        if (accountNumber == null || accountNumber.trim().isEmpty()) {
            throw new BadRequestException("Account number cannot be empty");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        user.setAccountNumber(accountNumber.trim().toUpperCase());
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionDTO> getAllTransactions() {
        return walletTransactionRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(WalletTransactionDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionDTO> getPendingTransactions() {
        return walletTransactionRepository.findByStatusOrderByCreatedAtDesc(WalletTransactionStatus.PENDING)
                .stream()
                .map(WalletTransactionDTO::new)
                .toList();
    }

    @Transactional
    public WalletTransactionDTO approveTransaction(Long transactionId) {
        WalletTransaction tx = walletTransactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));

        if (tx.getStatus() != WalletTransactionStatus.PENDING) {
            throw new BadRequestException("Transaction is not pending");
        }

        User user = userRepository.findByIdForUpdate(tx.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        switch (tx.getType()) {
            case DEPOSIT -> approveDeposit(user, tx);
            case WITHDRAWAL -> approveWithdrawal(tx);
            default -> throw new BadRequestException("Unsupported transaction type for approval: " + tx.getType());
        }

        return new WalletTransactionDTO(tx);
    }

    @Transactional
    public WalletTransactionDTO rejectTransaction(Long transactionId, String reason) {
        WalletTransaction tx = walletTransactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));

        if (tx.getStatus() != WalletTransactionStatus.PENDING) {
            throw new BadRequestException("Transaction is not pending");
        }

        User user = userRepository.findByIdForUpdate(tx.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String safeReason = (reason != null) ? reason.trim() : "No reason provided";
        if (safeReason.length() > 200) {
            throw new BadRequestException("Rejection reason must not exceed 200 characters");
        }

        switch (tx.getType()) {
            case DEPOSIT -> rejectDeposit(tx, safeReason);
            case WITHDRAWAL -> rejectWithdrawal(user, tx, safeReason);
            default -> throw new BadRequestException("Unsupported transaction type for rejection: " + tx.getType());
        }

        return new WalletTransactionDTO(tx);
    }

    private void approveDeposit(User user, WalletTransaction tx) {
        boolean isFirstDeposit = !walletTransactionRepository.existsByUserIdAndTypeAndStatus(
                user.getId(),
                WalletTransactionType.DEPOSIT,
                WalletTransactionStatus.SUCCESS);

        BigDecimal currentBalance = user.getWithdrawableBalance();
        BigDecimal newBalance = currentBalance.add(tx.getAmount());
        user.setWithdrawableBalance(newBalance);

        finalizeTransaction(tx, WalletTransactionStatus.SUCCESS, newBalance, "Deposit approved by admin");
        applyFirstDepositBonus(user, tx.getAmount(), isFirstDeposit);
    }

    private void approveWithdrawal(WalletTransaction tx) {
        finalizeTransaction(tx, WalletTransactionStatus.SUCCESS, tx.getBalanceAfter(), "Withdrawal approved by admin");
    }

    private void rejectDeposit(WalletTransaction tx, String reason) {
        finalizeTransaction(tx, WalletTransactionStatus.FAILED, tx.getBalanceAfter(), "Deposit rejected by admin: " + reason);
    }

    private void rejectWithdrawal(User user, WalletTransaction tx, String reason) {
        BigDecimal currentBalance = user.getWithdrawableBalance();
        BigDecimal newBalance = currentBalance.add(tx.getAmount());
        user.setWithdrawableBalance(newBalance);

        finalizeTransaction(tx, WalletTransactionStatus.FAILED, newBalance, "Withdrawal rejected by admin: " + reason);
    }

    private void finalizeTransaction(WalletTransaction tx, WalletTransactionStatus status, BigDecimal balanceAfter, String notes) {
        tx.setStatus(status);
        tx.setBalanceAfter(balanceAfter);
        tx.setNotes(notes);
        walletTransactionRepository.save(tx);
    }

    private void validateWithdrawal(User user, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Withdrawal amount must be greater than zero");
        }

        BigDecimal minWithdrawal = appProperties.getWallet().getMinWithdrawalAmount();
        if (amount.compareTo(minWithdrawal) < 0) {
            logFailedWithdrawal(user, amount, "Withdrawal failed: Amount is below minimum limit of ₹" + minWithdrawal);
            throw new BadRequestException("Minimum withdrawal amount is ₹" + minWithdrawal);
        }

        BigDecimal maxWithdrawal = appProperties.getWallet().getMaxWithdrawalAmount();
        if (amount.compareTo(maxWithdrawal) > 0) {
            logFailedWithdrawal(user, amount, "Withdrawal failed: Amount exceeds maximum limit of ₹" + maxWithdrawal);
            throw new BadRequestException("Maximum withdrawal amount per transaction is ₹" + maxWithdrawal);
        }

        if (user.getAccountNumber() == null || user.getAccountNumber().trim().isEmpty()) {
            logFailedWithdrawal(user, amount, "Withdrawal failed: Bank account details not provided");
            throw new BadRequestException("Bank account details must be provided in order to withdraw money");
        }

        BigDecimal currentBalance = user.getWithdrawableBalance();
        if (currentBalance.compareTo(amount) < 0) {
            logFailedWithdrawal(user, amount, "Withdrawal failed: Insufficient withdrawable balance");
            throw new BadRequestException("Insufficient withdrawable balance");
        }
    }

    private void logFailedWithdrawal(User user, BigDecimal amount, String errorMsg) {
        walletTransactionHelper.logFailedTransaction(
                user.getId(),
                amount,
                user.getWithdrawableBalance(),
                WalletTransactionType.WITHDRAWAL,
                errorMsg);
    }
}
