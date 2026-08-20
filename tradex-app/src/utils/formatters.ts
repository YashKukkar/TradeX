/**
 * Centralized formatting utilities for dates, numbers, currency, and transaction status strings.
 */

export function parseToDate(val: number | string | Date | null | undefined): Date | null {
  if (val === null || val === undefined || val === "") return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const num = typeof val === "string" ? Number(val) : val;
  if (!isNaN(num)) {
    return new Date(num > 1e11 ? num : num * 1000);
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(val: number | string | Date | null | undefined, includeYear = false): string {
  const date = parseToDate(val);
  if (!date) return "—";
  const showYear = includeYear || date.getFullYear() !== new Date().getFullYear();

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    ...(showYear ? { year: "numeric" } : {}),
  });
}

export function formatDateTime(val: number | string | Date | null | undefined, includeYear = false): string {
  const date = parseToDate(val);
  if (!date) return "—";
  const showYear = includeYear || date.getFullYear() !== new Date().getFullYear();

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    ...(showYear ? { year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(val: number | string | Date | null | undefined): string {
  const date = parseToDate(val);
  if (!date) return "—";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatFullDateTime(val: number | string | Date | null | undefined): string {
  return formatDateTime(val, true);
}

export function formatCurrency(amount: number | null | undefined, currencySymbol = "₹"): string {
  if (amount === undefined || amount === null || isNaN(amount)) return `${currencySymbol}0.00`;
  return `${currencySymbol}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(val: number | null | undefined): string {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return val.toLocaleString("en-IN");
}

export function formatTxType(type: string | null | undefined): string {
  if (!type) return "N/A";
  return type.replace(/_/g, " ");
}

export {
  escapeCsvField,
  exportClientCsv as downloadCsv,
  generateExportFilename as generateCsvFilename,
  generateExportFilename,
  exportClientCsv,
  exportSmartCsv,
  MAX_CLIENT_EXPORT_ROWS,
} from "./exportUtils";
