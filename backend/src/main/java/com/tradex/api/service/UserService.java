package com.tradex.api.service;

import com.tradex.api.dto.AuthRequest;
import com.tradex.api.dto.AuthResponse;
import com.tradex.api.dto.SignupRequest;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.entity.PointsTransaction;
import com.tradex.api.entity.SystemSetting;
import com.tradex.api.entity.User;
import com.tradex.api.enums.PointsTransactionType;
import com.tradex.api.enums.Role;
import com.tradex.api.enums.VerificationType;
import com.tradex.api.exception.AppException.ConflictException;
import com.tradex.api.exception.AppException.ForbiddenException;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.repository.UserRepository;
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

    // ── User Retrieval & Profiling ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserDTO getUserProfile(String email) {
        return new UserDTO(getUserByEmail(email));
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

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        validateEmailUniqueness(request.email());

        User user = buildUser(request);
        userRepository.save(user);

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

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (user.isLocked()) {
            throw new ForbiddenException("Your account has been locked. Please contact support.");
        }
        if (!user.isEnabled()) {
            throw new ForbiddenException("Your account has been disabled. Please contact support.");
        }
        if (user.isCredentialsExpired()) {
            throw new ForbiddenException("Your login credentials have expired. Please reset your password.");
        }

        validateEmailVerification(user);
        log.info("User logged in: {}", user.getEmail());

        return buildAuthResponse(user);
    }

    public void validateEmailVerification(User user) {
        SystemSetting settings = systemSettingService.getSettings();
        if (settings.isEmailVerificationEnabled() && !user.isEmailVerified()) {
            throw new ForbiddenException("Email verification required");
        }
    }

    public AuthResponse buildAuthResponse(User user) {
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail());
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
        long points = settings.isWelcomeCoinsEnabled() ? settings.getWelcomeCoinsAmount() : 0L;
        user.setPointsBalance(points);
    }

    private void attachReferrer(User user, String referralCode) {
        if (referralCode == null || referralCode.isBlank()) {
            return;
        }

        String normalizedCode = referralCode.trim().toUpperCase();
        userRepository.findByReferralCode(normalizedCode).ifPresentOrElse(
                referrer -> {
                    if (referrer.getEmail().equalsIgnoreCase(user.getEmail())) {
                        log.warn("User attempted to refer themselves: {}", user.getEmail());
                        return;
                    }
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
                () -> log.warn("Invalid referral code used: {}", normalizedCode)
        );
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
                "Welcome bonus for registration"
        );
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
                    }
            );
        } else {
            referralService.processReferralRewardsAsync(userId);
        }
    }

    private void validateEmailUniqueness(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already taken");
        }
    }

    private String normalizeAccountNumber(String accountNumber) {
        return (accountNumber == null || accountNumber.isBlank()) ? null : accountNumber.trim().toUpperCase();
    }

    private boolean hasPhone(User user) {
        return user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank();
    }

    private String clean(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
