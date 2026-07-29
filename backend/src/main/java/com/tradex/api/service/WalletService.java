package com.tradex.api.service;

import com.tradex.api.dto.WalletTransactionDTO;
import com.tradex.api.entity.*;
import com.tradex.api.enums.*;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import com.tradex.api.util.WalletTransactionHelper;
import com.tradex.api.exception.AppException.*;
import com.tradex.api.config.AppProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tradex.api.annotation.EvictDashboardCache;

import java.math.BigDecimal;
import java.util.List;

import com.tradex.api.service.handler.TransactionHandler;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.function.Function;

@Service
@Slf4j
@SuppressWarnings("null")
public class WalletService {

    private final UserRepository userRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final WalletTransactionHelper walletTransactionHelper;
    private final AppProperties appProperties;
    private final WalletBalanceManager walletBalanceManager;
    private final Map<WalletTransactionType, TransactionHandler> transactionHandlers;

    public WalletService(
            UserRepository userRepository,
            WalletTransactionRepository walletTransactionRepository,
            WalletTransactionHelper walletTransactionHelper,
            AppProperties appProperties,
            WalletBalanceManager walletBalanceManager,
            List<TransactionHandler> handlers) {
        this.userRepository = userRepository;
        this.walletTransactionRepository = walletTransactionRepository;
        this.walletTransactionHelper = walletTransactionHelper;
        this.appProperties = appProperties;
        this.walletBalanceManager = walletBalanceManager;
        this.transactionHandlers = handlers.stream()
                .collect(Collectors.toMap(TransactionHandler::getType, Function.identity()));
    }

    @Transactional
    public WalletTransactionDTO deposit(String email, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Deposit amount must be greater than zero");
        }

        log.info("Creating pending deposit of {} for user {}", amount, email);

        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (user.getRole() == Role.EMPLOYEE || user.getRole() == Role.SUPER_ADMIN) {
            throw new ForbiddenException("This operation is only available to customers");
        }

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

    @Transactional
    public WalletTransactionDTO withdraw(String email, BigDecimal amount) {
        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (user.getRole() == Role.EMPLOYEE || user.getRole() == Role.SUPER_ADMIN) {
            throw new ForbiddenException("This operation is only available to customers");
        }

        validateWithdrawal(user, amount);

        user = walletBalanceManager.mutateWithdrawableBalance(user, amount.negate());
        BigDecimal newBalance = user.getWithdrawableBalance();

        WalletTransaction withdrawTx = new WalletTransaction(
                user,
                amount,
                newBalance,
                WalletTransactionType.WITHDRAWAL,
                WalletTransactionStatus.PENDING,
                "Withdrawal of funds from wallet to bank account "
                        + user.getPrimaryBank().map(BankDetail::getAccountNumber).orElse("N/A"));
        walletTransactionRepository.save(withdrawTx);

        log.info("Processed withdrawal request of {} (PENDING) for user {}", amount, email);

        return new WalletTransactionDTO(withdrawTx);
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

    @Transactional(readOnly = true)
    public List<WalletTransactionDTO> getAllTransactions() {
        return walletTransactionRepository.findAllByOrderByApprovedAtDesc()
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
    @EvictDashboardCache("transactions")
    public WalletTransactionDTO approveTransaction(Long transactionId) {
        WalletTransaction tx = walletTransactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));
        return approveTransactionInternal(tx);
    }

    private WalletTransactionDTO approveTransactionInternal(WalletTransaction tx) {
        if (tx.getStatus() != WalletTransactionStatus.PENDING) {
            throw new BadRequestException("Transaction is not pending");
        }

        User user = userRepository.findByIdForUpdate(tx.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TransactionHandler handler = transactionHandlers.get(tx.getType());
        if (handler == null) {
            throw new BadRequestException("Unsupported transaction type for approval: " + tx.getType());
        }

        User actor = getAuthenticatedActorOrDefault(user);
        handler.approve(actor, user, tx);

        return new WalletTransactionDTO(tx);
    }

    @Transactional
    @EvictDashboardCache("transactions")
    public WalletTransactionDTO rejectTransaction(Long transactionId, String reason) {
        WalletTransaction tx = walletTransactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));
        return rejectTransactionInternal(tx, reason);
    }

    private WalletTransactionDTO rejectTransactionInternal(WalletTransaction tx, String reason) {
        if (tx.getStatus() != WalletTransactionStatus.PENDING) {
            throw new BadRequestException("Transaction is not pending");
        }

        User user = userRepository.findByIdForUpdate(tx.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String safeReason = (reason != null) ? reason.trim() : "No reason provided";
        if (safeReason.length() > 200) {
            throw new BadRequestException("Rejection reason must not exceed 200 characters");
        }

        TransactionHandler handler = transactionHandlers.get(tx.getType());
        if (handler == null) {
            throw new BadRequestException("Unsupported transaction type for rejection: " + tx.getType());
        }

        User actor = getAuthenticatedActorOrDefault(user);
        handler.reject(actor, user, tx, safeReason);

        return new WalletTransactionDTO(tx);
    }

    private User getAuthenticatedActorOrDefault(User defaultValue) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return userRepository.findByEmail(auth.getName()).orElse(defaultValue);
        }
        return defaultValue;
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

        if (user.getPrimaryBank().isEmpty()) {
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
