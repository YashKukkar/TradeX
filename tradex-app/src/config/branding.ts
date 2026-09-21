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

const DEFAULT_BRANDING: BrandConfig = {
  appName: "TradeX",
  brandPrefix: "Trade",
  accentText: "X",
  pointsName: "TradeX Points",
  supportEmail: "support@tradenows.com",
  legalName: "TradeX Technologies Ltd",
  assetVersion: "1.0.0",
  logoUrl: "/branding/logo.svg?v=1.0.0",
  faviconUrl: "/branding/favicon.svg?v=1.0.0",
  emailDomain: "tradenows.com",
  portalUrl: "http://localhost:5173",
  landingUrl: "http://localhost:3000",
  apiUrl: "http://localhost:8080/api",
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

      const appName = b.appName || "TradeX";
      const brandPrefix = b.brandPrefix || (b.appName ? b.appName : "Trade");
      const accentText = b.accentText !== undefined ? b.accentText : (b.appName ? "" : "X");
      const supportEmail = b.supportEmail || "support@tradenows.com";

      branding = {
        appName,
        brandPrefix,
        accentText,
        pointsName: b.pointsName || "TradeX Points",
        supportEmail,
        legalName: b.legalName || "TradeX Technologies Ltd",
        assetVersion: version,
        logoUrl: `/branding/logo.svg?v=${version}`,
        faviconUrl: `/branding/favicon.svg?v=${version}`,
        emailDomain: supportEmail.split("@")[1] || "tradenows.com",
        portalUrl: u.portalUrl || DEFAULT_BRANDING.portalUrl,
        landingUrl: u.landingUrl || DEFAULT_BRANDING.landingUrl,
        apiUrl: u.apiUrl || DEFAULT_BRANDING.apiUrl,
      };

      document.title = `${branding.appName} — Trade Smarter`;
      const favSvg = document.querySelector<HTMLLinkElement>('link[type="image/svg+xml"]');
      if (favSvg) favSvg.href = branding.faviconUrl;
    }
  } catch {
    // Keep DEFAULT_BRANDING silently
  }
  return branding;
}
