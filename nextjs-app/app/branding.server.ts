import fs from "fs";
import path from "path";
import { BrandConfig, DEFAULT_BRANDING } from "./branding";

// `next dev` talks to the local stack; production keeps the URLs from config/app.json.
const LOCAL_URLS =
  process.env.NODE_ENV === "development"
    ? { portalUrl: "http://localhost:5173", landingUrl: "http://localhost:3000", apiUrl: "http://localhost:8080/api" }
    : null;

export function loadServerBranding(): BrandConfig {
  try {
    const candidates = [
      path.join(process.cwd(), "config", "app.json"),
      path.join(process.cwd(), "public", "branding", "app.json"),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(raw);
        const b = data.brand || {};
        const u = data.urls || {};
        const appName = b.appName || DEFAULT_BRANDING.appName;

        return {
          appName,
          brandPrefix: b.brandPrefix || "Trade",
          accentText: b.accentText !== undefined ? b.accentText : "Nows",
          pointsName: b.pointsName || "TradeNows Points",
          supportEmail: b.supportEmail || "support@tradenows.com",
          legalName: b.legalName || "TradeNows",
                  logoUrl: `/branding/logo.svg`,
          faviconUrl: `/branding/favicon.svg`,
          faviconIcoUrl: `/branding/favicon.ico`,
          urls: {
            portalUrl: process.env.PORTAL_URL || process.env.NEXT_PUBLIC_PORTAL_URL || LOCAL_URLS?.portalUrl || u.portalUrl || DEFAULT_BRANDING.urls.portalUrl,
            landingUrl: process.env.LANDING_URL || process.env.NEXT_PUBLIC_LANDING_URL || LOCAL_URLS?.landingUrl || u.landingUrl || DEFAULT_BRANDING.urls.landingUrl,
            apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || LOCAL_URLS?.apiUrl || u.apiUrl || DEFAULT_BRANDING.urls.apiUrl,
          },
          year: new Date().getFullYear(),
        };
      }
    }
  } catch {
    // Fall back to defaults
  }
  return { ...DEFAULT_BRANDING };
}

export const serverBranding = loadServerBranding();
