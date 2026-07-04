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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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

    @InjectMocks
    private UserService userService;

    private User user;
    private SystemSetting settings;

    @BeforeEach
    void setUp() {
        user = new User("test@example.com", "encoded");
        user.setId(1L);
        user.setRole(Role.USER);
        user.setPointsBalance(100L);
        user.setReferralCode("CODE");
        user.setReferralPath(".1.");

        settings = new SystemSetting();
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
        when(userRepository.findAllWithReferredBy()).thenReturn(List.of(user));

        List<UserDTO> list = userService.getAllUsers();
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
        when(jwtUtil.generateToken("new@example.com", "USER")).thenReturn("token");

        AuthResponse resp = userService.signup(req);

        assertEquals("token", resp.token());
        assertEquals("new@example.com", resp.email());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testLoginSuccess() {
        AuthRequest req = new AuthRequest("test@example.com", "pass");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass", "encoded")).thenReturn(true);
        when(systemSettingService.getSettings()).thenReturn(settings);
        when(jwtUtil.generateToken("test@example.com", "USER")).thenReturn("token");

        AuthResponse resp = userService.login(req);

        assertEquals("token", resp.token());
        assertEquals("test@example.com", resp.email());
    }

    @Test
    void testLoginFailure() {
        AuthRequest req = new AuthRequest("test@example.com", "wrong");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> userService.login(req));
    }
}
