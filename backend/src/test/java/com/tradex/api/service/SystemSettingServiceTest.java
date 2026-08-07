package com.tradex.api.service;

import com.tradex.api.dto.SystemSettingDTO;
import com.tradex.api.entity.SystemSetting;
import com.tradex.api.repository.SystemSettingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)

class SystemSettingServiceTest {

    @Mock
    private SystemSettingRepository systemSettingRepository;

    @InjectMocks
    private SystemSettingService systemSettingService;

    @Test
    void testInitAndGetSettings() {
        SystemSetting settings = new SystemSetting();
        settings.setWelcomeCoinsAmount(500L);
        when(systemSettingRepository.findById(1L)).thenReturn(Optional.of(settings));

        systemSettingService.init();
        SystemSetting retrieved = systemSettingService.getSettings();

        assertEquals(500L, retrieved.getWelcomeCoinsAmount());
    }

    @Test
    void testGetSettingsDefault() {
        when(systemSettingRepository.findById(1L)).thenReturn(Optional.empty());
        SystemSetting settings = new SystemSetting();
        when(systemSettingRepository.save(any(SystemSetting.class))).thenReturn(settings);

        systemSettingService.refreshCache();
        SystemSetting retrieved = systemSettingService.getSettings();

        assertNotNull(retrieved);
        assertTrue(retrieved.isWelcomeCoinsEnabled());
    }

    @Test
    void testUpdateSettings() {
        SystemSetting existing = new SystemSetting();
        when(systemSettingRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(systemSettingRepository.save(any(SystemSetting.class))).thenReturn(existing);

        SystemSettingDTO dto = new SystemSettingDTO(
                new SystemSettingDTO.WelcomeSettings(true, 2000L),
                new SystemSettingDTO.ReferralSettings(true, 500L, 200L, 100L, true, 50L, 3),
                new SystemSettingDTO.VerificationSettings(false, false),
                new SystemSettingDTO.DepositRewardSettings(true, new java.math.BigDecimal("100.00"),
                        new java.math.BigDecimal("500.00")),
                new SystemSettingDTO.PointsConversionSettings(true, new java.math.BigDecimal("10.00")),
                new SystemSettingDTO.EmailSettings("smtp.gmail.com", 587, "", "", "noreply@tradex.com", "TradeX",
                        false),
                new SystemSettingDTO.GeneralSettings("Asia/Kolkata", "INR"));
        SystemSettingDTO updated = systemSettingService.updateSettings(dto);

        assertEquals(2000L, updated.welcome().welcomeCoinsAmount());
    }
}
