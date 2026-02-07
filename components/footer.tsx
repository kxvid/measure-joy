import Link from "next/link"

interface FooterProps {
  cms?: Record<string, any>
}

const footerLinks = {
  shop: [
    { name: "All Products", href: "/shop" },
    { name: "Digital Cameras", href: "/shop?category=camera" },
    { name: "Accessories", href: "/shop?category=accessory" },
    { name: "New Arrivals", href: "/shop?sort=newest" },
  ],
  support: [
    { name: "Contact Us", href: "/contact" },
    { name: "Camera Repair", href: "/repair" },
    { name: "Shipping Info", href: "/shipping" },
    { name: "Returns & Warranty", href: "/returns" },
    { name: "FAQ", href: "/faq" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Journal", href: "/journal" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
  ],
}

const DEFAULT_TAGLINE = "Reviving Y2K digital cameras for a new generation. Experience the magic of early digital photography."
const DEFAULT_BOTTOM = "Made for Y2K lovers"

export function Footer({ cms = {} }: FooterProps) {
  const tagline = cms.tagline || DEFAULT_TAGLINE
  const bottomText = cms.bottom_text || DEFAULT_BOTTOM

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          <div className="col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-black tracking-tight uppercase">Measure Joy</span>
            </Link>
            <p className="text-sm text-background/60 mt-4 max-w-xs leading-relaxed">
              {tagline}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-xs text-background uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-background/60 hover:text-pop-yellow transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-xs text-background uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-background/60 hover:text-pop-yellow transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-xs text-background uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-background/60 hover:text-pop-yellow transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/50 uppercase tracking-wide">
            &copy; {new Date().getFullYear()} Measure Joy. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-pop-yellow">★</span>
            <span className="font-mono text-xs text-background/50 uppercase">{bottomText}</span>
            <span className="text-pop-pink">★</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
