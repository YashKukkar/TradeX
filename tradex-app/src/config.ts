/**
 * Central configuration for the TradeX application.
 * In development, it defaults to localhost.
 * In production/Kubernetes, it can be overridden by VITE_API_URL.
 * 
 * NOTE: If served behind an Ingress at /api, a relative path "/api" 
 * is often the best choice for production.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:8080/api");
const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || (import.meta.env.PROD ? "/" : "http://localhost:3000");

export const config = {
  apiUrl: API_BASE_URL,
  websiteUrl: WEBSITE_URL,
};
