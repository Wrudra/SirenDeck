import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";

import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  colorScheme: "light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#f5f5f7" },
  ],
};

export const metadata: Metadata = {
  title: { default: "SirenDeck", template: "%s · SirenDeck" },
  description:
    "Track everything that expires, renews, or comes due. One map, one glance.",
  openGraph: {
    title: "SirenDeck",
    description:
      "Track everything that expires, renews, or comes due. One map, one glance.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${jetbrainsMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-control)] focus:bg-cta focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-cta-ink"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
