import Link from "next/link"

interface FooterProps {
  cms?: Record<string, any>
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
            <Link href="/" className="inline-block">
              <span className="inline-block bg-background px-2.5 py-1 font-display text-lg font-extrabold uppercase tracking-tight text-foreground">
                Measure Joy
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-background/60">{tagline}</p>
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
