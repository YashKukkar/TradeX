package com.tradex.api.service;

import com.tradex.api.entity.*;
import com.tradex.api.enums.*;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.PointsTransactionRepository;
import com.tradex.api.repository.ReferralRewardRepository;
import com.tradex.api.dto.PointsTransactionDTO;
import com.tradex.api.dto.ReferralRewardDTO;
import com.tradex.api.dto.SystemSettingDTO;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@Sql("/test-data.sql")
class ReferralServiceIntegrationTest {

    @Autowired
    private ReferralService referralService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PointsTransactionRepository pointsTransactionRepository;

    @Autowired
    private ReferralRewardRepository referralRewardRepository;

    @Test
    void testProcessReferralRewards() {
        User newUser = new User();
        newUser.setEmail("newuser@example.com");
        newUser.setPassword("pass");
        newUser.setPointsBalance(0L);
        newUser.setRole(Role.USER);
        
        User referrer = userRepository.findById(103L).orElseThrow();
        newUser.setReferredBy(referrer);
        newUser = userRepository.save(newUser);
        
        referralService.processReferralRewards(newUser.getId());
        
        assertEquals(500L, userRepository.findById(103L).orElseThrow().getPointsBalance());
        assertEquals(200L, userRepository.findById(102L).orElseThrow().getPointsBalance());
        assertEquals(100L, userRepository.findById(101L).orElseThrow().getPointsBalance());
        assertEquals(50L, userRepository.findById(100L).orElseThrow().getPointsBalance());
    }

    @Test
    void testProcessReferralRewardsAsync() throws Exception {
        User newUser = new User();
        newUser.setEmail("newasyncuser@example.com");
        newUser.setPassword("pass");
        newUser.setPointsBalance(0L);
        newUser.setRole(Role.USER);
        
        User referrer = userRepository.findById(103L).orElseThrow();
        newUser.setReferredBy(referrer);
        newUser = userRepository.save(newUser);
        
        referralService.processReferralRewardsAsync(newUser.getId());
        Thread.sleep(200);
    }

    @Test
    void testGetMyTransactions() {
        User rootUser = userRepository.findById(100L).orElseThrow();
        PointsTransaction tx = new PointsTransaction(
            rootUser, 1000L, 1000L, PointsTransactionType.WELCOME_BONUS, "Welcome bonus notes"
        );
        pointsTransactionRepository.save(tx);

        List<PointsTransactionDTO> dtos = referralService.getMyTransactions(rootUser.getEmail());
        assertFalse(dtos.isEmpty());
        assertEquals(1000L, dtos.getFirst().amount());
        assertEquals("WELCOME_BONUS", dtos.getFirst().type());
        assertEquals("Welcome bonus notes", dtos.getFirst().notes());
    }

    @Test
    void testGetMyReferrals() {
        User referrer = userRepository.findById(100L).orElseThrow();
        User referred = userRepository.findById(101L).orElseThrow();
        
        ReferralReward reward = new ReferralReward(
            referrer, referred, 1, 500L, ReferralRewardStatus.CREDITED
        );
        referralRewardRepository.save(reward);

        List<ReferralRewardDTO> dtos = referralService.getMyReferrals(referrer.getEmail());
        assertFalse(dtos.isEmpty());
        assertEquals(500L, dtos.getFirst().pointsAwarded());
        assertEquals("CREDITED", dtos.getFirst().status());
    }

    @Test
    void testNormalizeReferralPath() {
        User user = userRepository.findById(100L).orElseThrow();
        user.setReferralPath(null);
        String path = referralService.normalizeReferralPath(user);
        assertEquals(".100.", path);

        user.setReferralPath("   ");
        path = referralService.normalizeReferralPath(user);
        assertEquals(".100.", path);
    }

    @Autowired
    private SystemSettingService systemSettingService;

    @Test
    void testProcessReferralRewardsAlreadyProcessed() {
        User newUser = new User();
        newUser.setEmail("alreadyprocessed@example.com");
        newUser.setPassword("pass");
        newUser.setPointsBalance(0L);
        newUser.setRole(Role.USER);
        User referrer = userRepository.findById(103L).orElseThrow();
        newUser.setReferredBy(referrer);
        newUser = userRepository.save(newUser);

        ReferralReward reward = new ReferralReward(
            referrer, newUser, 1, 500L, ReferralRewardStatus.CREDITED
        );
        referralRewardRepository.save(reward);

        referralService.processReferralRewards(newUser.getId());
        assertEquals(0L, userRepository.findById(103L).orElseThrow().getPointsBalance());
    }

    @Test
    void testProcessReferralNoReferrer() {
        User newUser = new User();
        newUser.setEmail("noreferrer@example.com");
        newUser.setPassword("pass");
        newUser.setPointsBalance(0L);
        newUser.setRole(Role.USER);
        newUser = userRepository.save(newUser);

        referralService.processReferralRewards(newUser.getId());
        assertFalse(referralRewardRepository.existsByReferredUserId(newUser.getId()));
    }

    private SystemSettingDTO createDTO(boolean referralEnabled, boolean subsequentEnabled, int limitTier) {
        return new SystemSettingDTO(
            new SystemSettingDTO.WelcomeSettings(true, 100L),
            new SystemSettingDTO.ReferralSettings(referralEnabled, 500L, 200L, 100L, subsequentEnabled, 50L, limitTier),
            new SystemSettingDTO.VerificationSettings(false, false),
            new SystemSettingDTO.DepositRewardSettings(true, new java.math.BigDecimal("100.00"), new java.math.BigDecimal("500.00")),
            new SystemSettingDTO.PointsConversionSettings(true, new java.math.BigDecimal("10.00")),
            new SystemSettingDTO.EmailSettings("smtp.gmail.com", 587, "", "", "noreply@tradex.com", "TradeX", false),
            new SystemSettingDTO.GeneralSettings("Asia/Kolkata", "INR")
        );
    }

