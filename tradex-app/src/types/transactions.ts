/**
 * Centralized Wallet Transaction Types — kept in strict alignment with backend WalletTransactionType.java
 */
export const WALLET_TRANSACTION_TYPES = [
  "DEPOSIT",
  "WITHDRAWAL",
  "FIRST_DEPOSIT_BONUS",
  "POINTS_CONVERSION",
  "ADMIN_ADJUSTMENT",
] as const;

export type WalletTransactionType = (typeof WALLET_TRANSACTION_TYPES)[number];

export const WALLET_TRANSACTION_TYPE_LABELS: Record<WalletTransactionType, string> = {
  DEPOSIT: "Deposit",
  WITHDRAWAL: "Withdrawal",
  FIRST_DEPOSIT_BONUS: "First Deposit Bonus",
  POINTS_CONVERSION: "Points Conversion",
  ADMIN_ADJUSTMENT: "Admin Adjustment",
};

export function getTransactionTypeLabel(type: string): string {
  return WALLET_TRANSACTION_TYPE_LABELS[type as WalletTransactionType] || type;
}
