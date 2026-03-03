import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";

import { CompareDrawer } from "@/components/compare-drawer";
import { PortalStateProvider } from "@/components/portal-state-provider";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EstatePerks | SquareYards-Style Real Estate Portal",
  description:
    "Discover verified new launches, ready-to-move homes, and investment picks across top Indian cities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${playfair.variable}`}>
        <PortalStateProvider>
          {children}
          <CompareDrawer />
        </PortalStateProvider>
      </body>
    </html>
  );
}
