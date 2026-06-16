import type React from "react"
import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter, Archivo, Space_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "@/lib/cart-context"
import { ExitIntentPopup } from "@/components/exit-intent-popup"
import { SocialProofToasts } from "@/components/social-proof-toasts"
import "./globals.css"

// Retrospekt-style type system: Inter (body) + Archivo (display/labels, tracked uppercase) + Space Mono
const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
})
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
    <ClerkProvider>
      <html lang="en">
        <body className={`font-sans antialiased ${_inter.variable} ${_archivo.variable} ${_spaceMono.variable}`}>
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
