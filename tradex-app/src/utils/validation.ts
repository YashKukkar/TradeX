import type { SystemSetting } from "./dashboardHelpers";

export function validateSystemSettings(settings: SystemSetting): Record<string, string> {
  const errs: Record<string, string> = {};
  if (settings.welcomeCoinsEnabled) {
    if (
      settings.welcomeCoinsAmount === null ||
      settings.welcomeCoinsAmount === undefined ||
      isNaN(settings.welcomeCoinsAmount) ||
      settings.welcomeCoinsAmount < 0
    ) {
      errs.welcomeCoinsAmount = "Must be 0 or greater";
    }
  }
  if (settings.referralCoinsEnabled) {
    if (
      settings.referralCoinsLimitTier === null ||
      settings.referralCoinsLimitTier === undefined ||
      isNaN(settings.referralCoinsLimitTier) ||
      settings.referralCoinsLimitTier < 1 ||
      settings.referralCoinsLimitTier > 3
    ) {
      errs.referralCoinsLimitTier = "Must be between 1 and 3";
    }
    if (
      settings.referralCoinsL1Amount === null ||
      settings.referralCoinsL1Amount === undefined ||
      isNaN(settings.referralCoinsL1Amount) ||
      settings.referralCoinsL1Amount < 0
    ) {
      errs.referralCoinsL1Amount = "Must be 0 or greater";
    }
    if (settings.referralCoinsLimitTier >= 2) {
      if (
        settings.referralCoinsL2Amount === null ||
        settings.referralCoinsL2Amount === undefined ||
        isNaN(settings.referralCoinsL2Amount) ||
        settings.referralCoinsL2Amount < 0
      ) {
        errs.referralCoinsL2Amount = "Must be 0 or greater";
      }
    }
    if (settings.referralCoinsLimitTier >= 3) {
      if (
        settings.referralCoinsL3Amount === null ||
        settings.referralCoinsL3Amount === undefined ||
        isNaN(settings.referralCoinsL3Amount) ||
        settings.referralCoinsL3Amount < 0
      ) {
        errs.referralCoinsL3Amount = "Must be 0 or greater";
      }
    }
    if (settings.referralCoinsSubsequentEnabled) {
      if (
        settings.referralCoinsSubsequentAmount === null ||
        settings.referralCoinsSubsequentAmount === undefined ||
        isNaN(settings.referralCoinsSubsequentAmount) ||
        settings.referralCoinsSubsequentAmount < 0
      ) {
        errs.referralCoinsSubsequentAmount = "Must be 0 or greater";
      }
    }
  }
  if (settings.firstDepositRewardEnabled) {
    if (
      settings.firstDepositRewardAmount === null ||
      settings.firstDepositRewardAmount === undefined ||
      isNaN(settings.firstDepositRewardAmount) ||
      settings.firstDepositRewardAmount < 0
    ) {
      errs.firstDepositRewardAmount = "Must be 0 or greater";
    }
    if (
      settings.firstDepositRewardThreshold === null ||
      settings.firstDepositRewardThreshold === undefined ||
      isNaN(settings.firstDepositRewardThreshold) ||
      settings.firstDepositRewardThreshold < 0
    ) {
      errs.firstDepositRewardThreshold = "Must be 0 or greater";
    }
  }
  if (settings.pointsConversionEnabled) {
    if (
      settings.pointsToCashConversionRate === null ||
      settings.pointsToCashConversionRate === undefined ||
      isNaN(settings.pointsToCashConversionRate) ||
      settings.pointsToCashConversionRate <= 0
    ) {
      errs.pointsToCashConversionRate = "Must be greater than 0";
    }
  }
  return errs;
}
