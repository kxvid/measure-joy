import type React from "react"
import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { DM_Sans, Space_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "@/lib/cart-context"
import { ExitIntentPopup } from "@/components/exit-intent-popup"
import { SocialProofToasts } from "@/components/social-proof-toasts"
import { SITE_URL, organizationJsonLd, websiteJsonLd } from "@/lib/seo"
import "./globals.css"

const _dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" })
const _spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Measure Joy | Y2K Digital Cameras & Retro Tech",
    template: "%s | Measure Joy",
  },
  description:
    "Reviving Y2K digital cameras for a new generation. Curated, tested vintage digicams from Canon, Sony, Nikon, Fujifilm, and more — every camera passes a 15-point inspection and ships with a 90-day warranty.",
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
    title: "Measure Joy | Y2K Digital Cameras & Retro Tech",
    description:
      "Curated, tested Y2K digital cameras with a 90-day warranty. Capture the authentic early-digital aesthetic.",
    images: [
      {
        url: "/aesthetic-flat-lay-vintage-digital-cameras-y2k-nos.jpg",
        width: 1200,
        height: 630,
        alt: "Measure Joy — Y2K digital camera collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Measure Joy | Y2K Digital Cameras & Retro Tech",
    description:
      "Curated, tested Y2K digital cameras with a 90-day warranty.",
    images: ["/aesthetic-flat-lay-vintage-digital-cameras-y2k-nos.jpg"],
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
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`font-sans antialiased ${_dmSans.variable} ${_spaceMono.variable}`}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
          />
          <CartProvider>
            {children}
            <ExitIntentPopup />
            <SocialProofToasts />
          </CartProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
