import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, Space_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "@/lib/cart-context"
import { ExitIntentPopup } from "@/components/exit-intent-popup"
import { SocialProofToasts } from "@/components/social-proof-toasts"
import "./globals.css"

const _dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" })
const _spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
})

export const metadata: Metadata = {
  title: "Measure Joy | Y2K Digital Cameras & Retro Tech",
  description:
    "Reviving Y2K digital cameras for a new generation. Curated, tested, and ready to capture your memories.",
  generator: "v0.app",
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
    <html lang="en">
      <body className={`font-sans antialiased ${_dmSans.variable} ${_spaceMono.variable}`}>
        <CartProvider>
          {children}
          <ExitIntentPopup />
          <SocialProofToasts />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
