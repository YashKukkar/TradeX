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
  faviconIcoUrl: string;
  urls: {
    portalUrl: string;
    landingUrl: string;
    apiUrl: string;
  };
  year: number;
}

export const DEFAULT_BRANDING: BrandConfig = {
  appName: "TradeX",
  brandPrefix: "Trade",
  accentText: "X",
  pointsName: "TradeX Points",
  supportEmail: "support@tradenows.com",
  legalName: "TradeX Technologies Ltd",
  assetVersion: "1.0.0",
  logoUrl: "/branding/logo.svg?v=1.0.0",
  faviconUrl: "/branding/favicon.svg?v=1.0.0",
  faviconIcoUrl: "/branding/favicon.ico?v=1.0.0",
  urls: {
    portalUrl: "http://localhost:5173",
    landingUrl: "http://localhost:3000",
    apiUrl: "http://localhost:8080/api",
  },
  year: new Date().getFullYear(),
};

export const branding: BrandConfig = { ...DEFAULT_BRANDING };
