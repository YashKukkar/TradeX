import type { WalletTransactionType } from "../types/transactions";

export interface TransactionExportConfig {
  type: WalletTransactionType | "USER_STATEMENT" | "ANALYTICS";
  label: string;
  endpoint: string;
  requiredPermission?: string;
  filenamePrefix: string;
}

export const DEPOSIT_EXPORT_CONFIG: TransactionExportConfig = {
  type: "DEPOSIT",
  label: "Deposits",
  endpoint: "admin/transactions/export/deposits",
  requiredPermission: "MANAGE_DEPOSITS",
  filenamePrefix: "tradex-deposits",
};

export const WITHDRAWAL_EXPORT_CONFIG: TransactionExportConfig = {
  type: "WITHDRAWAL",
  label: "Withdrawals",
  endpoint: "admin/transactions/export/withdrawals",
  requiredPermission: "MANAGE_WITHDRAWALS",
  filenamePrefix: "tradex-withdrawals",
};

export const CONVERSION_EXPORT_CONFIG: TransactionExportConfig = {
  type: "POINTS_CONVERSION",
  label: "Points Conversions",
  endpoint: "admin/transactions/export/conversions",
  filenamePrefix: "tradex-conversions",
};

export const USER_STATEMENT_EXPORT_CONFIG: TransactionExportConfig = {
  type: "USER_STATEMENT",
  label: "Wallet Statement",
  endpoint: "wallet/transactions/export",
  filenamePrefix: "tradex-statement",
};

export const ANALYTICS_EXPORT_CONFIG: TransactionExportConfig = {
  type: "ANALYTICS",
  label: "Analytics Report",
  endpoint: "admin/dashboard/export",
  filenamePrefix: "tradex-analytics",
};
