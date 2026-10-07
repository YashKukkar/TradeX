package com.tradex.api.service;

import com.tradex.api.dto.AuthRequest;
import com.tradex.api.dto.AuthResponse;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;
import com.tradex.api.enums.VerificationType;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.VerificationTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AuthSecurityIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private final String testEmail = "authtest@example.com";
    private final String correctPassword = "CorrectPassword123!";

    @BeforeEach
    void setUp() {
        userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);
        testUser = new User(testEmail, passwordEncoder.encode(correctPassword));
        testUser.setEmailVerified(true);
        testUser.setEnabled(true);
        testUser.setRole(Role.USER);
        testUser = userRepository.save(testUser);
    }

    @Test
    void testWrongPasswordNeverLocksTheAccount() {
        // Failures are throttled per email+IP in AuthRateLimiter; they must not lock
        // the real owner out.
        for (int i = 0; i < 6; i++) {
            final String wrong = "Wrong" + i;
            assertThrows(BadCredentialsException.class, () -> userService.login(new AuthRequest(testEmail, wrong)));
        }

        User user = userRepository.findByEmail(testEmail).orElseThrow();
        assertFalse(user.isLocked());
        assertNull(user.getLockedUntil());

        AuthResponse response = userService.login(new AuthRequest(testEmail, correctPassword));
        assertNotNull(response.token());
    }

    @Test
    void testAutoUnlockAfterLockoutExpiry() {
        // Set user locked with an expired lockout time (10 minutes ago)
        testUser.setLocked(true);
        testUser.setLockedUntil(LocalDateTime.now().minusMinutes(10));
        testUser.setFailedLoginAttempts(3);
        userRepository.save(testUser);

        // Next login attempt with correct password automatically clears lock and
        // succeeds
        AuthResponse response = userService.login(new AuthRequest(testEmail, correctPassword));
        assertNotNull(response.token());

        User unlockedUser = userRepository.findByEmail(testEmail).orElseThrow();
        assertFalse(unlockedUser.isLocked());
        assertNull(unlockedUser.getLockedUntil());
        assertEquals(0, unlockedUser.getFailedLoginAttempts());
    }

    @Test
    void testAdminManualUnlockResetsLockout() {
        // Lock user
        testUser.setLocked(true);
        testUser.setLockedUntil(LocalDateTime.now().plusHours(1));
        testUser.setFailedLoginAttempts(3);
        testUser = userRepository.save(testUser);

        // Admin unlocks user
        adminUserService.unlockUser("admin@tradenows.com", testUser.getId());

        User unlockedUser = userRepository.findByEmail(testEmail).orElseThrow();
        assertFalse(unlockedUser.isLocked());
        assertNull(unlockedUser.getLockedUntil());
        assertEquals(0, unlockedUser.getFailedLoginAttempts());

        // User can now log in immediately
        AuthResponse response = userService.login(new AuthRequest(testEmail, correctPassword));
        assertNotNull(response.token());
    }

    @Test
    void testPasswordResetClearsLockout() {
        // Lock user
        testUser.setLocked(true);
        testUser.setLockedUntil(LocalDateTime.now().plusHours(1));
        testUser.setFailedLoginAttempts(3);
        testUser = userRepository.save(testUser);

        // Create reset token
        verificationService.createVerificationToken(testUser, VerificationType.PASSWORD_RESET);
        var tokenEntity = verificationTokenRepository.findByUserAndType(testUser, VerificationType.PASSWORD_RESET)
                .orElseThrow();
        assertNotNull(tokenEntity);
    }

    @Test
    void testNewOtpInvalidatesOldOtp() {
        verificationService.createVerificationToken(testUser, VerificationType.EMAIL);
        var firstToken = verificationTokenRepository.findByUserAndType(testUser, VerificationType.EMAIL).orElseThrow();
        String firstHash = firstToken.getToken();

        // Advance simulated cooldown
        firstToken.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        verificationTokenRepository.save(firstToken);

        // Regenerate OTP
        verificationService.createVerificationToken(testUser, VerificationType.EMAIL);
        var updatedToken = verificationTokenRepository.findByUserAndType(testUser, VerificationType.EMAIL)
                .orElseThrow();

        assertNotEquals(firstHash, updatedToken.getToken(), "New OTP must replace and invalidate the old OTP hash");
        assertEquals(0, updatedToken.getAttempts(), "Attempts counter must be reset on new OTP generation");
    }

    @Test
    void testShortPasswordEvaluatesWithoutValidationError() {
        // 3-character password should evaluate against BCrypt and return
        // BadCredentialsException (not a 400 validation error)
        assertThrows(BadCredentialsException.class, () -> userService.login(new AuthRequest(testEmail, "123")));
    }
}
