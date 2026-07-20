package com.tradex.api.controller;

import com.tradex.api.dto.WalletTransactionDTO;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.mapper.UserMapper;
import com.tradex.api.service.WalletService;
import com.tradex.api.entity.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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
    private final UserMapper userMapper;

    public record WalletAmountRequest(
        @NotNull(message = "Amount cannot be null")
        @Positive(message = "Amount must be greater than zero")
        BigDecimal amount
    ) {}

    public record ConvertPointsRequest(
        @NotNull(message = "Points value cannot be null")
        @Min(value = 1, message = "Points value must be at least 1")
        Long points
    ) {}

    public record BankDetailsRequest(
        @NotBlank(message = "Bank account number cannot be blank")
        String accountNumber
    ) {}

    @PostMapping("/deposit")
    public ResponseEntity<WalletTransactionDTO> deposit(
            Principal principal,
            @Valid @RequestBody WalletAmountRequest request
    ) {
        log.info("Deposit request for user {} with amount {}", principal.getName(), request.amount());
        WalletTransactionDTO tx = walletService.deposit(principal.getName(), request.amount());
        return ResponseEntity.ok(tx);
    }

    @PostMapping("/withdraw")
    public ResponseEntity<WalletTransactionDTO> withdraw(
            Principal principal,
            @Valid @RequestBody WalletAmountRequest request
    ) {
        log.info("Withdrawal request for user {} with amount {}", principal.getName(), request.amount());
        WalletTransactionDTO tx = walletService.withdraw(principal.getName(), request.amount());
        return ResponseEntity.ok(tx);
    }

    @PostMapping("/convert-points")
    public ResponseEntity<WalletTransactionDTO> convertPoints(
            Principal principal,
            @Valid @RequestBody ConvertPointsRequest request
    ) {
        log.info("Points conversion request for user {} with points {}", principal.getName(), request.points());
        WalletTransactionDTO tx = walletService.convertPoints(principal.getName(), request.points());
        return ResponseEntity.ok(tx);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransactionDTO>> getMyTransactions(Principal principal) {
        log.info("Fetching wallet transactions for user {}", principal.getName());
        List<WalletTransactionDTO> txs = walletService.getMyWalletTransactions(principal.getName());
        return ResponseEntity.ok(txs);
    }

    @PutMapping("/bank-details")
    public ResponseEntity<UserDTO> updateBankDetails(
            Principal principal,
            @Valid @RequestBody BankDetailsRequest request
    ) {
        log.info("Updating bank details for user {}", principal.getName());
        User user = walletService.updateBankDetails(principal.getName(), request.accountNumber());
        return ResponseEntity.ok(userMapper.toDTO(user));
    }
}
