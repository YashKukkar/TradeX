package com.tradex.api.service;

import com.tradex.api.dto.AuthRequest;
import com.tradex.api.dto.AuthResponse;
import com.tradex.api.dto.SignupRequest;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.entity.*;
import com.tradex.api.enums.*;
import com.tradex.api.exception.AppException.*;
import com.tradex.api.repository.*;
import com.tradex.api.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ReferralService referralService;
    private final SystemSettingService systemSettingService;
    private final PointsTransactionRepository pointsTransactionRepository;
    private final VerificationService verificationService;
    private final JwtUtil jwtUtil;

    @Transactional(readOnly = true)
    public UserDTO getUserProfile(String email) {
        User user = getUserByEmail(email);
        return new UserDTO(user);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return new UserDTO(user);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAllWithReferredBy()
                .stream()
                .map(UserDTO::new)
                .toList();
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    public void validateEmailVerification(User user) {
        SystemSetting settings = systemSettingService.getSettings();
        if (settings.isEmailVerificationEnabled() && !user.isEmailVerified()) {
            throw new ForbiddenException("Email verification required");
        }
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        validateEmailUniqueness(request.email());

        User user = buildUser(request);
        userRepository.save(user);

        // Reduce unnecessary DB saves: Setting referral path on the managed user entity will be dirty-checked
        // and saved at the end of the transaction automatically without requiring another save() call!
        user.setReferralPath(referralService.buildReferralPath(user));

        createWelcomeTransactionIfEligible(user);

        verificationService.createVerificationToken(user, VerificationType.EMAIL);

        if (hasPhone(user)) {
            verificationService.createVerificationToken(user, VerificationType.PHONE);
        }

        triggerReferralRewardsAfterCommit(user);

        log.info("User registered successfully: {}", user.getEmail());

        return buildAuthResponse(user);
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        validateEmailVerification(user);

        log.info("User logged in: {}", user.getEmail());

        return buildAuthResponse(user);
    }

    public AuthResponse buildAuthResponse(User user) {
        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name());

        return new AuthResponse(token, user.getEmail());
    }

    private void validateEmailUniqueness(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already taken");
        }
    }

    private User buildUser(SignupRequest request) {
        User user = new User();
        user.setEmail(request.email().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setReferralCode(referralService.generateUniqueReferralCode());
        user.setPhoneNumber(clean(request.phoneNumber()));
        user.setAccountNumber(normalizeAccountNumber(request.accountNumber()));
        user.setEmailVerified(false);
        user.setPhoneVerified(false);
        user.setRole(Role.USER);

        applyWelcomeBonus(user);
        attachReferrer(user, request.referralCode());

        return user;
    }

    private void applyWelcomeBonus(User user) {
        SystemSetting settings = systemSettingService.getSettings();
        long points = settings.isWelcomeCoinsEnabled()
                ? settings.getWelcomeCoinsAmount()
                : 0L;
        user.setPointsBalance(points);
    }

    private void attachReferrer(User user, String referralCode) {
        if (referralCode == null || referralCode.isBlank()) {
            return;
        }

        String normalizedCode = referralCode.trim().toUpperCase();

        userRepository.findByReferralCode(normalizedCode)
                .ifPresentOrElse(
                        referrer -> {
                            if (referrer.getEmail().equalsIgnoreCase(user.getEmail())) {
                                log.warn("User attempted to refer themselves: {}", user.getEmail());
                                return;
                            }
                            // Prevent circular assignment: if the referrer's path contains the user's ID
                            if (user.getId() != null && referrer.getReferralPath() != null) {
                                String searchToken = "." + user.getId() + ".";
                                if (referrer.getReferralPath().contains(searchToken)) {
                                    log.warn("Circular referral assignment detected! Referrer {} is already referred by User {}", 
                                             referrer.getEmail(), user.getEmail());
                                    return;
                                }
                            }
                            user.setReferredBy(referrer);
                        },
                        () -> log.warn("Invalid referral code used: {}", normalizedCode));
    }

    private void createWelcomeTransactionIfEligible(User user) {
        if (user.getPointsBalance() <= 0) {
            return;
        }

        PointsTransaction tx = new PointsTransaction(
                user,
                user.getPointsBalance(),
                user.getPointsBalance(),
                PointsTransactionType.WELCOME_BONUS,
                "Welcome bonus for registration");

        pointsTransactionRepository.save(tx);
    }

    private void triggerReferralRewardsAfterCommit(User user) {
        if (user.getReferredBy() == null) {
            return;
        }

        Long userId = user.getId();

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            referralService.processReferralRewardsAsync(userId);
                        }
                    });
        } else {
            referralService.processReferralRewardsAsync(userId);
        }
    }

    private String normalizeAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) {
            return null;
        }
        return accountNumber.trim().toUpperCase();
    }

    private boolean hasPhone(User user) {
        return user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank();
    }

    private String clean(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
