package com.tradex.api.service;

import com.tradex.api.config.AppProperties;
import com.tradex.api.entity.SystemSetting;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private SystemSettingService systemSettingService;

    @Mock
    private AppProperties appProperties;

    @InjectMocks
    private EmailService emailService;

    private SystemSetting settings;
    private AppProperties.Otp otpProperties;

    @BeforeEach
    void setUp() {
        settings = new SystemSetting();
        settings.setEmailNotificationsEnabled(false);
        settings.setSmtpHost("localhost");
        settings.setSmtpPort(587);
        settings.setSmtpUsername("user");
        settings.setSmtpPassword("pass");
        settings.setSmtpFromEmail("test@tradex.com");
        settings.setSmtpFromName("TradeX Test");

        otpProperties = new AppProperties.Otp();
        otpProperties.setExpiryMinutes(5);

        lenient().when(appProperties.getOtp()).thenReturn(otpProperties);
    }

    @Test
    void testSendOtpEmailDisabled() {
        settings.setEmailNotificationsEnabled(false);
        when(systemSettingService.getSettings()).thenReturn(settings);

        emailService.sendOtpEmail("user@example.com", "123456");

        verify(systemSettingService, times(1)).getSettings();
    }

    @Test
    void testSendPasswordResetEmailDisabled() {
        settings.setEmailNotificationsEnabled(false);
        when(systemSettingService.getSettings()).thenReturn(settings);

        emailService.sendPasswordResetEmail("user@example.com", "654321");

        verify(systemSettingService, times(1)).getSettings();
    }

    @Test
    void testSendOtpEmailEnabledButFailsGracefully() {
        settings.setEmailNotificationsEnabled(true);
        when(systemSettingService.getSettings()).thenReturn(settings);

        assertDoesNotThrow(() -> {
            emailService.sendOtpEmail("user@example.com", "123456");
        });
    }

    @Test
    void testSendPasswordResetEmailEnabledButFailsGracefully() {
        settings.setEmailNotificationsEnabled(true);
        when(systemSettingService.getSettings()).thenReturn(settings);

        assertDoesNotThrow(() -> {
            emailService.sendPasswordResetEmail("user@example.com", "654321");
        });
    }
}
