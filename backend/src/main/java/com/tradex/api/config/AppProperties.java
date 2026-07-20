package com.tradex.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "tradex")
@Getter
@Setter
public class AppProperties {

    private final Otp otp = new Otp();
    private final Wallet wallet = new Wallet();
    private final Seed seed = new Seed();

    @Getter
    @Setter
    public static class Otp {
        private int expiryMinutes;
        private int maxAttempts;
        private int resendCooldownSeconds;
    }

    @Getter
    @Setter
    public static class Wallet {
        private BigDecimal minWithdrawalAmount;
        private BigDecimal maxWithdrawalAmount;
    }

    @Getter
    @Setter
    public static class Seed {
        private String defaultPassword;
        private long welcomeBonus;
        private String adminEmail;
        private String adminPassword;
        private boolean demoEnabled;
        private boolean resetDb;

        // Default System Settings Config
        private long referralCoinsL1;
        private long referralCoinsL2;
        private long referralCoinsL3;
        private long referralCoinsSubsequent;
        private int referralCoinsLimitTier;
        private String smtpUsername;
        private String smtpPassword;
        private String smtpFromEmail;
        private String smtpFromName;
        private String redirectEmailAddress;
    }
}
