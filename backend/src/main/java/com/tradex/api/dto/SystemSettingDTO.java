package com.tradex.api.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import java.math.BigDecimal;

public record SystemSettingDTO(
    @JsonUnwrapped @Valid WelcomeSettings welcome,
    @JsonUnwrapped @Valid ReferralSettings referral,
    @JsonUnwrapped @Valid VerificationSettings verification,
    @JsonUnwrapped @Valid DepositRewardSettings depositReward,
    @JsonUnwrapped @Valid PointsConversionSettings pointsConversion,
    @JsonUnwrapped @Valid EmailSettings email,
    @JsonUnwrapped @Valid GeneralSettings general
) {
    @JsonCreator
    public SystemSettingDTO(
        @JsonProperty("welcomeCoinsEnabled") boolean welcomeCoinsEnabled,
        @JsonProperty("welcomeCoinsAmount") Long welcomeCoinsAmount,
        @JsonProperty("referralCoinsEnabled") boolean referralCoinsEnabled,
        @JsonProperty("referralCoinsL1Amount") Long referralCoinsL1Amount,
        @JsonProperty("referralCoinsL2Amount") Long referralCoinsL2Amount,
        @JsonProperty("referralCoinsL3Amount") Long referralCoinsL3Amount,
        @JsonProperty("referralCoinsSubsequentEnabled") boolean referralCoinsSubsequentEnabled,
        @JsonProperty("referralCoinsSubsequentAmount") Long referralCoinsSubsequentAmount,
        @JsonProperty("referralCoinsLimitTier") Integer referralCoinsLimitTier,
        @JsonProperty("emailVerificationEnabled") boolean emailVerificationEnabled,
        @JsonProperty("phoneVerificationEnabled") boolean phoneVerificationEnabled,
        @JsonProperty("firstDepositRewardEnabled") boolean firstDepositRewardEnabled,
        @JsonProperty("firstDepositRewardAmount") BigDecimal firstDepositRewardAmount,
        @JsonProperty("firstDepositRewardThreshold") BigDecimal firstDepositRewardThreshold,
        @JsonProperty("pointsToCashConversionRate") BigDecimal pointsToCashConversionRate,
        @JsonProperty("pointsConversionEnabled") boolean pointsConversionEnabled,
        @JsonProperty("smtpHost") String smtpHost,
        @JsonProperty("smtpPort") Integer smtpPort,
        @JsonProperty("smtpUsername") String smtpUsername,
        @JsonProperty("smtpPassword") String smtpPassword,
        @JsonProperty("smtpFromEmail") String smtpFromEmail,
        @JsonProperty("smtpFromName") String smtpFromName,
        @JsonProperty("emailNotificationsEnabled") boolean emailNotificationsEnabled,
        @JsonProperty("appTimezone") String appTimezone,
        @JsonProperty("appCurrency") String appCurrency
    ) {
        this(
            new WelcomeSettings(welcomeCoinsEnabled, welcomeCoinsAmount),
            new ReferralSettings(referralCoinsEnabled, referralCoinsL1Amount, referralCoinsL2Amount, referralCoinsL3Amount, referralCoinsSubsequentEnabled, referralCoinsSubsequentAmount, referralCoinsLimitTier),
            new VerificationSettings(emailVerificationEnabled, phoneVerificationEnabled),
            new DepositRewardSettings(firstDepositRewardEnabled, firstDepositRewardAmount, firstDepositRewardThreshold),
            new PointsConversionSettings(pointsConversionEnabled, pointsToCashConversionRate),
            new EmailSettings(
                smtpHost != null ? smtpHost : "smtp.gmail.com",
                (smtpPort == null || smtpPort < 1 || smtpPort > 65535) ? 587 : smtpPort,
                smtpUsername,
                smtpPassword,
                smtpFromEmail != null ? smtpFromEmail : "noreply@tradex.com",
                smtpFromName != null ? smtpFromName : "TradeX",
                emailNotificationsEnabled
            ),
            new GeneralSettings(
                appTimezone != null ? appTimezone : "Asia/Kolkata",
                appCurrency != null ? appCurrency : "INR"
            )
        );
    }

    public record WelcomeSettings(
        boolean welcomeCoinsEnabled,

        @NotNull(message = "Welcome coins amount cannot be null")
        @PositiveOrZero(message = "Welcome coins amount must be a positive number or zero")
        Long welcomeCoinsAmount
    ) {}

    public record ReferralSettings(
        boolean referralCoinsEnabled,

        @NotNull(message = "Referral Level 1 coins amount cannot be null")
        @PositiveOrZero(message = "Referral Level 1 coins amount must be a positive number or zero")
        Long referralCoinsL1Amount,

        @NotNull(message = "Referral Level 2 coins amount cannot be null")
        @PositiveOrZero(message = "Referral Level 2 coins amount must be a positive number or zero")
        Long referralCoinsL2Amount,

        @NotNull(message = "Referral Level 3 coins amount cannot be null")
        @PositiveOrZero(message = "Referral Level 3 coins amount must be a positive number or zero")
        Long referralCoinsL3Amount,

        boolean referralCoinsSubsequentEnabled,

        @NotNull(message = "Subsequent level coins amount cannot be null")
        @PositiveOrZero(message = "Subsequent level coins amount must be a positive number or zero")
        Long referralCoinsSubsequentAmount,

        @NotNull(message = "Referral limit tier cannot be null")
        @Min(value = 1, message = "Referral limit tier must be at least 1")
        @Max(value = 3, message = "Referral limit tier cannot be greater than 3")
        Integer referralCoinsLimitTier
    ) {}

    public record VerificationSettings(
        boolean emailVerificationEnabled,
        boolean phoneVerificationEnabled
    ) {}

    public record DepositRewardSettings(
        boolean firstDepositRewardEnabled,

        @NotNull(message = "First deposit reward amount cannot be null")
        @PositiveOrZero(message = "First deposit reward amount must be a positive number or zero")
        BigDecimal firstDepositRewardAmount,

        @NotNull(message = "First deposit reward threshold cannot be null")
        @PositiveOrZero(message = "First deposit reward threshold must be a positive number or zero")
        BigDecimal firstDepositRewardThreshold
    ) {}

    public record PointsConversionSettings(
        boolean pointsConversionEnabled,

        @NotNull(message = "Points to cash conversion rate cannot be null")
        @PositiveOrZero(message = "Points to cash conversion rate must be a positive number or zero")
        BigDecimal pointsToCashConversionRate
    ) {}

    public record EmailSettings(
        @NotNull(message = "SMTP host cannot be null")
        String smtpHost,

        @NotNull(message = "SMTP port cannot be null")
        @Min(value = 1, message = "SMTP port must be at least 1")
        @Max(value = 65535, message = "SMTP port cannot exceed 65535")
        Integer smtpPort,

        String smtpUsername,
        String smtpPassword,

        @NotNull(message = "From email cannot be null")
        String smtpFromEmail,

        @NotNull(message = "From name cannot be null")
        String smtpFromName,

        boolean emailNotificationsEnabled
    ) {}

    public record GeneralSettings(
        @NotNull(message = "Timezone cannot be null")
        String appTimezone,

        @NotNull(message = "Currency cannot be null")
        String appCurrency
    ) {}
}
