export interface BrandConfig {
  appName: string;
  brandPrefix: string;
  accentText: string;
  pointsName: string;
  supportEmail: string;
  legalName: string;
  assetVersion: string;
  logoUrl: string;
  faviconUrl: string;
  emailDomain: string;
  portalUrl: string;
  landingUrl: string;
  apiUrl: string;
}

import appConfig from "../../../config/app.json";

const b = (appConfig as any).brand || {};
const u = (appConfig as any).urls || {};
const version = (appConfig as any).assetVersion || "1.0.0";
const defaultEmail = b.supportEmail || "support@tradenows.com";

const DEFAULT_BRANDING: BrandConfig = {
  appName: b.appName || "TradeNows",
  brandPrefix: b.brandPrefix || (b.appName ? b.appName : "Trade"),
  accentText: b.accentText !== undefined ? b.accentText : "Nows",
  pointsName: b.pointsName || "TradeNows Points",
  supportEmail: defaultEmail,
  legalName: b.legalName || "TradeNows",
  assetVersion: version,
  logoUrl: `/branding/logo.svg?v=${version}`,
  faviconUrl: `/branding/favicon.svg?v=${version}`,
  emailDomain: defaultEmail.split("@")[1] || "tradenows.com",
  portalUrl: u.portalUrl || "https://control.tradenows.com",
  landingUrl: u.landingUrl || "https://tradenows.com",
  apiUrl: u.apiUrl || "https://api.tradenows.com/api",
};

export let branding: BrandConfig = { ...DEFAULT_BRANDING };

export async function initBranding(): Promise<BrandConfig> {
  try {
    const res = await fetch(`/branding/app.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      const b = data.brand || {};
      const u = data.urls || {};
      const version = data.assetVersion || "1.0.0";

      const appName = b.appName || "TradeNows";
      const brandPrefix = b.brandPrefix || (b.appName ? b.appName : "Trade");
      const accentText = b.accentText !== undefined ? b.accentText : (b.appName ? "" : "Nows");
      const supportEmail = b.supportEmail || "support@tradenows.com";

      branding = {
        appName,
        brandPrefix,
        accentText,
        pointsName: b.pointsName || "TradeNows Points",
        supportEmail,
        legalName: b.legalName || "TradeNows",
        assetVersion: version,
        logoUrl: `/branding/logo.svg?v=${version}`,
        faviconUrl: `/branding/favicon.svg?v=${version}`,
        emailDomain: supportEmail.split("@")[1] || "tradenows.com",
        portalUrl: u.portalUrl || DEFAULT_BRANDING.portalUrl,
        landingUrl: u.landingUrl || DEFAULT_BRANDING.landingUrl,
        apiUrl: u.apiUrl || DEFAULT_BRANDING.apiUrl,
      };

      document.title = `${branding.appName} — Trade with clarity`;
      const favSvg = document.querySelector<HTMLLinkElement>('link[type="image/svg+xml"]');
      if (favSvg) favSvg.href = branding.faviconUrl;
    }
  } catch {
    // Keep DEFAULT_BRANDING silently
  }
  return branding;
}
