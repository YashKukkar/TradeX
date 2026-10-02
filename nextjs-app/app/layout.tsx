import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { serverBranding as branding } from "./branding.server";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${branding.appName} — Trade with clarity. Move with confidence.`,
  description: `Purpose-built for NSE futures, MCX and COMEX commodities traders. Your wallet, bank accounts, referrals and rewards, managed from one secure ${branding.appName} account.`,
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
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} ${jetBrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href={branding.faviconIcoUrl} sizes="any" />
        <link rel="icon" href={branding.faviconUrl} type="image/svg+xml" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
        <link rel="stylesheet" href="/css/styles.css" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
