package com.tradex.api.service;

import com.tradex.api.dto.AuthRequest;
import com.tradex.api.dto.AuthResponse;
import com.tradex.api.dto.SignupRequest;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.entity.*;
import com.tradex.api.enums.*;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.tradex.api.mapper.UserMapper;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ReferralService referralService;

    @Mock
    private SystemSettingService systemSettingService;

    @Mock
    private PointsTransactionRepository pointsTransactionRepository;

    @Mock
    private VerificationService verificationService;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    private User user;
    private SystemSetting settings;

    @BeforeEach
    void setUp() {
        lenient().when(userMapper.toDTO(any())).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            if (u == null) return null;
            return new UserDTO(
                u.getId(),
                u.getEmail(),
                u.getReferralCode(),
                u.getPointsBalance(),
                u.getReferralPath(),
                u.getReferredBy() != null ? u.getReferredBy().getEmail() : null,
                u.getPhoneNumber(),
                u.getAccountNumber(),
                u.getRole() != null ? u.getRole().name() : "USER",
                0L,
                u.isEmailVerified(),
                u.isPhoneVerified(),
                u.getWithdrawableBalance(),
                u.getBonusBalance(),
                u.isEnabled(),
                u.isLocked(),
                java.util.Collections.emptyList()
            );
        });
        user = new User("test@example.com", "password");
        settings = new SystemSetting();
        user.setRole(Role.USER);
        user.setPointsBalance(100L);
        user.setReferralCode("CODE");
        user.setReferralPath(".1.");

        settings.setWelcomeCoinsEnabled(true);
        settings.setWelcomeCoinsAmount(1000L);
        settings.setEmailVerificationEnabled(false);
    }

    @Test
    void testGetUserProfile() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        UserDTO dto = userService.getUserProfile("test@example.com");
        assertEquals("test@example.com", dto.email());
        assertEquals("CODE", dto.referralCode());
    }

    @Test
    void testGetAllUsers() {
        User admin = new User("admin@example.com", "encoded");
        admin.setRole(Role.SUPER_ADMIN);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(userRepository.findAllWithReferredBy()).thenReturn(List.of(user));

        List<UserDTO> list = userService.getAllUsers("admin@example.com");
        assertEquals(1, list.size());
        assertEquals("test@example.com", list.get(0).email());
    }

    @Test
    void testSignupSuccess() {
        SignupRequest req = new SignupRequest("new@example.com", "pass", null, "+1234567890", "ACC12345");

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("pass")).thenReturn("encoded");
        when(referralService.generateUniqueReferralCode()).thenReturn("CODE");
        when(systemSettingService.getSettings()).thenReturn(settings);
        when(referralService.buildReferralPath(any(User.class))).thenReturn(".2.");
        when(jwtUtil.generateToken(eq("new@example.com"), eq("USER"), anyList())).thenReturn("token");

        AuthResponse resp = userService.signup(req);

        assertEquals("token", resp.token());
        assertEquals("new@example.com", resp.email());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testLoginSuccess() {
        AuthRequest req = new AuthRequest("test@example.com", "pass");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass", "password")).thenReturn(true);
        when(systemSettingService.getSettings()).thenReturn(settings);
        when(jwtUtil.generateToken(eq("test@example.com"), eq("USER"), anyList())).thenReturn("token");

        AuthResponse resp = userService.login(req);

        assertEquals("token", resp.token());
        assertEquals("test@example.com", resp.email());
    }

    @Test
    void testLoginFailure() {
        AuthRequest req = new AuthRequest("test@example.com", "wrong");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "password")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> userService.login(req));
    }
}
