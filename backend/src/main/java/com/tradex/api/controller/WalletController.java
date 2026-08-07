package com.tradex.api.controller;

import com.tradex.api.dto.WalletTransactionDTO;
import com.tradex.api.exception.AppException;
import com.tradex.api.service.WalletService;
import com.tradex.api.service.PointsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAuthority('ROLE_USER')")
public class WalletController {

    private final WalletService walletService;
    private final PointsService pointsService;

    public record WalletAmountRequest(
            @NotNull(message = "Amount cannot be null") @Positive(message = "Amount must be greater than zero") BigDecimal amount) {
    }

    public record ConvertPointsRequest(
            @NotNull(message = "Points value cannot be null") @Min(value = 1, message = "Points value must be at least 1") Long points) {
    }

    private String getUserEmail(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new AppException.UnauthorizedException("Authentication principal is missing");
        }
        return principal.getName();
    }

    @PostMapping("/deposit")
    public ResponseEntity<WalletTransactionDTO> deposit(
            Principal principal,
            @Valid @RequestBody WalletAmountRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        String email = getUserEmail(principal);
        log.info("Deposit request for user {} with amount {} and idempotency key {}", email, request.amount(),
                idempotencyKey);
        WalletTransactionDTO tx = walletService.deposit(email, request.amount(), idempotencyKey);
        return ResponseEntity.ok(tx);
    }

    @PostMapping("/withdraw")
    public ResponseEntity<WalletTransactionDTO> withdraw(
            Principal principal,
            @Valid @RequestBody WalletAmountRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        String email = getUserEmail(principal);
        log.info("Withdrawal request for user {} with amount {} and idempotency key {}", email, request.amount(),
                idempotencyKey);
        WalletTransactionDTO tx = walletService.withdraw(email, request.amount(), idempotencyKey);
        return ResponseEntity.ok(tx);
    }

    @PostMapping("/convert-points")
    public ResponseEntity<WalletTransactionDTO> convertPoints(
            Principal principal,
            @Valid @RequestBody ConvertPointsRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        String email = getUserEmail(principal);
        log.info("Points conversion request for user {} with points {} and idempotency key {}", email, request.points(),
                idempotencyKey);
        WalletTransactionDTO tx = pointsService.convertPoints(email, request.points(), idempotencyKey);
        return ResponseEntity.ok(tx);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransactionDTO>> getMyTransactions(Principal principal) {
        String email = getUserEmail(principal);
        log.info("Fetching wallet transactions for user {}", email);
        List<WalletTransactionDTO> txs = walletService.getMyWalletTransactions(email);
        return ResponseEntity.ok(txs);
    }
}
