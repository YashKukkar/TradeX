import type { Metadata } from "next";
import { IBM_Plex_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { serverBranding as branding } from "./branding.server";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${branding.appName} — Trade Smarter. Invest Better.`,
  description: `Trade NSE stocks, F&O, and MCX commodities on ${branding.appName} — India's modern trading platform.`,
  icons: {
    icon: [
      { url: branding.faviconIcoUrl, sizes: "any" },
      { url: branding.faviconUrl, type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href={branding.faviconIcoUrl} sizes="any" />
        <link rel="icon" href={branding.faviconUrl} type="image/svg+xml" />
        <link rel="stylesheet" href="/css/styles.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
