/**
 * Central configuration for the TradeX application.
 * In development, it defaults to localhost.
 * In production/Kubernetes, it can be overridden by VITE_API_URL.
 * 
 * NOTE: If served behind an Ingress at /api, a relative path "/api" 
 * is often the best choice for production.
 */

import { branding } from "./config/branding";

export const config = {
  get apiUrl(): string {
    return branding.apiUrl;
  },
  get websiteUrl(): string {
    return branding.landingUrl;
  },
  branding,
};

export { branding };
