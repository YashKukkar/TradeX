package com.tradex.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
public class SystemSetting {

    @Id
    private Long id = 1L; // Always 1 for single row configuration

    @Column(name = "welcome_coins_enabled", nullable = false)
    private boolean welcomeCoinsEnabled = true;

    @Column(name = "welcome_coins_amount", nullable = false)
    private Long welcomeCoinsAmount = 1000L;

    @Column(name = "referral_coins_enabled", nullable = false)
    private boolean referralCoinsEnabled = true;

    @Column(name = "referral_coins_l1_amount", nullable = false)
    private Long referralCoinsL1Amount = 500L;

    @Column(name = "referral_coins_l2_amount", nullable = false)
    private Long referralCoinsL2Amount = 200L;

    @Column(name = "referral_coins_l3_amount", nullable = false)
    private Long referralCoinsL3Amount = 100L;

    @Column(name = "referral_coins_subsequent_enabled", nullable = false)
    private boolean referralCoinsSubsequentEnabled = true;

    @Column(name = "referral_coins_subsequent_amount", nullable = false)
    private Long referralCoinsSubsequentAmount = 50L;

    @Column(name = "referral_coins_limit_tier", nullable = false)
    private Integer referralCoinsLimitTier = 3;

    @Column(name = "email_verification_enabled", nullable = false)
    private boolean emailVerificationEnabled = false;

    @Column(name = "phone_verification_enabled", nullable = false)
    private boolean phoneVerificationEnabled = false;

    @Column(name = "first_deposit_reward_enabled", nullable = false)
    private boolean firstDepositRewardEnabled = true;

    @Column(name = "first_deposit_reward_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal firstDepositRewardAmount = new BigDecimal("100.0000");

    @Column(name = "first_deposit_reward_threshold", nullable = false, precision = 19, scale = 4)
    private BigDecimal firstDepositRewardThreshold = new BigDecimal("500.0000");

    @Column(name = "points_to_cash_conversion_rate", nullable = false, precision = 19, scale = 4)
    private BigDecimal pointsToCashConversionRate = new BigDecimal("10.0000");

    @Column(name = "points_conversion_enabled", nullable = false)
    private boolean pointsConversionEnabled = true;

    // Email / SMTP settings
    @Column(name = "smtp_host", nullable = false)
    private String smtpHost = "smtp.gmail.com";

    @Column(name = "smtp_port", nullable = false)
    private Integer smtpPort = 587;

    @Column(name = "smtp_username")
    private String smtpUsername = "";

    @Column(name = "smtp_password")
    private String smtpPassword = "";

    @Column(name = "smtp_from_email", nullable = false)
    private String smtpFromEmail = "noreply@tradex.com";

    @Column(name = "smtp_from_name", nullable = false)
    private String smtpFromName = "TradeX";

    @Column(name = "email_notifications_enabled", nullable = false)
    private boolean emailNotificationsEnabled = true;

    // General app settings
    @Column(name = "app_timezone", nullable = false)
    private String appTimezone = "Asia/Kolkata";

    @Column(name = "app_currency", nullable = false)
    private String appCurrency = "INR";

    @Column(name = "redirect_email_address")
    private String redirectEmailAddress = "ykukkar@gmail.com";
}
