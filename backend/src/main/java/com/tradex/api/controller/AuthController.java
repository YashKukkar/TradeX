package com.tradex.api.controller;

import com.tradex.api.dto.AddBankAccountRequest;
import com.tradex.api.dto.AuthRequest;
import com.tradex.api.dto.AuthResponse;
import com.tradex.api.dto.SignupRequest;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.dto.SystemSettingDTO;
import com.tradex.api.dto.UpdateProfileRequest;
import com.tradex.api.enums.VerificationType;
import com.tradex.api.service.UserService;
import com.tradex.api.service.VerificationService;
import com.tradex.api.service.SystemSettingService;
import com.tradex.api.security.SecurityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final VerificationService verificationService;
    private final UserService userService;
    private final SystemSettingService systemSettingService;
    private final SecurityService securityService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request,
            HttpServletResponse response) {
        log.info("Processing signup request for email: {}", request.email());
        AuthResponse resp = userService.signup(request);
        securityService.setTokenCookie(response, resp.token());
        return ResponseEntity.ok(new AuthResponse("session", resp.email()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request, HttpServletResponse response) {
        log.info("Processing login request for email: {}", request.email());
        AuthResponse resp = userService.login(request);
        securityService.setTokenCookie(response, resp.token());
        return ResponseEntity.ok(new AuthResponse("session", resp.email()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(jakarta.servlet.http.HttpServletRequest request, HttpServletResponse response) {
        log.info("Processing logout request");
        securityService.logout(request, response);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        String email = securityService.getAuthenticatedUserEmail();
        log.debug("Fetching profile for user: {}", email);
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(userService.getUserProfile(email));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<UserDTO> verifyEmail(@RequestParam String code) {
        String email = securityService.getAuthenticatedUserEmail();
        log.info("Request to verify email for user: {}", email);
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        UserDTO updated = verificationService.verifyEmail(email, code);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/verify-phone")
    public ResponseEntity<UserDTO> verifyPhone(@RequestParam String code) {
        String email = securityService.getAuthenticatedUserEmail();
        log.info("Request to verify phone for user: {}", email);
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        UserDTO updated = verificationService.verifyPhone(email, code);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Void> resendOtp(@RequestParam String type) {
        String email = securityService.getAuthenticatedUserEmail();
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        VerificationType verificationType;
        try {
            verificationType = VerificationType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        verificationService.resendCode(email, verificationType);
        return ResponseEntity.ok().build();
    }

    public record ResetPasswordRequest(
        @NotBlank(message = "Email is required")
        String email,
        @NotBlank(message = "Verification code is required")
        String code,
        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
        String newPassword
    ) {}

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Processing password reset for email: {}", request.email());
        verificationService.resetPassword(request.email().trim().toLowerCase(), request.code().trim(), request.newPassword());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/settings")
    public ResponseEntity<SystemSettingDTO> getPublicSettings() {
        return ResponseEntity.ok(systemSettingService.getSettingsDTO());
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        String email = securityService.getAuthenticatedUserEmail();
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        UserDTO updated = userService.updateProfile(email, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/profile/bank")
    public ResponseEntity<UserDTO> addBankAccount(
            @Valid @RequestBody AddBankAccountRequest request
    ) {
        String email = securityService.getAuthenticatedUserEmail();
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        UserDTO updated = userService.addBankAccount(email, request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/profile/bank/{id}/primary")
    public ResponseEntity<UserDTO> setPrimaryBankAccount(@PathVariable Long id) {
        String email = securityService.getAuthenticatedUserEmail();
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        UserDTO updated = userService.setPrimaryBankAccount(email, id);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/profile/bank/{id}")
    public ResponseEntity<UserDTO> deleteBankAccount(@PathVariable Long id) {
        String email = securityService.getAuthenticatedUserEmail();
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        UserDTO updated = userService.deleteBankAccount(email, id);
        return ResponseEntity.ok(updated);
    }

    public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 100, message = "New password must be between 8 and 100 characters")
        String newPassword
    ) {}

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        String email = securityService.getAuthenticatedUserEmail();
        if (email == null) {
            return ResponseEntity.status(401).build();
        }
        userService.changePassword(email, request.currentPassword(), request.newPassword());
        return ResponseEntity.ok().build();
    }
}

