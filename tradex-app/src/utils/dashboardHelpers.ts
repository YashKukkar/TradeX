export interface BankDetail {
  id: number;
  accountNumber: string;
  ifscCode: string;
  holderName: string;
  bankName: string;
  isPrimary: boolean;
}

export interface UserProfile {
  email: string;
  fullName?: string;
  firstName?: string;
  referralCode: string;
  pointsBalance: number;
  role: string;
  phoneNumber?: string;
  accountNumber?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt?: number;
  withdrawableBalance: number;
  bonusBalance: number;
  permissions?: string[];
  bankAccounts?: BankDetail[];
  effectivePermissions?: string[];
}

export interface WalletTransaction {
  id: number;
  amount: number;
  balanceAfter: number;
  type: string;
  status: string;
  notes: string;
  createdAt: number;
  approvedAt: number;
}

export interface UserInfo {
  id: number;
  email: string;
  fullName?: string;
  firstName?: string;
  referralCode: string;
  pointsBalance: number;
  pointsAcquired?: number;
  referralPath: string;
  referredByEmail?: string;
  phoneNumber?: string;
  accountNumber?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  withdrawableBalance?: number;
  bonusBalance?: number;
  role?: string;
  enabled?: boolean;
  locked?: boolean;
  createdAt?: number;
  permissions?: string[];
  teams?: string[];
  bankAccounts?: BankDetail[];
  effectivePermissions?: string[];
}

/** Returns the primary bank account number for a user, or undefined if none is linked. */
export function getPrimaryAccountNumber(user: UserProfile | UserInfo | null | undefined): string | undefined {
  return user?.bankAccounts?.find(b => b.isPrimary)?.accountNumber;
}

export interface SystemSetting {
  welcomeCoinsEnabled: boolean;
  welcomeCoinsAmount: number;
  referralCoinsEnabled: boolean;
  referralCoinsL1Amount: number;
  referralCoinsL2Amount: number;
  referralCoinsL3Amount: number;
  referralCoinsSubsequentEnabled: boolean;
  referralCoinsSubsequentAmount: number;
  referralCoinsLimitTier: number;
  emailVerificationEnabled: boolean;
  phoneVerificationEnabled: boolean;
  firstDepositRewardEnabled: boolean;
  firstDepositRewardAmount: number;
  firstDepositRewardThreshold: number;
  pointsToCashConversionRate: number;
  pointsConversionEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpFromEmail: string;
  smtpFromName: string;
  emailNotificationsEnabled: boolean;
  appTimezone: string;
  appCurrency: string;
  redirectEmailAddress: string;
}

export interface PointsTransaction {
  id: number;
  amount: number;
  balanceAfter: number;
  type: string;
  notes: string;
  createdAt: number;
}

export interface ReferralReward {
  id: number;
  referredUserEmail: string;
  level: number;
  pointsAwarded: number;
  status: string;
  createdAt: string;
}

export const TICKERS_DATA = [
  { symbol: "NIFTY 50", value: "22,418.75", change: "+1.24%", up: true },
  { symbol: "SENSEX", value: "73,892.31", change: "+0.88%", up: true },
  { symbol: "BANK NIFTY", value: "47,120.10", change: "-0.32%", up: false },
  { symbol: "GOLD MCX", value: "₹71,320", change: "+0.31%", up: true },
];

export function getDisplayName(email: string): string {
  if (!email) return "User";
  const prefix = email.split("@")[0];
  return prefix
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

import { formatDate as fmtDate, formatTime as fmtTime, parseToDate } from "./formatters";

export { formatCurrency, formatNumber } from "./formatters";

export function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

export function formatDate(val: number | string | Date, includeYear: boolean = true): string {
  const formatted = fmtDate(val, includeYear);
  return formatted === "—" ? "" : formatted;
}

export function formatFullDate(val: number | string | Date): string {
  const date = parseToDate(val);
  if (!date) return "";

  const dayOrdinal = getOrdinalSuffix(date.getDate());
  const monthFull = date.toLocaleDateString("en-IN", { month: "long" });
  const year = date.getFullYear();

  return `${dayOrdinal} ${monthFull} ${year}`;
}

export function formatTime(val: number | string | Date): string {
  const formatted = fmtTime(val);
  return formatted === "—" ? "" : formatted;
}

export function formatDateTime(val: number | string | Date): string {
  if (!val) return "";
  const dStr = formatDate(val);
  const tStr = formatTime(val);
  return `${dStr}, ${tStr}`;
}

export function formatEpochTime(
  epochSeconds: number,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(epochSeconds * 1000);

  return date.toLocaleString("en-IN", options || {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
