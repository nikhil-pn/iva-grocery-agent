import type { Metadata, Viewport } from "next";
import { Inter_Tight, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/iva";

const sans = Inter_Tight({ variable: "--font-sans-body", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif-display", subsets: ["latin"], weight: "400", style: ["italic", "normal"] });
const mono = JetBrains_Mono({ variable: "--font-mono-code", subsets: ["latin"] });

const title = "Iva: your basket, sorted";
const description =
  "Send Iva your grocery list. She finds the cheapest basket across Blinkit, Instamart and Zepto, publishes the deals to Arkiv, and pays for her own brain on 0G Compute.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: { title, description, type: "website", siteName: "Iva" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#1d2421",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable} antialiased`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
