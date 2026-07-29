package com.tradex.api.service;

import com.tradex.api.dto.UserDTO;
import com.tradex.api.enums.Role;
import com.tradex.api.entity.SystemSetting;
import com.tradex.api.entity.User;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.repository.ReferralRewardRepository;
import com.tradex.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tradex.api.mapper.UserMapper;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class ReferralServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReferralRewardRepository rewardRepository;

    @Mock
    private SystemSettingService systemSettingService;

    @Mock
    private PointsTransactionRepository pointsTransactionRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private ReferralService referralService;

    private User user;

    @BeforeEach
    void setUp() {
        lenient().when(userMapper.toDTO(any())).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            if (u == null) return null;
            return new UserDTO(
                u.getId(),
                u.getEmail(),
                null,
                u.getPointsBalance(),
                null,
                null,
                null,
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
        user = new User("test@example.com", "encoded");
        user.setId(1L);
        user.setRole(Role.USER);
    }

    @Test
    void testGetReferralTree() {
        user.setReferralPath(".1.");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        User downstream = new User("user2@example.com", "encoded");
        downstream.setId(2L);
        downstream.setRole(Role.USER);
        downstream.setReferralPath(".1.2.");
        downstream.setReferredBy(user);

        when(userRepository.findByReferralPathStartingWith(".1.")).thenReturn(List.of(user, downstream));

        List<UserDTO> tree = referralService.getReferralTree(1L);
        assertEquals(1, tree.size());
        assertEquals("user2@example.com", tree.get(0).email());
    }

    @Test
    void testGetReferralTreeNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> referralService.getReferralTree(999L));
    }

    @Test
    void testGetMyReferralsNotFound() {
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException
        .class,
                () -> referralService.getMyReferrals("notfound@example.com"));
    }

    @Test
    void testGetMyTransactionsNotFound() {
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> referralService.getMyTransactions("notfound@example.com"));
    }

    @Test
    void testProcessReferralRewardsReferrerNotFound() {
        User newUser = new User();
        newUser.setId(1L);
        newUser.setEmail("new@example.com");
        User referrer = new User();
        referrer.setId(2L);
        referrer.setEmail("referrer@example.com");
        newUser.setReferredBy(referrer);

        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(newUser));
        when(rewardRepository.existsByReferredUserId(1L)).thenReturn(false);

        SystemSetting settings = new SystemSetting();
        settings.setReferralCoinsEnabled(true);
        settings.setReferralCoinsL1Amount(100L);
        when(systemSettingService.getSettings()).thenReturn(settings);

        when(userRepository.findAllByIdForUpdate(List.of(2L))).thenReturn(List.of());

        assertThrows(ResourceNotFoundException.class, 
            () -> referralService.processReferralRewards(1L));
    }

    @Test
    void testProcessReferralRewardsAsync() {
        User newUser = new User();
        newUser.setId(1L);
        newUser.setEmail("new@example.com");

        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(newUser));
        when(rewardRepository.existsByReferredUserId(1L)).thenReturn(false);

        referralService.processReferralRewardsAsync(1L);

        verify(userRepository, times(1)).findByIdForUpdate(1L);
    }

    @Test
    void testProcessReferralRewardsAsyncWithRetries() {
        User newUser = new User();
        newUser.setId(1L);
        newUser.setEmail("new@example.com");

        when(userRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(newUser));
        when(rewardRepository.existsByReferredUserId(1L)).thenReturn(false);

        referralService.processReferralRewardsAsync(1L);

        verify(userRepository, times(3)).findByIdForUpdate(1L);
    }

    @Test
    void testProcessReferralRewardsAsyncExhaustedRetries() {
        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
            referralService.processReferralRewardsAsync(1L)
        );

        verify(userRepository, times(3)).findByIdForUpdate(1L);
    }
}
