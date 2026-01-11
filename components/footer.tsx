import Link from "next/link"
import { Instagram, Twitter, Youtube } from "lucide-react"

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

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-black tracking-tight uppercase">Measure Joy</span>
            </Link>
            <p className="text-sm text-background/60 mt-4 max-w-xs leading-relaxed">
              Reviving Y2K digital cameras for a new generation. Experience the magic of early digital photography.
            </p>
            <div className="flex gap-2 mt-6">
              <Link
                href="https://instagram.com"
                className="w-10 h-10 bg-background/10 flex items-center justify-center text-background/60 hover:text-background hover:bg-pop-pink transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </Link>
              <Link
                href="https://twitter.com"
                className="w-10 h-10 bg-background/10 flex items-center justify-center text-background/60 hover:text-background hover:bg-pop-pink transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="https://youtube.com"
                className="w-10 h-10 bg-background/10 flex items-center justify-center text-background/60 hover:text-background hover:bg-pop-pink transition-colors"
              >
                <Youtube className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Links */}
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

      {/* Bottom bar */}
      <div className="border-t border-background/10">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/50 uppercase tracking-wide">
            © {new Date().getFullYear()} Measure Joy. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-pop-yellow">★</span>
            <span className="font-mono text-xs text-background/50 uppercase">Made for Y2K lovers</span>
            <span className="text-pop-pink">★</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
