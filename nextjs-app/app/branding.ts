import appConfig from "../public/branding/app.json";

export interface BrandConfig {
  appName: string;
  brandPrefix: string;
  accentText: string;
  pointsName: string;
  supportEmail: string;
  legalName: string;
  logoUrl: string;
  faviconUrl: string;
  faviconIcoUrl: string;
  urls: {
    portalUrl: string;
    landingUrl: string;
    apiUrl: string;
  };
  year: number;
}

const b = (appConfig as any).brand || {};
const u = (appConfig as any).urls || {};

export const DEFAULT_BRANDING: BrandConfig = {
  appName: b.appName || "TradeNows",
  brandPrefix: b.brandPrefix || "Trade",
  accentText: b.accentText !== undefined ? b.accentText : "Nows",
  pointsName: b.pointsName || "TradeNows Points",
  supportEmail: b.supportEmail || "support@tradenows.com",
  legalName: b.legalName || "TradeNows",
  logoUrl: `/branding/logo.svg`,
  faviconUrl: `/branding/favicon.svg`,
  faviconIcoUrl: `/branding/favicon.ico`,
  urls: {
    portalUrl: u.portalUrl || "https://control.tradenows.com",
    landingUrl: u.landingUrl || "https://tradenows.com",
    apiUrl: u.apiUrl || "https://api.tradenows.com/api",
  },
  year: new Date().getFullYear(),
};

export const branding: BrandConfig = { ...DEFAULT_BRANDING };
