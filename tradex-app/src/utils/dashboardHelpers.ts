export interface UserProfile {
  email: string;
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
}

export interface WalletTransaction {
  id: number;
  amount: number;
  balanceAfter: number;
  type: string;
  status: string;
  notes: string;
  createdAt: number;
}

export interface UserInfo {
  id: number;
  email: string;
  referralCode: string;
  pointsBalance: number;
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

export function formatDate(val: number | string | Date): string {
  if (!val) return "";
  const date = typeof val === "number"
    ? new Date(val * 1000)
    : typeof val === "string"
      ? new Date(val)
      : val;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(val: number | string | Date): string {
  if (!val) return "";
  const date = typeof val === "number"
    ? new Date(val * 1000)
    : typeof val === "string"
      ? new Date(val)
      : val;

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTime(val: number | string | Date): string {
  if (!val) return "";
  const dStr = formatDate(val);
  const tStr = formatTime(val);
  return `${dStr}, ${tStr}`;
}
