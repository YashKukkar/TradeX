import { config } from "../config";
import { generateCsvFilename } from "./formatters";

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage.getItem blocked:", e);
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage.setItem blocked:", e);
    }
  },
  clear(): void {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("localStorage.clear blocked:", e);
    }
  }
};

export class ApiError extends Error {
  status: number;
  validationErrors?: Record<string, string>;
  path?: string;

  constructor(message: string, status: number, validationErrors?: Record<string, string>, path?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.validationErrors = validationErrors;
    this.path = path;
  }
}

export const api = async (endpoint: string, options: any = {}): Promise<any> => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${config.apiUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = safeStorage.getItem("token");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  const body = isFormData
    ? options.body
    : options.body
      ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body))
      : undefined;

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body,
    credentials: "include",
  });

  if (!res.ok) {
    let errorData: any = null;
    try {
      errorData = await res.json();
    } catch {
      // Non-JSON error body
    }
    const message = errorData?.message || res.statusText || "Request failed";
    throw new ApiError(message, res.status, errorData?.validationErrors, errorData?.path);
  }

  if (res.status === 204) return null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
};

export const apiDownload = async (endpoint: string, defaultFilename: string): Promise<void> => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${config.apiUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = safeStorage.getItem("token");
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new ApiError(`Download failed: ${res.statusText}`, res.status);
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", defaultFilename.endsWith(".csv") ? defaultFilename : `${defaultFilename}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const exportCsvReport = async (
  endpoint: string,
  reportName: string,
  params?: Record<string, string | undefined>
): Promise<void> => {
  let query = "";
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) searchParams.append(k, v);
    });
    const queryString = searchParams.toString();
    if (queryString) {
      query = (endpoint.includes("?") ? "&" : "?") + queryString;
    }
  }
  const filename = generateCsvFilename(reportName);
  await apiDownload(`${endpoint}${query}`, filename);
};

