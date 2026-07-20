package com.tradex.api.service;
import com.tradex.api.mapper.UserMapper;

import com.tradex.api.dto.UserDTO;
import com.tradex.api.entity.User;
import com.tradex.api.entity.VerificationToken;
import com.tradex.api.enums.VerificationType;
import com.tradex.api.exception.AppException.BadRequestException;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.VerificationTokenRepository;
import com.tradex.api.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class VerificationService {

    private final VerificationTokenRepository verificationTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;
    private final EmailService emailService;
    private final UserMapper userMapper;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        VerificationToken token = validateVerificationToken(user, code, VerificationType.PASSWORD_RESET);

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setCredentialsExpired(false);
        verificationTokenRepository.delete(token);

        log.info("Password successfully reset for user: {}", email);
    }

    @Transactional
    public UserDTO verifyEmail(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        VerificationToken token = validateVerificationToken(user, code, VerificationType.EMAIL);

        user.setEmailVerified(true);
        verificationTokenRepository.delete(token);

        log.info("Email verified for user: {}", email);

        return userMapper.toDTO(user);
    }

    @Transactional
    public UserDTO verifyPhone(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (!hasPhone(user)) {
            throw new BadRequestException("No phone number associated with this account");
        }

        // Lock token row during verification to prevent race conditions
        VerificationToken token = validateVerificationToken(user, code, VerificationType.PHONE);

        user.setPhoneVerified(true);
        verificationTokenRepository.delete(token);

        log.info("Phone verified for user: {}", email);

        return userMapper.toDTO(user);
    }

    @Transactional
    public void resendCode(String email, VerificationType type) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        createVerificationToken(user, type);
    }

    @Transactional
    public void createVerificationToken(User user, VerificationType type) {
        String otp = generateOtp();
        String hashedOtp = hashOtp(otp);
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(appProperties.getOtp().getExpiryMinutes());

        Optional<VerificationToken> existingTokenOpt = verificationTokenRepository.findByUserAndTypeForUpdate(user,
                type);
        if (existingTokenOpt.isPresent()) {
            VerificationToken existing = existingTokenOpt.get();
            LocalDateTime createdAt = existing.getExpiryTime().minusMinutes(appProperties.getOtp().getExpiryMinutes());
            if (createdAt.plusSeconds(appProperties.getOtp().getResendCooldownSeconds()).isAfter(LocalDateTime.now())) {
                throw new BadRequestException(
                        "Please wait at least " + appProperties.getOtp().getResendCooldownSeconds() + " seconds before requesting a new verification code");
            }
            existing.setToken(hashedOtp);
            existing.setExpiryTime(expiryTime);
            existing.setAttempts(0);
        } else {
            VerificationToken token = new VerificationToken(user, hashedOtp, type, expiryTime);
            verificationTokenRepository.save(token);
        }

        // Send OTP via email based on type
        if (type == VerificationType.EMAIL) {
            emailService.sendOtpEmail(user.getEmail(), otp);
        } else if (type == VerificationType.PASSWORD_RESET) {
            emailService.sendPasswordResetEmail(user.getEmail(), otp);
        }

        log.debug("Generated {} verification OTP for user {}",
                type.name(),
                user.getEmail());
    }

    private VerificationToken validateVerificationToken(
            User user,
            String code,
            VerificationType type) {

        VerificationToken token = verificationTokenRepository
                .findByUserAndTypeForUpdate(user, type)
                .orElseThrow(() -> new BadRequestException("No active verification token found"));

        // Expire token automatically on check
        if (token.getExpiryTime().isBefore(LocalDateTime.now())) {
            verificationTokenRepository.delete(token);
            throw new BadRequestException("Verification token expired");
        }

        // Rate limit verification attempts
        if (token.getAttempts() >= appProperties.getOtp().getMaxAttempts()) {
            verificationTokenRepository.delete(token);
            throw new BadRequestException("Verification token blocked");
        }

        if (!hashOtp(code).equals(token.getToken())) {
            // Increment attempts atomically inside pessimistic lock
            token.setAttempts(token.getAttempts() + 1);
            verificationTokenRepository.save(token);

            if (token.getAttempts() >= appProperties.getOtp().getMaxAttempts()) {
                verificationTokenRepository.delete(token);
                throw new BadRequestException("Verification token blocked");
            }

            throw new BadRequestException("Invalid verification code");
        }

        return token;
    }

    private boolean hasPhone(User user) {
        return user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank();
    }

    private String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private String hashOtp(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otp.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            log.error("Failed to hash OTP: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed to hash OTP", e);
        }
    }
}
