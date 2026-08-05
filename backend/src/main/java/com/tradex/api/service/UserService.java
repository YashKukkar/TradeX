package com.tradex.api.service;

import com.tradex.api.mapper.UserMapper;
import com.tradex.api.dto.AddBankAccountRequest;
import com.tradex.api.dto.AuthRequest;
import com.tradex.api.dto.AuthResponse;
import com.tradex.api.dto.SignupRequest;
import com.tradex.api.dto.UpdateProfileRequest;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.entity.BankDetail;
import com.tradex.api.entity.PointsTransaction;
import com.tradex.api.entity.SystemSetting;
import com.tradex.api.entity.User;
import com.tradex.api.enums.PointsTransactionType;
import com.tradex.api.enums.Role;
import com.tradex.api.enums.Permission;
import com.tradex.api.enums.VerificationType;
import com.tradex.api.exception.AppException;
import com.tradex.api.exception.AppException.ConflictException;
import com.tradex.api.exception.AppException.ForbiddenException;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.security.JwtUtil;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

/**
 * Service handling user account lifecycle, authentication, profile updates, and bank details.
 * 
 * COMPLIANCE & AUDIT POLICY:
 * Account records with financial transaction histories MUST NOT be physically deleted from the database
 * to satisfy financial regulations and audit trail integrity. To delete a user/employee, use a soft-delete
 * by disabling/locking the account (i.e. setting enabled=false, locked=true) instead of executing SQL DELETEs.
 */
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
    private final UserMapper userMapper;

    // ── User Retrieval & Profiling ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserDTO getUserProfile(String email) {
        return userMapper.toDTO(getUserByEmail(email));
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Requester not found"));

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        if (requester.getRole() == Role.EMPLOYEE && user.getRole() != Role.USER) {
            throw new AppException.ForbiddenException("Employees are only permitted to view regular customers");
        }

        return userMapper.toDTO(user);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers(String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Requester not found"));

        List<User> users = userRepository.findAllWithReferredBy();
        if (requester.getRole() == Role.EMPLOYEE) {
            users = users.stream()
                    .filter(u -> u.getRole() == Role.USER)
                    .toList();
        }

        return users.stream()
                .map(userMapper::toDTO)
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
                .orElseGet(() -> {
                    log.warn("Failed login attempt: User not found for email {}", request.email());
                    throw new BadCredentialsException("Invalid email or password");
                });

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            log.warn("Failed login attempt: Incorrect password for email {}", request.email());
            throw new BadCredentialsException("Invalid email or password");
        }

        if (user.isLocked()) {
            log.warn("Failed login attempt: Account locked for email {}", user.getEmail());
            throw new ForbiddenException("Your account has been locked. Please contact support.");
        }
        if (!user.isEnabled()) {
            log.warn("Failed login attempt: Account disabled for email {}", user.getEmail());
            throw new ForbiddenException("Your account has been disabled. Please contact support.");
        }
        if (user.isCredentialsExpired()) {
            log.warn("Failed login attempt: Credentials expired for email {}", user.getEmail());
            throw new ForbiddenException("Your login credentials have expired. Please reset your password.");
        }

        validateEmailVerification(user);
        List<String> authorities = new ArrayList<>();
        authorities.add("ROLE_" + user.getRole().name());
        if (user.getRole() == Role.SUPER_ADMIN) {
            for (Permission perm : Permission.values()) {
                authorities.add(perm.getAuthority());
            }
        } else if (user.getRole() == Role.EMPLOYEE && user.getPermissions() != null) {
            for (String perm : user.getPermissions()) {
                authorities.add(perm.startsWith("PERM_") ? perm : "PERM_" + perm);
            }
        }
        List<String> logPermissions = authorities.stream()
                .filter(a -> !a.startsWith("ROLE_"))
                .map(a -> a.startsWith("PERM_") ? a.substring(5) : a)
                .toList();
        log.info("User logged in: {} | Role: {} | Permissions: {}", user.getEmail(), user.getRole(), logPermissions);

        return buildAuthResponse(user);
    }

    public void validateEmailVerification(User user) {
        SystemSetting settings = systemSettingService.getSettings();
        if (settings.isEmailVerificationEnabled() && !user.isEmailVerified()) {
            log.warn("Failed login attempt: Email verification pending for email {}", user.getEmail());
            throw new ForbiddenException("Email verification required");
        }
    }

    public AuthResponse buildAuthResponse(User user) {
        Set<String> effective = userMapper.getEffectivePermissions(user);
        List<String> permissionNames = new ArrayList<>(effective);
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), permissionNames);
        return new AuthResponse(token, user.getEmail());
    }

    private User buildUser(SignupRequest request) {
        User user = new User();
        user.setEmail(request.email().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setReferralCode(referralService.generateUniqueReferralCode());
        user.setPhoneNumber(clean(request.phoneNumber()));
        user.setEmailVerified(false);
        user.setPhoneVerified(false);
        user.setRole(Role.USER);

        String acc = normalizeAccountNumber(request.accountNumber());
        if (acc != null) {
            BankDetail bank = BankDetail.builder()
                    .user(user)
                    .accountNumber(acc)
                    .ifscCode("TEMP0123456")
                    .holderName(request.fullName())
                    .bankName("Default Partner Bank")
                    .isPrimary(true)
                    .build();
            user.getBankDetails().add(bank);
        }

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
                            log.warn(
                                    "Circular referral assignment detected! Referrer {} is already referred by User {}",
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

    @Transactional
    public UserDTO updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        String newPhone = clean(request.phoneNumber());
        if (newPhone != null && !newPhone.equals(user.getPhoneNumber())) {
            user.setPhoneNumber(newPhone);
            user.setPhoneVerified(false);
        }

        String newName = request.fullName();
        if (newName != null && !newName.equals(user.getFullName())) {
            // Future design consideration: if (user.isKycVerified()) throw new ForbiddenException("Cannot update name after KYC verification");
            user.setFullName(newName);
        }

        User saved = userRepository.save(user);
        log.info("Updated profile for user: {}", email);
        return userMapper.toDTO(saved);
    }

    @Transactional
    public UserDTO addBankAccount(String email, AddBankAccountRequest request) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        BankDetail bank = BankDetail.builder()
                .user(user)
                .accountNumber(request.accountNumber().trim().toUpperCase())
                .ifscCode(request.ifscCode().trim().toUpperCase())
                .holderName(request.holderName().trim())
                .bankName(request.bankName().trim())
                .isPrimary(request.isPrimary() || user.getBankDetails().isEmpty())
                .build();

        if (bank.isPrimary()) {
            for (BankDetail other : user.getBankDetails()) {
                other.setPrimary(false);
            }
        }

        user.getBankDetails().add(bank);
        User saved = userRepository.save(user);
        log.info("Added bank account {} for user {}", request.accountNumber(), email);
        return userMapper.toDTO(saved);
    }

    @Transactional
    public UserDTO setPrimaryBankAccount(String email, Long bankAccountId) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        boolean found = false;
        for (BankDetail bank : user.getBankDetails()) {
            if (bank.getId().equals(bankAccountId)) {
                bank.setPrimary(true);
                found = true;
            } else {
                bank.setPrimary(false);
            }
        }

        if (!found) {
            throw new ResourceNotFoundException("Bank account not found: " + bankAccountId);
        }

        User saved = userRepository.save(user);
        log.info("Set primary bank account ID {} for user {}", bankAccountId, email);
        return userMapper.toDTO(saved);
    }

    @Transactional
    public UserDTO deleteBankAccount(String email, Long bankAccountId) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        BankDetail toDelete = null;
        for (BankDetail bank : user.getBankDetails()) {
            if (bank.getId().equals(bankAccountId)) {
                toDelete = bank;
                break;
            }
        }

        if (toDelete == null) {
            throw new ResourceNotFoundException("Bank account not found: " + bankAccountId);
        }

        if (toDelete.isPrimary() && user.getBankDetails().size() > 1) {
            log.warn("Failed bank account deletion: Attempted to delete primary bank account for user {}", email);
            throw new AppException.BadRequestException(
                    "Cannot delete primary bank account. Please set another account as primary first.");
        }

        user.getBankDetails().remove(toDelete);

        if (user.getBankDetails().size() == 1) {
            user.getBankDetails().get(0).setPrimary(true);
        }

        User saved = userRepository.save(user);
        log.info("Deleted bank account ID {} for user {}", bankAccountId, email);
        return userMapper.toDTO(saved);
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            log.warn("Failed password change attempt: Incorrect current password for user {}", email);
            throw new AppException.BadRequestException("Incorrect current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password updated successfully for user: {}", email);
    }
}