    @Test
    void testProcessReferralRewardsSystemSettingsDisabled() {
        SystemSettingDTO original = createDTO(true, true, 3);
        systemSettingService.updateSettings(original);
        
        SystemSettingDTO disabled = createDTO(false, true, 3);
        systemSettingService.updateSettings(disabled);
        
        try {
            User newUser = new User();
            newUser.setEmail("settingsdisabled@example.com");
            newUser.setPassword("pass");
            newUser.setPointsBalance(0L);
            newUser.setRole(Role.USER);
            User referrer = userRepository.findById(103L).orElseThrow();
            newUser.setReferredBy(referrer);
            newUser = userRepository.save(newUser);
            
            referralService.processReferralRewards(newUser.getId());
            assertFalse(referralRewardRepository.existsByReferredUserId(newUser.getId()));
        } finally {
            systemSettingService.updateSettings(original);
        }
    }

    @Test
    void testProcessReferralRewardsSubsequentDisabled() {
        SystemSettingDTO original = createDTO(true, true, 3);
        systemSettingService.updateSettings(original);
        
        SystemSettingDTO subsequentDisabled = createDTO(true, false, 3);
        systemSettingService.updateSettings(subsequentDisabled);
        
        try {
            User newUser = new User();
            newUser.setEmail("subsequentdisabled@example.com");
            newUser.setPassword("pass");
            newUser.setPointsBalance(0L);
            newUser.setRole(Role.USER);
            User referrer = userRepository.findById(103L).orElseThrow();
            newUser.setReferredBy(referrer);
            newUser = userRepository.save(newUser);
            
            referralService.processReferralRewards(newUser.getId());
            
            assertEquals(500L, userRepository.findById(103L).orElseThrow().getPointsBalance());
            assertEquals(200L, userRepository.findById(102L).orElseThrow().getPointsBalance());
            assertEquals(100L, userRepository.findById(101L).orElseThrow().getPointsBalance());
            assertEquals(0L, userRepository.findById(100L).orElseThrow().getPointsBalance());
        } finally {
            systemSettingService.updateSettings(original);
        }
    }

    @Test
    void testProcessReferralRewardsLimitTierHigher() {
        SystemSettingDTO original = createDTO(true, true, 3);
        systemSettingService.updateSettings(original);
        
        SystemSettingDTO limitTierHigher = createDTO(true, true, 4);
        systemSettingService.updateSettings(limitTierHigher);
        
        try {
            User newUser = new User();
            newUser.setEmail("limittierhigher@example.com");
            newUser.setPassword("pass");
            newUser.setPointsBalance(0L);
            newUser.setRole(Role.USER);
            User referrer = userRepository.findById(103L).orElseThrow();
            newUser.setReferredBy(referrer);
            newUser = userRepository.save(newUser);
            
            referralService.processReferralRewards(newUser.getId());
            
            assertEquals(500L, userRepository.findById(103L).orElseThrow().getPointsBalance());
            assertEquals(200L, userRepository.findById(102L).orElseThrow().getPointsBalance());
            assertEquals(100L, userRepository.findById(101L).orElseThrow().getPointsBalance());
            assertEquals(100L, userRepository.findById(100L).orElseThrow().getPointsBalance());
        } finally {
            systemSettingService.updateSettings(original);
        }
    }

    @Test
    void testProcessReferralRewardsLoopDetection() {
        User userA = new User();
        userA.setEmail("usera@example.com");
        userA.setPassword("pass");
        userA.setPointsBalance(0L);
        userA.setRole(Role.USER);
        userA = userRepository.save(userA);

        User userB = new User();
        userB.setEmail("userb@example.com");
        userB.setPassword("pass");
        userB.setPointsBalance(0L);
        userB.setRole(Role.USER);
        userB.setReferredBy(userA);
        userB = userRepository.save(userB);

        userA.setReferredBy(userB);
        userA = userRepository.save(userA);

        User newUser = new User();
        newUser.setEmail("loopuser@example.com");
        newUser.setPassword("pass");
        newUser.setPointsBalance(0L);
        newUser.setRole(Role.USER);
        newUser.setReferredBy(userA);
        newUser = userRepository.save(newUser);

        referralService.processReferralRewards(newUser.getId());
    }

    @Test
    void testProcessReferralRewardsMaxDepthExceeded() {
        User current = null;
        for (int i = 1; i <= 22; i++) {
            User u = new User();
            u.setEmail("depth" + i + "@example.com");
            u.setPassword("pass");
            u.setPointsBalance(0L);
            u.setRole(Role.USER);
            if (current != null) {
                u.setReferredBy(current);
            }
            current = userRepository.save(u);
        }

        User newUser = new User();
        newUser.setEmail("deepuser@example.com");
        newUser.setPassword("pass");
        newUser.setPointsBalance(0L);
        newUser.setRole(Role.USER);
        newUser.setReferredBy(current);
        newUser = userRepository.save(newUser);

        referralService.processReferralRewards(newUser.getId());
    }

    @Test
    void testProcessReferralRewardsException() {
        assertThrows(IllegalArgumentException.class, () -> referralService.processReferralRewards(null));
        assertThrows(ResourceNotFoundException.class, () -> referralService.processReferralRewards(9999L));
    }
}
