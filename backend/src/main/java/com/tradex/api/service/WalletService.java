package com.tradex.api.service;

import com.tradex.api.dto.WalletTransactionDTO;
import com.tradex.api.entity.*;
import com.tradex.api.enums.*;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.WalletTransactionRepository;
import com.tradex.api.util.DataFormatter;
import com.tradex.api.util.WalletTransactionHelper;
import com.tradex.api.exception.AppException.*;
import com.tradex.api.config.AppProperties;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import com.tradex.api.annotation.EvictDashboardCache;

import java.math.BigDecimal;
import java.util.List;

import com.tradex.api.service.handler.TransactionHandler;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
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
                .collect(Collectors.toMap(handler -> handler.getType(), handler -> handler));
    }

    @Transactional
    public WalletTransactionDTO deposit(String email, BigDecimal amount) {
        return deposit(email, amount, null);
    }

    @Transactional
    public WalletTransactionDTO deposit(String email, BigDecimal amount, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<WalletTransaction> existing = walletTransactionRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Duplicate deposit request detected for key {}. Returning cached transaction.",
                        idempotencyKey);
                return new WalletTransactionDTO(existing.get());
            }
        }

        validateDepositAmount(amount);

        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        validateCustomerAccess(user);

        WalletTransaction depositTx = buildPendingTransaction(
                user,
                amount,
                user.getWithdrawableBalance(),
                WalletTransactionType.DEPOSIT,
                "Deposit request pending approval",
                idempotencyKey);

        WalletTransaction savedTx = saveWithIdempotencyFallback(depositTx, idempotencyKey);
        log.info("Created pending deposit request ID: {}, amount: {}, user: {}, idempotencyKey: {}",
                savedTx.getId(), amount, email, idempotencyKey);

        return new WalletTransactionDTO(savedTx);
    }

    @Transactional
    public WalletTransactionDTO withdraw(String email, BigDecimal amount) {
        return withdraw(email, amount, null);
    }

    @Transactional
    public WalletTransactionDTO withdraw(String email, BigDecimal amount, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<WalletTransaction> existing = walletTransactionRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Duplicate withdrawal request detected for key {}. Returning cached transaction.",
                        idempotencyKey);
                return new WalletTransactionDTO(existing.get());
            }
        }

        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        validateWithdrawal(user, amount);

        user = walletBalanceManager.mutateWithdrawableBalance(user, amount.negate());
        BigDecimal newBalance = user.getWithdrawableBalance();

        String bankDescription = "Withdrawal of funds from wallet to bank account ending in "
                + user.getPrimaryBank().map(bank -> DataFormatter.maskAccountNumber(bank.getAccountNumber()))
                        .orElse("N/A");

        WalletTransaction withdrawTx = buildPendingTransaction(
                user,
                amount,
                newBalance,
                WalletTransactionType.WITHDRAWAL,
                bankDescription,
                idempotencyKey);

        WalletTransaction savedTx = saveWithIdempotencyFallback(withdrawTx, idempotencyKey);
        log.info("Processed withdrawal request ID: {} of amount: {} (PENDING) for user: {}, idempotencyKey: {}",
                savedTx.getId(), amount, email, idempotencyKey);

        return new WalletTransactionDTO(savedTx);
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

    @Transactional
    @EvictDashboardCache("transactions")
    public WalletTransactionDTO rejectTransaction(Long transactionId, String reason) {
        WalletTransaction tx = walletTransactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));
        return rejectTransactionInternal(tx, reason);
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return userRepository.findByEmail(auth.getName()).orElse(defaultValue);
        }
        return defaultValue;
    }

    private void validateCustomerAccess(User user) {
        user.validateCustomerAccess();
    }

    private void validateDepositAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Deposit amount must be greater than zero");
        }
    }

    private void validateWithdrawal(User user, BigDecimal amount) {
        validateCustomerAccess(user);

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

    private WalletTransaction buildPendingTransaction(
            User user,
            BigDecimal amount,
            BigDecimal balanceAfter,
            WalletTransactionType type,
            String notes,
            String idempotencyKey) {
        WalletTransaction tx = new WalletTransaction(
                user,
                amount,
                balanceAfter,
                type,
                WalletTransactionStatus.PENDING,
                notes);
        tx.setIdempotencyKey(idempotencyKey);
        return tx;
    }

    private WalletTransaction saveWithIdempotencyFallback(WalletTransaction tx, String idempotencyKey) {
        try {
            WalletTransaction saved = walletTransactionRepository.save(tx);
            return (saved != null) ? saved : tx;
        } catch (DataIntegrityViolationException ex) {
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                Optional<WalletTransaction> existing = walletTransactionRepository.findByIdempotencyKey(idempotencyKey);
                if (existing.isPresent()) {
                    log.warn("Concurrent duplicate request prevented by DB unique constraint for idempotency key: {}",
                            idempotencyKey);
                    return existing.get();
                }
            }
            throw ex;
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
