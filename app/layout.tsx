import type React from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { CartProvider } from "@/lib/cart-context";
import { SITE_URL } from "@/lib/seo";
import { getSectionContent } from "@/lib/content";
import { resolveStorefrontCopy } from "@/lib/storefront-copy";
import { StorefrontCopyProvider } from "@/components/storefront/copy-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Measure Joy — Little camera. Big feeling.",
    template: "%s | Measure Joy",
  },
  description:
    "Vintage digital cameras, film favorites, and a good reason to put your phone down. Find your next memory maker at Measure Joy.",
  keywords: [
    "Y2K digital camera",
    "vintage digital camera",
    "digicam",
    "retro camera",
    "Canon PowerShot",
    "Sony Cyber-shot",
    "Nikon Coolpix",
    "Fujifilm FinePix",
    "early 2000s camera",
    "point and shoot camera",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Measure Joy",
    url: SITE_URL,
    title: "Measure Joy — Little camera. Big feeling.",
    description:
      "Old cameras. New stories. Explore vintage digital cameras, film favorites, and the little extras.",
    images: [
      {
        url: "/brand/social/og-image.png",
        width: 1200,
        height: 630,
        alt: "Measure Joy — Y2K digital camera collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Measure Joy — Little camera. Big feeling.",
    description: "Little camera. Big feeling. Find your next memory maker.",
    images: ["/brand/social/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/brand/icons/favicon.ico",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/brand/icons/favicon.ico",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/brand/icons/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/brand/icons/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const copy = resolveStorefrontCopy(await getSectionContent("storefront"));
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans antialiased">
          <CartProvider>
            <StorefrontCopyProvider copy={copy}>
              {children}
            </StorefrontCopyProvider>
          </CartProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
