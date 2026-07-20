package com.tradex.api.controller;

import com.tradex.api.dto.ReferralRewardDTO;
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

    @GetMapping("/downline")
    public ResponseEntity<List<ReferralRewardDTO>> getMyReferrals(Principal principal) {
        List<ReferralRewardDTO> referrals = referralService.getMyReferrals(principal.getName());
        return ResponseEntity.ok(referrals);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<com.tradex.api.dto.PointsTransactionDTO>> getMyTransactions(Principal principal) {
        List<com.tradex.api.dto.PointsTransactionDTO> transactions = referralService.getMyTransactions(principal.getName());
        return ResponseEntity.ok(transactions);
    }
}

