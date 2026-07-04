package com.tradex.api.service;

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

    private VerificationService verificationService;
    private com.tradex.api.config.AppProperties appProperties;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User("test@example.com", "encoded");
        user.setId(1L);
        user.setRole(Role.USER);
        appProperties = new com.tradex.api.config.AppProperties();
        verificationService = new VerificationService(
            verificationTokenRepository,
            userRepository,
            passwordEncoder,
            appProperties,
            emailService
        );
    }

    @Test
    void testVerifyEmailSuccess() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        VerificationToken token = new VerificationToken(
                user, "hashed_code", VerificationType.EMAIL, LocalDateTime.now().plusMinutes(10));
        when(verificationTokenRepository.findByUserAndTypeForUpdate(user, VerificationType.EMAIL)).thenReturn(Optional.of(token));
        when(passwordEncoder.matches("654321", "hashed_code")).thenReturn(true);

        UserDTO dto = verificationService.verifyEmail("test@example.com", "654321");
        assertTrue(dto.emailVerified());
        verify(verificationTokenRepository).delete(token);
    }

    @Test
    void testVerifyEmailSuccessWithCorrectOtp() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        VerificationToken token = new VerificationToken(
                user, "hashed_code", VerificationType.EMAIL, LocalDateTime.now().plusMinutes(10));
        when(verificationTokenRepository.findByUserAndTypeForUpdate(user, VerificationType.EMAIL)).thenReturn(Optional.of(token));
        when(passwordEncoder.matches("123456", "hashed_code")).thenReturn(true);

        UserDTO dto = verificationService.verifyEmail("test@example.com", "123456");
        assertTrue(dto.emailVerified());
        verify(verificationTokenRepository).delete(token);
    }

    @Test
    void testVerifyEmailFailureInvalidCode() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        VerificationToken token = new VerificationToken(
                user, "hashed_code", VerificationType.EMAIL, LocalDateTime.now().plusMinutes(10));
        when(verificationTokenRepository.findByUserAndTypeForUpdate(user, VerificationType.EMAIL)).thenReturn(Optional.of(token));
        when(passwordEncoder.matches("wrongcode", "hashed_code")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> verificationService.verifyEmail("test@example.com", "wrongcode"));
    }

    @Test
    void testVerifyPhoneSuccess() {
        user.setPhoneNumber("+1234567890");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        VerificationToken token = new VerificationToken(
                user, "hashed_code", VerificationType.PHONE, LocalDateTime.now().plusMinutes(10));
        when(verificationTokenRepository.findByUserAndTypeForUpdate(user, VerificationType.PHONE)).thenReturn(Optional.of(token));
        when(passwordEncoder.matches("654321", "hashed_code")).thenReturn(true);

        UserDTO dto = verificationService.verifyPhone("test@example.com", "654321");
        assertTrue(dto.phoneVerified());
        verify(verificationTokenRepository).delete(token);
    }

    @Test
    void testVerifyPhoneSuccessWithCorrectOtp() {
        user.setPhoneNumber("+1234567890");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        VerificationToken token = new VerificationToken(
                user, "hashed_code", VerificationType.PHONE, LocalDateTime.now().plusMinutes(10));
        when(verificationTokenRepository.findByUserAndTypeForUpdate(user, VerificationType.PHONE)).thenReturn(Optional.of(token));
        when(passwordEncoder.matches("123456", "hashed_code")).thenReturn(true);

        UserDTO dto = verificationService.verifyPhone("test@example.com", "123456");
        assertTrue(dto.phoneVerified());
        verify(verificationTokenRepository).delete(token);
    }
}

