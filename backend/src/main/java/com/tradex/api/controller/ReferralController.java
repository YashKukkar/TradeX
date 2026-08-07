package com.tradex.api.controller;

import com.tradex.api.dto.PointsTransactionDTO;
import com.tradex.api.dto.ReferralRewardDTO;
import com.tradex.api.exception.AppException;
import com.tradex.api.service.ReferralService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/referrals")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_USER')")
public class ReferralController {

    private final ReferralService referralService;

    private String getUserEmail(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new AppException.UnauthorizedException("Authentication principal is missing");
        }
        return principal.getName();
    }

    @GetMapping("/downline")
    public ResponseEntity<List<ReferralRewardDTO>> getMyReferrals(Principal principal) {
        List<ReferralRewardDTO> referrals = referralService.getMyReferrals(getUserEmail(principal));
        return ResponseEntity.ok(referrals);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<PointsTransactionDTO>> getMyTransactions(Principal principal) {
        List<PointsTransactionDTO> transactions = referralService.getMyTransactions(getUserEmail(principal));
        return ResponseEntity.ok(transactions);
    }
}
