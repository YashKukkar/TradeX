import fs from "fs";
import path from "path";
import { BrandConfig, DEFAULT_BRANDING } from "./branding";

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
        const version = data.assetVersion || "1.0.0";
        const appName = b.appName || DEFAULT_BRANDING.appName;

        return {
          appName,
          brandPrefix: b.brandPrefix || "Trade",
          accentText: b.accentText !== undefined ? b.accentText : "Nows",
          pointsName: b.pointsName || "TradeNows Points",
          supportEmail: b.supportEmail || "support@tradenows.com",
          legalName: b.legalName || "TradeNows",
          assetVersion: version,
          logoUrl: `/branding/logo.svg?v=${version}`,
          faviconUrl: `/branding/favicon.svg?v=${version}`,
          faviconIcoUrl: `/branding/favicon.ico?v=${version}`,
          urls: {
            portalUrl: process.env.PORTAL_URL || process.env.NEXT_PUBLIC_PORTAL_URL || u.portalUrl || DEFAULT_BRANDING.urls.portalUrl,
            landingUrl: process.env.LANDING_URL || process.env.NEXT_PUBLIC_LANDING_URL || u.landingUrl || DEFAULT_BRANDING.urls.landingUrl,
            apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || u.apiUrl || DEFAULT_BRANDING.urls.apiUrl,
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
