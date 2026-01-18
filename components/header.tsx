"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, ShoppingBag, Search, ChevronDown, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { CartDrawer } from "@/components/cart-drawer"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

const navigation = [
  {
    name: "Shop All",
    href: "/shop",
    featured: true,
  },
  { name: "Cameras", href: "/shop?category=camera" },
  { name: "Accessories", href: "/shop?category=accessory" },
  { name: "Repair", href: "/repair" },
  { name: "About", href: "/about" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { totalItems } = useCart()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-xl border-b-2 border-foreground" : "bg-background"
          }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>

          {/* Desktop navigation - left */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${item.featured
                    ? "bg-foreground text-background hover:bg-pop-pink"
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Logo - center */}
          <Link
            href="/"
            className="flex items-center gap-2 group absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2"
          >
            <div className="relative">
              <span className="text-lg lg:text-xl font-black tracking-tight uppercase">Measure Joy</span>
              <span className="absolute -top-1 -right-6 text-[9px] font-mono font-bold text-pop-pink">Y2K</span>
            </div>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
              <Link href="/shop">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Link>
            </Button>

            {/* Wishlist link - only show when signed in */}
            <SignedIn>
              <Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
                <Link href="/account/wishlist">
                  <Heart className="h-5 w-5" />
                  <span className="sr-only">Wishlist</span>
                </Link>
              </Button>
            </SignedIn>

            {/* User button - Clerk handles sign in/out */}
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </SignedIn>
            <SignedOut>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/sign-in">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="sr-only">Sign In</span>
                </Link>
              </Button>
            </SignedOut>

            <Button variant="ghost" size="icon" className="relative" onClick={() => setCartOpen(true)}>
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-pop-pink text-[10px] font-bold text-white flex items-center justify-center">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </div>
        </nav>

        {/* Mobile menu - full screen overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground bg-background">
              <span className="text-lg font-black tracking-tight uppercase">Measure Joy</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 bg-background h-[calc(100vh-60px)] overflow-y-auto">
              <nav className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-between py-4 text-xl font-bold text-foreground uppercase tracking-wide hover:text-pop-pink transition-colors border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                    <ChevronDown className="h-5 w-5 -rotate-90" />
                  </Link>
                ))}
                <SignedIn>
                  <Link
                    href="/account/wishlist"
                    className="flex items-center justify-between py-4 text-xl font-bold text-foreground uppercase tracking-wide hover:text-pop-pink transition-colors border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Wishlist
                    <Heart className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center justify-between py-4 text-xl font-bold text-foreground uppercase tracking-wide hover:text-pop-pink transition-colors border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Account
                    <ChevronDown className="h-5 w-5 -rotate-90" />
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link
                    href="/sign-in"
                    className="flex items-center justify-between py-4 text-xl font-bold text-foreground uppercase tracking-wide hover:text-pop-pink transition-colors border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                    <ChevronDown className="h-5 w-5 -rotate-90" />
                  </Link>
                </SignedOut>
              </nav>

              {/* Mobile promo */}
              <div className="mt-8 p-5 bg-pop-yellow">
                <p className="font-mono text-xs text-foreground font-bold uppercase tracking-wide mb-2">
                  ★ Limited Time
                </p>
                <p className="text-lg font-bold text-foreground">Free shipping on orders $75+</p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Cart drawer component */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
