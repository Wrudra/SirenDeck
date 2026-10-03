import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
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
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-control)] focus:bg-[#4cc2ff] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#0a0e14]"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
