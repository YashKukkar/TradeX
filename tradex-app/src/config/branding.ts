export interface BrandConfig {
  appName: string;
  brandPrefix: string;
  accentText: string;
  pointsName: string;
  supportEmail: string;
  legalName: string;
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
const defaultEmail = b.supportEmail || "support@tradenows.com";

// `npm run dev` talks to the local stack; production builds use the URLs in config/app.json.
// Any of these can be overridden with VITE_API_URL / VITE_PORTAL_URL / VITE_LANDING_URL.
const viteEnv = (import.meta as any).env || {};
const LOCAL_URLS = {
  portalUrl: "http://localhost:5173",
  landingUrl: "http://localhost:3000",
  apiUrl: "http://localhost:8080/api",
};

function resolveUrls(configured: Record<string, string | undefined>) {
  const base = viteEnv.DEV ? LOCAL_URLS : {};
  return {
    portalUrl: viteEnv.VITE_PORTAL_URL || (base as any).portalUrl || configured.portalUrl || "https://control.tradenows.com",
    landingUrl: viteEnv.VITE_LANDING_URL || (base as any).landingUrl || configured.landingUrl || "https://tradenows.com",
    apiUrl: viteEnv.VITE_API_URL || (base as any).apiUrl || configured.apiUrl || "https://api.tradenows.com/api",
  };
}

const DEFAULT_BRANDING: BrandConfig = {
  appName: b.appName || "TradeNows",
  brandPrefix: b.brandPrefix || (b.appName ? b.appName : "Trade"),
  accentText: b.accentText !== undefined ? b.accentText : "Nows",
  pointsName: b.pointsName || "TradeNows Points",
  supportEmail: defaultEmail,
  legalName: b.legalName || "TradeNows",
  logoUrl: `/branding/logo.svg`,
  faviconUrl: `/branding/favicon.svg`,
  emailDomain: defaultEmail.split("@")[1] || "tradenows.com",
  ...resolveUrls(u),
};

export let branding: BrandConfig = { ...DEFAULT_BRANDING };

export async function initBranding(): Promise<BrandConfig> {
  try {
    const res = await fetch(`/branding/app.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      const b = data.brand || {};
      const u = data.urls || {};

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
              logoUrl: `/branding/logo.svg`,
        faviconUrl: `/branding/favicon.svg`,
        emailDomain: supportEmail.split("@")[1] || "tradenows.com",
        ...resolveUrls(u),
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
