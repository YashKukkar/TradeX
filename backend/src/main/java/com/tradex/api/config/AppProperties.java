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
        private int expiryMinutes = 10;
        private int maxAttempts = 3;
        private int resendCooldownSeconds = 60;
    }

    @Getter
    @Setter
    public static class Wallet {
        private BigDecimal minWithdrawalAmount = new BigDecimal("100.00");
        private BigDecimal maxWithdrawalAmount = new BigDecimal("50000.00");
    }

    @Getter
    @Setter
    public static class Seed {
        private String defaultPassword = "123456789";
        private long welcomeBonus = 1000L;
    }
}
