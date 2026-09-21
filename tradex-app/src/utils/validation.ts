import type { SystemSetting } from "./dashboardHelpers";

interface ValidationRule {
  field: string;
  when: (s: SystemSetting) => boolean;
  isValid: (s: SystemSetting) => boolean;
  error: string;
}

const isNonNegative = (val: number | null | undefined): boolean =>
  val !== null && val !== undefined && !isNaN(val) && val >= 0;

const isPositive = (val: number | null | undefined): boolean =>
  val !== null && val !== undefined && !isNaN(val) && val > 0;

const RULES: ValidationRule[] = [
  {
    field: "welcomeCoinsAmount",
    when: (s) => !!s.welcomeCoinsEnabled,
    isValid: (s) => isNonNegative(s.welcomeCoinsAmount),
    error: "Must be 0 or greater",
  },
  {
    field: "referralCoinsLimitTier",
    when: (s) => !!s.referralCoinsEnabled,
    isValid: (s) => {
      const v = s.referralCoinsLimitTier;
      return v !== null && v !== undefined && !isNaN(v) && v >= 1 && v <= 3;
    },
    error: "Must be between 1 and 3",
  },
  {
    field: "referralCoinsL1Amount",
    when: (s) => !!s.referralCoinsEnabled,
    isValid: (s) => isNonNegative(s.referralCoinsL1Amount),
    error: "Must be 0 or greater",
  },
  {
    field: "referralCoinsL2Amount",
    when: (s) => !!s.referralCoinsEnabled && (s.referralCoinsLimitTier ?? 0) >= 2,
    isValid: (s) => isNonNegative(s.referralCoinsL2Amount),
    error: "Must be 0 or greater",
  },
  {
    field: "referralCoinsL3Amount",
    when: (s) => !!s.referralCoinsEnabled && (s.referralCoinsLimitTier ?? 0) >= 3,
    isValid: (s) => isNonNegative(s.referralCoinsL3Amount),
    error: "Must be 0 or greater",
  },
  {
    field: "referralCoinsSubsequentAmount",
    when: (s) => !!s.referralCoinsEnabled && !!s.referralCoinsSubsequentEnabled,
    isValid: (s) => isNonNegative(s.referralCoinsSubsequentAmount),
    error: "Must be 0 or greater",
  },
  {
    field: "firstDepositRewardAmount",
    when: (s) => !!s.firstDepositRewardEnabled,
    isValid: (s) => isNonNegative(s.firstDepositRewardAmount),
    error: "Must be 0 or greater",
  },
  {
    field: "firstDepositRewardThreshold",
    when: (s) => !!s.firstDepositRewardEnabled,
    isValid: (s) => isNonNegative(s.firstDepositRewardThreshold),
    error: "Must be 0 or greater",
  },
  {
    field: "pointsToCashConversionRate",
    when: (s) => !!s.pointsConversionEnabled,
    isValid: (s) => isPositive(s.pointsToCashConversionRate),
    error: "Must be greater than 0",
  },
];

export function validateSystemSettings(settings: SystemSetting): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const rule of RULES) {
    if (rule.when(settings) && !rule.isValid(settings)) {
      errs[rule.field] = rule.error;
    }
  }
  return errs;
}
