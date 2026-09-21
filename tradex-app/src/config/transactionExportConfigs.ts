import type { WalletTransactionType } from "../types/transactions";
import { branding } from "./branding";

const getPrefix = (category: string) => {
  const slug = (branding.appName || "tradex").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${slug || "tradex"}-${category}`;
};

export interface TransactionExportConfig {
  type: WalletTransactionType | "USER_STATEMENT" | "ANALYTICS";
  label: string;
  endpoint: string;
  requiredPermission?: string;
  get filenamePrefix(): string;
}

export const DEPOSIT_EXPORT_CONFIG: TransactionExportConfig = {
  type: "DEPOSIT",
  label: "Deposits",
  endpoint: "admin/transactions/export/deposits",
  requiredPermission: "MANAGE_DEPOSITS",
  get filenamePrefix() { return getPrefix("deposits"); },
};

export const WITHDRAWAL_EXPORT_CONFIG: TransactionExportConfig = {
  type: "WITHDRAWAL",
  label: "Withdrawals",
  endpoint: "admin/transactions/export/withdrawals",
  requiredPermission: "MANAGE_WITHDRAWALS",
  get filenamePrefix() { return getPrefix("withdrawals"); },
};

export const CONVERSION_EXPORT_CONFIG: TransactionExportConfig = {
  type: "POINTS_CONVERSION",
  label: "Points Conversions",
  endpoint: "admin/transactions/export/conversions",
  get filenamePrefix() { return getPrefix("conversions"); },
};

export const USER_STATEMENT_EXPORT_CONFIG: TransactionExportConfig = {
  type: "USER_STATEMENT",
  label: "Wallet Statement",
  endpoint: "wallet/transactions/export",
  get filenamePrefix() { return getPrefix("statement"); },
};

export const ANALYTICS_EXPORT_CONFIG: TransactionExportConfig = {
  type: "ANALYTICS",
  label: "Analytics Report",
  endpoint: "admin/dashboard/export",
  get filenamePrefix() { return getPrefix("analytics"); },
};
