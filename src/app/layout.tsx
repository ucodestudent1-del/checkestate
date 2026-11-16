import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import SkipLink from "@/components/SkipLink";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CheckEstate - Property Maintenance Management",
  description: "Manage maintenance requests, contractors, repairs, and property expenses from one simple platform.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SkipLink />
        <SessionProvider>
          <QueryProvider>{children}</QueryProvider>
          <CookieConsentBanner />
        </SessionProvider>
      </body>
    </html>
  );
}
