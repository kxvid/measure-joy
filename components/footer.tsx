import Link from "next/link"
import { Instagram } from "lucide-react"

interface FooterProps {
  cms?: Record<string, any>
}

const SOCIAL = {
  instagram: "https://www.instagram.com/measurejoy/",
  tiktok: "https://www.tiktok.com/@measurejoy",
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.04-2.82h-3.1v12.4a2.32 2.32 0 1 1-2.32-2.32c.24 0 .47.04.69.1v-3.16a5.46 5.46 0 0 0-.69-.04 5.43 5.43 0 1 0 5.43 5.43V9.01a7.3 7.3 0 0 0 4.27 1.37V7.27a4.28 4.28 0 0 1-3.24-1.45Z" />
    </svg>
  )
}

const footerLinks = {
  Shop: [
    { name: "All Products", href: "/shop" },
    { name: "Digital Cameras", href: "/shop?category=camera" },
    { name: "Accessories", href: "/shop?category=accessory" },
    { name: "New Arrivals", href: "/shop?sort=newest" },
  ],
  Support: [
    { name: "Contact Us", href: "/contact" },
    { name: "Camera Repair", href: "/repair" },
    { name: "Shipping Info", href: "/shipping" },
    { name: "Returns & Warranty", href: "/returns" },
    { name: "FAQ", href: "/faq" },
  ],
  Company: [
    { name: "About Us", href: "/about" },
    { name: "Journal", href: "/journal" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
  ],
}

const DEFAULT_TAGLINE =
  "Reviving Y2K digital cameras for a new generation. Tested, cleaned, and ready to shoot."
const DEFAULT_BOTTOM = "Made for Y2K lovers"

export function Footer({ cms = {} }: FooterProps) {
  const tagline = cms.tagline || DEFAULT_TAGLINE
  const bottomText = cms.bottom_text || DEFAULT_BOTTOM

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5 lg:gap-12">
          <div className="col-span-2">
            <Link href="/" className="inline-block" aria-label="Measure Joy — home">
              <span className="inline-flex bg-background p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/stacked-cream.svg" alt="Measure Joy" className="h-20 w-auto" />
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-background/60">{tagline}</p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Measure Joy on Instagram"
                className="flex h-10 w-10 items-center justify-center border border-background/25 text-background/80 transition-colors hover:border-background hover:text-background"
              >
                <Instagram className="h-5 w-5" strokeWidth={1.5} />
              </a>
              <a
                href={SOCIAL.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Measure Joy on TikTok"
                className="flex h-10 w-10 items-center justify-center border border-background/25 text-background/80 transition-colors hover:border-background hover:text-background"
              >
                <TikTokIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-4 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-background/90">
                {heading}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="font-display text-[12px] uppercase tracking-[0.06em] text-background/55 transition-colors hover:text-background"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-5 py-6 lg:flex-row lg:px-8">
          <p className="font-display text-[11px] uppercase tracking-[0.12em] text-background/45">
            © {new Date().getFullYear()} Measure Joy. All rights reserved.
          </p>
          <p className="font-display text-[11px] uppercase tracking-[0.12em] text-background/45">{bottomText}</p>
        </div>
      </div>
    </footer>
  )
}
