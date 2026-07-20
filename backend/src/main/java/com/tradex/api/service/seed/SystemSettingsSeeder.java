package com.tradex.api.service.seed;

import com.tradex.api.config.AppProperties;
import com.tradex.api.entity.SystemSetting;
import com.tradex.api.repository.SystemSettingRepository;
import com.tradex.api.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class SystemSettingsSeeder {

    private final SystemSettingRepository systemSettingRepository;
    private final SystemSettingService systemSettingService;
    private final AppProperties appProperties;

    @Transactional
    public void seedSettings() {
        AppProperties.Seed seedConfig = appProperties.getSeed();
        SystemSetting settings = systemSettingRepository.findById(1L).orElse(null);
        if (settings == null) {
            log.info("Seeding default system settings");
            settings = new SystemSetting();
            settings.setId(1L);
            settings.setWelcomeCoinsEnabled(true);
            settings.setWelcomeCoinsAmount(seedConfig.getWelcomeBonus());
            settings.setReferralCoinsEnabled(true);
            settings.setReferralCoinsL1Amount(seedConfig.getReferralCoinsL1());
            settings.setReferralCoinsL2Amount(seedConfig.getReferralCoinsL2());
            settings.setReferralCoinsL3Amount(seedConfig.getReferralCoinsL3());
            settings.setReferralCoinsSubsequentEnabled(true);
            settings.setReferralCoinsSubsequentAmount(seedConfig.getReferralCoinsSubsequent());
            settings.setReferralCoinsLimitTier(seedConfig.getReferralCoinsLimitTier());
            settings.setEmailVerificationEnabled(false);
            settings.setPhoneVerificationEnabled(false);
            settings.setEmailNotificationsEnabled(true);
            settings.setRedirectEmailAddress(seedConfig.getRedirectEmailAddress());
            settings.setSmtpUsername(seedConfig.getSmtpUsername());
            settings.setSmtpPassword(seedConfig.getSmtpPassword());
            settings.setSmtpFromEmail(seedConfig.getSmtpFromEmail());
            settings.setSmtpFromName(seedConfig.getSmtpFromName());
            systemSettingRepository.save(settings);
        } else {
            boolean updated = false;
            if (!settings.isEmailNotificationsEnabled()) {
                settings.setEmailNotificationsEnabled(true);
                updated = true;
            }
            if (settings.getSmtpUsername() == null || settings.getSmtpUsername().isBlank()) {
                settings.setSmtpUsername(seedConfig.getSmtpUsername());
                updated = true;
            }
            if (settings.getSmtpPassword() == null || settings.getSmtpPassword().isBlank()) {
                settings.setSmtpPassword(seedConfig.getSmtpPassword());
                updated = true;
            }
            if (settings.getSmtpFromEmail() == null || settings.getSmtpFromEmail().isBlank() || "support@tradex.com".equalsIgnoreCase(settings.getSmtpFromEmail())) {
                settings.setSmtpFromEmail(seedConfig.getSmtpFromEmail());
                updated = true;
            }
            if (settings.getReferralCoinsLimitTier() == null || settings.getReferralCoinsLimitTier() == 0) {
                settings.setReferralCoinsLimitTier(seedConfig.getReferralCoinsLimitTier());
                updated = true;
            }
            if (settings.getReferralCoinsSubsequentAmount() == null || settings.getReferralCoinsSubsequentAmount() == 0L) {
                settings.setReferralCoinsSubsequentAmount(seedConfig.getReferralCoinsSubsequent());
                updated = true;
            }
            if (settings.getRedirectEmailAddress() == null || settings.getRedirectEmailAddress().isBlank()) {
                settings.setRedirectEmailAddress(seedConfig.getRedirectEmailAddress());
                updated = true;
            }
            if (updated) {
                settings.setReferralCoinsSubsequentEnabled(true);
                systemSettingRepository.save(settings);
                log.info("Migrated existing system settings with new limits and defaults");
            }
        }
        systemSettingService.refreshCache();
    }
}
