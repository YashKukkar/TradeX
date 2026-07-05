package com.tradex.api.config;

import com.tradex.api.enums.Role;
import com.tradex.api.entity.User;
import com.tradex.api.entity.SystemSetting;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.repository.SystemSettingRepository;
import com.tradex.api.service.ReferralService;
import com.tradex.api.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.tradex.api.service.SeedDataService;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final SystemSettingService systemSettingService;
    private final PasswordEncoder passwordEncoder;
    private final ReferralService referralService;
    private final SeedDataService seedDataService;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByEmail("admin@tradex.com")) {
            log.info("Seeding default admin user");
            User admin = new User();
            admin.setEmail("admin@tradex.com");
            admin.setPassword(passwordEncoder.encode("123456789"));
            admin.setRole(Role.ADMIN);
            admin.setEmailVerified(true);
            admin.setPhoneVerified(true);
            admin.setReferralCode(referralService.generateUniqueReferralCode());
            admin.setPointsBalance(0L);
            admin.setReferralPath(".");

            admin = userRepository.save(admin);
            admin.setReferralPath("." + admin.getId() + ".");
            userRepository.save(admin);
        } else {
            userRepository.findByEmail("admin@tradex.com").ifPresent(admin -> {
                admin.setPassword(passwordEncoder.encode("123456789"));
                admin.setEmailVerified(true);
                admin.setPhoneVerified(true);
                userRepository.save(admin);
                log.info("Updated existing admin password and verification status");
            });
        }

        SystemSetting settings = systemSettingRepository.findById(1L).orElse(null);
        if (settings == null) {
            log.info("Seeding default system settings");
            settings = new SystemSetting();
            settings.setId(1L);
            settings.setWelcomeCoinsEnabled(true);
            settings.setWelcomeCoinsAmount(1000L);
            settings.setReferralCoinsEnabled(true);
            settings.setReferralCoinsL1Amount(500L);
            settings.setReferralCoinsL2Amount(200L);
            settings.setReferralCoinsL3Amount(100L);
            settings.setReferralCoinsSubsequentEnabled(true);
            settings.setReferralCoinsSubsequentAmount(50L);
            settings.setReferralCoinsLimitTier(3);
            settings.setEmailVerificationEnabled(false);
            settings.setPhoneVerificationEnabled(false);
            settings.setEmailNotificationsEnabled(true);
            settings.setRedirectEmailAddress("ykukkar@gmail.com");
            settings.setSmtpUsername("ykukkar@gmail.com");
            settings.setSmtpPassword("vvyl lvqs dbrt flob");
            systemSettingRepository.save(settings);
        } else {
            boolean updated = false;
            if (!settings.isEmailNotificationsEnabled()) {
                settings.setEmailNotificationsEnabled(true);
                updated = true;
            }
            if (settings.getSmtpUsername() == null || settings.getSmtpUsername().isBlank()) {
                settings.setSmtpUsername("ykukkar@gmail.com");
                updated = true;
            }
            if (settings.getSmtpPassword() == null || settings.getSmtpPassword().isBlank()) {
                settings.setSmtpPassword("vvyl lvqs dbrt flob");
                updated = true;
            }
            if (settings.getSmtpFromEmail() == null || settings.getSmtpFromEmail().isBlank() || "support@tradex.com".equalsIgnoreCase(settings.getSmtpFromEmail())) {
                settings.setSmtpFromEmail("noreply@tradex.com");
                updated = true;
            }
            if (settings.getReferralCoinsLimitTier() == null || settings.getReferralCoinsLimitTier() == 0) {
                settings.setReferralCoinsLimitTier(3);
                updated = true;
            }
            if (settings.getReferralCoinsSubsequentAmount() == null
                    || settings.getReferralCoinsSubsequentAmount() == 0L) {
                settings.setReferralCoinsSubsequentAmount(50L);
                updated = true;
            }
            if (settings.getRedirectEmailAddress() == null || settings.getRedirectEmailAddress().isBlank()) {
                settings.setRedirectEmailAddress("ykukkar@gmail.com");
                updated = true;
            }
            if (updated) {
                settings.setReferralCoinsSubsequentEnabled(true);
                systemSettingRepository.save(settings);
                log.info("Migrated existing system settings with new limits and defaults");
            }
        }

        systemSettingService.refreshCache();
        if (!isRunningInTest()) {
            seedDataService.seedTestData();
        }
    }

    private boolean isRunningInTest() {
        return StackWalker.getInstance().walk(frames ->
            frames.anyMatch(frame ->
                frame.getClassName().startsWith("org.junit.") ||
                frame.getClassName().startsWith("org.testng.")
            )
        );
    }
}
