import { apiDownload } from "./api";

export const MAX_CLIENT_EXPORT_ROWS = 50000;

export interface ExportFilenameOptions {
  startDate?: string;
  endDate?: string;
  part?: number;
  totalParts?: number;
  ext?: "csv" | "xlsx";
}

/**
 * Generates standardized enterprise filenames:
 * TradeX_<Domain>_[<StartDate>_to_<EndDate>_]<YYYY-MM-DD_HHmmss>[_PartX_of_Y].<ext>
 */
export function generateExportFilename(domain: string, options?: ExportFilenameOptions): string {
  const cleanDomain = domain.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = options?.ext || "csv";
  
  let scopePart = "";
  if (options?.startDate && options?.endDate) {
    const s = options.startDate.split("T")[0];
    const e = options.endDate.split("T")[0];
    scopePart = `_${s}_to_${e}`;
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const timestampPart = `_${dateStr}_${timeStr}`;

  let partSuffix = "";
  if (options?.part && options?.totalParts && options.totalParts > 1) {
    partSuffix = `_Part${options.part}_of_${options.totalParts}`;
  }

  return `TradeX_${cleanDomain}${scopePart}${timestampPart}${partSuffix}.${ext}`;
}

/**
 * Precise RFC4180 CSV field escaper.
 * Preserves legitimate numeric and signed values (e.g. -500, +250.50, 42),
 * while neutralizing non-numeric formula injection patterns (=cmd, @SUM).
 */
export function escapeCsvField(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return "";

  // 1. Primitive numbers: pass through directly
  if (typeof val === "number") {
    return isFinite(val) ? String(val) : "";
  }

  let str = String(val).trim();
  if (str === "") return "";

  // 2. Legitimate numeric strings (e.g. "-500.00", "+250", "42"): preserve without single quote
  const isPureNumber = /^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(str);

  // 3. Formula injection mitigation: Only escape non-numeric strings starting with formula trigger chars
  if (!isPureNumber && /^[=+\-@\t\r|%]/.test(str)) {
    str = `'` + str;
  }

  // 4. RFC4180 quote wrapping
  if (str.includes(",") || str.includes("\"") || str.includes("\n") || str.includes("\r") || str.includes("'")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Client-side CSV download with UTF-8 BOM and immediate resource cleanup.
 */
export function exportClientCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void {
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((r) => r.map(escapeCsvField).join(","));
  const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface SmartExportParams {
  domain: string;
  headers: string[];
  totalCount?: number;
  fetchClientData?: () => Promise<(string | number | boolean | null | undefined)[][]> | (string | number | boolean | null | undefined)[][];
  serverExportUrl?: string;
  dateRange?: { startDate?: string; endDate?: string };
}

/**
 * Metadata-driven export router.
 * If serverExportUrl is provided or totalCount > 50,000, routes to backend socket streaming.
 * Otherwise, fetches/formats client dataset and triggers client-side download.
 */
export async function exportSmartCsv({
  domain,
  headers,
  totalCount,
  fetchClientData,
  serverExportUrl,
  dateRange,
}: SmartExportParams): Promise<void> {
  const filename = generateExportFilename(domain, {
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
    ext: "csv",
  });

  // Strategy 1: If server streaming endpoint is specified and total count exceeds client policy
  if (serverExportUrl && (totalCount === undefined || totalCount > MAX_CLIENT_EXPORT_ROWS)) {
    await apiDownload(serverExportUrl, filename);
    return;
  }

  // Strategy 2: If we have client data fetcher, execute client export
  if (fetchClientData) {
    const rows = await fetchClientData();
    exportClientCsv(filename, headers, rows);
    return;
  }

  // Fallback: If only serverExportUrl is available
  if (serverExportUrl) {
    await apiDownload(serverExportUrl, filename);
  }
}
