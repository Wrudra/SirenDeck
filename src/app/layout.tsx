import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: { default: "SirenDeck", template: "%s · SirenDeck" },
  description:
    "Track everything that expires, renews, or comes due — one map, one glance.",
  openGraph: {
    title: "SirenDeck",
    description:
      "Track everything that expires, renews, or comes due — one map, one glance.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
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
