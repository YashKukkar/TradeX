package com.tradex.api.service;
import com.tradex.api.mapper.UserMapper;
import com.tradex.api.config.AppProperties;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.entity.*;
import com.tradex.api.enums.*;
import com.tradex.api.exception.AppException.BadRequestException;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.VerificationTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificationServiceTest {

    @Mock
    private VerificationTokenRepository verificationTokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @Mock
    private UserMapper userMapper;

    private VerificationService verificationService;
    private AppProperties appProperties;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User("test@example.com", "encoded");
        user.setId(1L);
        user.setRole(Role.USER);
        appProperties = new com.tradex.api.config.AppProperties();
        appProperties.getOtp().setExpiryMinutes(10);
        appProperties.getOtp().setMaxAttempts(3);
        appProperties.getOtp().setResendCooldownSeconds(60);

        lenient().when(userMapper.toDTO(any())).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            return new UserDTO(
                u.getId(),
                u.getEmail(),
                u.getReferralCode(),
                u.getPointsBalance(),
                u.getReferralPath(),
                u.getReferredBy() != null ? u.getReferredBy().getEmail() : null,
                u.getPhoneNumber(),
                u.getRole() != null ? u.getRole().name() : "USER",
                System.currentTimeMillis() / 1000,
                u.isEmailVerified(),
                u.isPhoneVerified(),
                u.getWithdrawableBalance(),
                u.getBonusBalance(),
                u.isEnabled(),
                u.isLocked(),
                java.util.Collections.emptyList()
            );
        });

        verificationService = new VerificationService(
            verificationTokenRepository,
            userRepository,
            passwordEncoder,
            appProperties,
            emailService,
            userMapper
        );
    }

    private String hashOtp(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otp.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void testVerifyEmailSuccess() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        VerificationToken token = new VerificationToken(
                user, hashOtp("654321"), VerificationType.EMAIL, LocalDateTime.now().plusMinutes(10));
        when(verificationTokenRepository.findByUserAndTypeForUpdate(user, VerificationType.EMAIL)).thenReturn(Optional.of(token));

        UserDTO dto = verificationService.verifyEmail("test@example.com", "654321");
        assertTrue(dto.emailVerified());
        verify(verificationTokenRepository).delete(token);
    }

    @Test
    void testVerifyEmailSuccessWithCorrectOtp() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        VerificationToken token = new VerificationToken(
                user, hashOtp("123456"), VerificationType.EMAIL, LocalDateTime.now().plusMinutes(10));
        when(verificationTokenRepository.findByUserAndTypeForUpdate(user, VerificationType.EMAIL)).thenReturn(Optional.of(token));

        UserDTO dto = verificationService.verifyEmail("test@example.com", "123456");
        assertTrue(dto.emailVerified());
        verify(verificationTokenRepository).delete(token);
    }

    @Test
    void testVerifyEmailFailureInvalidCode() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        VerificationToken token = new VerificationToken(
                user, hashOtp("correct_code"), VerificationType.EMAIL, LocalDateTime.now().plusMinutes(10));
        when(verificationTokenRepository.findByUserAndTypeForUpdate(user, VerificationType.EMAIL)).thenReturn(Optional.of(token));

        assertThrows(BadRequestException.class, () -> verificationService.verifyEmail("test@example.com", "wrongcode"));
    }

    @Test
    void testVerifyPhoneSuccess() {
        user.setPhoneNumber("+1234567890");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        VerificationToken token = new VerificationToken(
                user, hashOtp("654321"), VerificationType.PHONE, LocalDateTime.now().plusMinutes(10));
        when(verificationTokenRepository.findByUserAndTypeForUpdate(user, VerificationType.PHONE)).thenReturn(Optional.of(token));

        UserDTO dto = verificationService.verifyPhone("test@example.com", "654321");
        assertTrue(dto.phoneVerified());
        verify(verificationTokenRepository).delete(token);
    }

    @Test
    void testVerifyPhoneSuccessWithCorrectOtp() {
        user.setPhoneNumber("+1234567890");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        VerificationToken token = new VerificationToken(
                user, hashOtp("123456"), VerificationType.PHONE, LocalDateTime.now().plusMinutes(10));
        when(verificationTokenRepository.findByUserAndTypeForUpdate(user, VerificationType.PHONE)).thenReturn(Optional.of(token));

        UserDTO dto = verificationService.verifyPhone("test@example.com", "123456");
        assertTrue(dto.phoneVerified());
        verify(verificationTokenRepository).delete(token);
    }
}
