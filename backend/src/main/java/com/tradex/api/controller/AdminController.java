package com.tradex.api.controller;

import com.tradex.api.dto.AdminAdjustPointsRequest;
import com.tradex.api.dto.AdminAdjustWalletRequest;
import com.tradex.api.dto.AdminAuditLogDTO;
import com.tradex.api.dto.PermissionRegistryDTO;
import com.tradex.api.dto.PointsTransactionDTO;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.dto.SystemSettingDTO;
import com.tradex.api.dto.WalletTransactionDTO;
import com.tradex.api.enums.AdminAction;
import com.tradex.api.enums.Permission;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import com.tradex.api.service.AdminUserService;
import com.tradex.api.service.UserService;
import com.tradex.api.service.SystemSettingService;
import com.tradex.api.service.ReferralService;
import com.tradex.api.service.seed.SeedDataService;
import com.tradex.api.service.WalletService;
import com.tradex.api.exception.AppException.BadRequestException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final UserService userService;
    private final AdminUserService adminUserService;
    private final SystemSettingService systemSettingService;
    private final ReferralService referralService;
    private final SeedDataService seedDataService;
    private final WalletService walletService;

    private String currentAdminEmail(Authentication auth) {
        return auth.getName();
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_USERS')")
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers(Authentication auth) {
        List<UserDTO> users = userService.getAllUsers(auth.getName());
        return ResponseEntity.ok(users);
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_USERS')")
    @GetMapping("/users/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(userService.getUserById(id, auth.getName()));
    }

    public record StatusActionRequest(AdminAction action) {
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_USERS')")
    @PatchMapping("/users/{id}/status")
    public ResponseEntity<UserDTO> updateUserStatus(
            @PathVariable Long id,
            @RequestBody StatusActionRequest request,
            Authentication auth) {
        String adminEmail = currentAdminEmail(auth);
        UserDTO result = switch (request.action()) {
            case LOCK -> adminUserService.lockUser(adminEmail, id);
            case UNLOCK -> adminUserService.unlockUser(adminEmail, id);
            case DISABLE -> adminUserService.disableUser(adminEmail, id);
            case ENABLE -> adminUserService.enableUser(adminEmail, id);
            case FORCE_EMAIL_VERIFY -> adminUserService.forceVerifyEmail(adminEmail, id);
            default -> throw new BadRequestException("Action not supported via status endpoint: " + request.action());
        };
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_USERS')")
    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<Void> sendPasswordResetEmail(
            @PathVariable Long id,
            Authentication auth) {
        adminUserService.sendPasswordResetEmail(currentAdminEmail(auth), id);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_POINTS')")
    @PostMapping("/users/{id}/points")
    public ResponseEntity<UserDTO> adjustPoints(
            @PathVariable Long id,
            @Valid @RequestBody AdminAdjustPointsRequest request,
            Authentication auth) {
        return ResponseEntity.ok(adminUserService.adjustPoints(currentAdminEmail(auth), id, request));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_DEPOSITS', 'PERM_MANAGE_WITHDRAWALS')")
    @PostMapping("/users/{id}/wallet")
    public ResponseEntity<UserDTO> adjustWallet(
            @PathVariable Long id,
            @Valid @RequestBody AdminAdjustWalletRequest request,
            Authentication auth) {
        return ResponseEntity.ok(adminUserService.adjustWallet(currentAdminEmail(auth), id, request));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'EMPLOYEE')")
    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AdminAuditLogDTO>> getAuditLogs(
            @RequestParam(required = false) String targetEmail,
            @PageableDefault(size = 50, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(adminUserService.getAuditLogs(targetEmail, pageable));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_POINTS')")
    @GetMapping("/users/{id}/points-history")
    public ResponseEntity<List<PointsTransactionDTO>> getUserPointsHistory(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getUserPointsHistory(id));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_USERS', 'PERM_MANAGE_DEPOSITS', 'PERM_MANAGE_WITHDRAWALS')")
    @GetMapping("/users/{id}/wallet-history")
    public ResponseEntity<List<WalletTransactionDTO>> getUserWalletHistory(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getUserWalletHistory(id));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_USERS')")
    @GetMapping("/users/{id}/referral-tree")
    public ResponseEntity<List<UserDTO>> getReferralTree(@PathVariable Long id) {
        List<UserDTO> network = referralService.getReferralTree(id);
        return ResponseEntity.ok(network);
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_EMPLOYEE')")
    @GetMapping("/settings")
    public ResponseEntity<SystemSettingDTO> getSettings() {
        return ResponseEntity.ok(systemSettingService.getSettingsDTO());
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_SETTINGS')")
    @PutMapping("/settings")
    public ResponseEntity<SystemSettingDTO> updateSettings(@Valid @RequestBody SystemSettingDTO dto) {
        log.info("Admin updated system settings");
        SystemSettingDTO updatedDto = systemSettingService.updateSettings(dto);
        return ResponseEntity.ok(updatedDto);
    }

    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
    @PostMapping("/seed-test-data")
    public ResponseEntity<Void> seedTestData() {
        log.info("Admin triggered database seeding for test users");
        seedDataService.seedTestData();
        return ResponseEntity.ok().build();
    }

    public record RejectTransactionRequest(
            @NotBlank(message = "Rejection reason cannot be blank") String reason) {
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_DEPOSITS', 'PERM_MANAGE_WITHDRAWALS')")
    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransactionDTO>> getAllTransactions() {
        return ResponseEntity.ok(walletService.getAllTransactions());
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'PERM_MANAGE_DEPOSITS', 'PERM_MANAGE_WITHDRAWALS')")
    @GetMapping("/transactions/pending")
    public ResponseEntity<List<WalletTransactionDTO>> getPendingTransactions() {
        return ResponseEntity.ok(walletService.getPendingTransactions());
    }

    @PreAuthorize("@walletSecurity.canManageTransaction(#id)")
    @PostMapping("/transactions/{id}/approve")
    public ResponseEntity<WalletTransactionDTO> approveTransaction(@PathVariable Long id) {
        log.info("Admin approved transaction ID: {}", id);
        return ResponseEntity.ok(walletService.approveTransaction(id));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_EMPLOYEE')")
    @GetMapping("/permissions")
    public ResponseEntity<List<PermissionRegistryDTO>> getPermissions() {
        List<PermissionRegistryDTO> registry = Arrays.stream(Permission.values())
                .map(p -> new PermissionRegistryDTO(
                        p.name(),
                        p.getDisplayName(),
                        p.getDescription(),
                        p.getCategory()))
                .toList();
        return ResponseEntity.ok(registry);
    }

    @PreAuthorize("@walletSecurity.canManageTransaction(#id)")
    @PostMapping("/transactions/{id}/reject")
    public ResponseEntity<WalletTransactionDTO> rejectTransaction(
            @PathVariable Long id,
            @Valid @RequestBody RejectTransactionRequest request) {
        log.info("Admin rejected transaction ID: {} with reason: {}", id, request.reason());
        return ResponseEntity.ok(walletService.rejectTransaction(id, request.reason()));
    }
}
