package com.tradex.api.service;

import com.tradex.api.dto.SystemSettingDTO;
import com.tradex.api.entity.SystemSetting;
import com.tradex.api.repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class SystemSettingService {

    private static final Long SETTINGS_ID = 1L;
    private final SystemSettingRepository systemSettingRepository;
    private SystemSetting cachedSetting;

    @PostConstruct
    public void init() {
        refreshCache();
    }

    public synchronized void refreshCache() {
        cachedSetting = systemSettingRepository.findById(SETTINGS_ID).orElseGet(() -> {
            log.info("Creating default system settings");
            SystemSetting defaultSettings = new SystemSetting();
            defaultSettings.setId(SETTINGS_ID);
            return systemSettingRepository.save(defaultSettings);
        });
        log.info("Loaded system settings cache");
    }

    public synchronized SystemSetting getSettings() {
        if (cachedSetting == null) {
            refreshCache();
        }
        return cachedSetting;
    }

    public synchronized SystemSettingDTO getSettingsDTO() {
        return toDTO(getSettings());
    }

    public SystemSettingDTO toDTO(SystemSetting settings) {
        return new SystemSettingDTO(
            new SystemSettingDTO.WelcomeSettings(
                settings.isWelcomeCoinsEnabled(),
                settings.getWelcomeCoinsAmount()
            ),
            new SystemSettingDTO.ReferralSettings(
                settings.isReferralCoinsEnabled(),
                settings.getReferralCoinsL1Amount(),
                settings.getReferralCoinsL2Amount(),
                settings.getReferralCoinsL3Amount(),
                settings.isReferralCoinsSubsequentEnabled(),
                settings.getReferralCoinsSubsequentAmount(),
                settings.getReferralCoinsLimitTier()
            ),
            new SystemSettingDTO.VerificationSettings(
                settings.isEmailVerificationEnabled(),
                settings.isPhoneVerificationEnabled()
            ),
            new SystemSettingDTO.DepositRewardSettings(
                settings.isFirstDepositRewardEnabled(),
                settings.getFirstDepositRewardAmount(),
                settings.getFirstDepositRewardThreshold()
            ),
            new SystemSettingDTO.PointsConversionSettings(
                settings.isPointsConversionEnabled(),
                settings.getPointsToCashConversionRate()
            ),
            new SystemSettingDTO.EmailSettings(
                settings.getSmtpHost(),
                settings.getSmtpPort(),
                settings.getSmtpUsername(),
                settings.getSmtpPassword(),
                settings.getSmtpFromEmail(),
                settings.getSmtpFromName(),
                settings.isEmailNotificationsEnabled(),
                settings.getRedirectEmailAddress()
            ),
            new SystemSettingDTO.GeneralSettings(
                settings.getAppTimezone(),
                settings.getAppCurrency()
            )
        );
    }

    @Transactional
    public synchronized SystemSettingDTO updateSettings(SystemSettingDTO dto) {
        SystemSetting setting = systemSettingRepository.findById(SETTINGS_ID).orElseGet(() -> {
            SystemSetting s = new SystemSetting();
            s.setId(SETTINGS_ID);
            return s;
        });

        setting.setWelcomeCoinsEnabled(dto.welcome().welcomeCoinsEnabled());
        setting.setWelcomeCoinsAmount(dto.welcome().welcomeCoinsAmount());
        setting.setReferralCoinsEnabled(dto.referral().referralCoinsEnabled());
        setting.setReferralCoinsL1Amount(dto.referral().referralCoinsL1Amount());
        setting.setReferralCoinsL2Amount(dto.referral().referralCoinsL2Amount());
        setting.setReferralCoinsL3Amount(dto.referral().referralCoinsL3Amount());
        setting.setReferralCoinsSubsequentEnabled(dto.referral().referralCoinsSubsequentEnabled());
        setting.setReferralCoinsSubsequentAmount(dto.referral().referralCoinsSubsequentAmount());
        setting.setReferralCoinsLimitTier(dto.referral().referralCoinsLimitTier());
        setting.setEmailVerificationEnabled(dto.verification().emailVerificationEnabled());
        setting.setPhoneVerificationEnabled(dto.verification().phoneVerificationEnabled());
        setting.setFirstDepositRewardEnabled(dto.depositReward().firstDepositRewardEnabled());
        setting.setFirstDepositRewardAmount(dto.depositReward().firstDepositRewardAmount());
        setting.setFirstDepositRewardThreshold(dto.depositReward().firstDepositRewardThreshold());
        setting.setPointsToCashConversionRate(dto.pointsConversion().pointsToCashConversionRate());
        setting.setPointsConversionEnabled(dto.pointsConversion().pointsConversionEnabled());

        // Email / SMTP settings
        setting.setSmtpHost(dto.email().smtpHost());
        setting.setSmtpPort(dto.email().smtpPort());
        setting.setSmtpUsername(dto.email().smtpUsername());
        setting.setSmtpPassword(dto.email().smtpPassword());
        setting.setSmtpFromEmail(dto.email().smtpFromEmail());
        setting.setSmtpFromName(dto.email().smtpFromName());
        setting.setEmailNotificationsEnabled(dto.email().emailNotificationsEnabled());
        setting.setRedirectEmailAddress(dto.email().redirectEmailAddress() != null ? dto.email().redirectEmailAddress() : "");

        // General settings
        setting.setAppTimezone(dto.general().appTimezone());
        setting.setAppCurrency(dto.general().appCurrency());

        SystemSetting saved = systemSettingRepository.save(setting);
        cachedSetting = saved;
        log.info("Updated system settings cache");
        return toDTO(saved);
    }
}

