"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, ShoppingBag, Search, ChevronDown, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { CartDrawer } from "@/components/cart-drawer"
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs"

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
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { totalItems } = useCart()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop")
    setSearchOpen(false)
    setSearchQuery("")
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur-xl border-b-2 border-foreground" : "bg-background border-b-2 border-transparent"
        }`}
      >
        <nav className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 py-3 lg:px-6">
          {/* Left: mobile menu button + desktop nav */}
          <div className="flex items-center justify-start">
            <Button variant="ghost" size="icon" className="lg:hidden cursor-pointer" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>

            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors rounded-full ${
                    item.featured
                      ? "bg-foreground text-background hover:bg-brand"
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Center: logo */}
          <Link href="/" className="group flex items-center justify-center">
            <div className="relative">
              <span className="font-display text-xl lg:text-2xl font-semibold tracking-tight">Measure Joy</span>
              <span className="absolute -top-0.5 -right-6 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Y2K</span>
            </div>
          </Link>

          {/* Right: actions */}
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex cursor-pointer"
              onClick={() => setSearchOpen((o) => !o)}
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <Search className="h-5 w-5" />
            </Button>

            <SignedIn>
              <AdminLink />
              <Button variant="ghost" size="icon" className="hidden sm:flex cursor-pointer" asChild>
                <Link href="/account/wishlist">
                  <Heart className="h-5 w-5" />
                  <span className="sr-only">Wishlist</span>
                </Link>
              </Button>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </SignedIn>
            <SignedOut>
              <Button variant="ghost" size="icon" className="cursor-pointer" asChild>
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

            <Button variant="ghost" size="icon" className="relative cursor-pointer" onClick={() => setCartOpen(true)}>
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-brand text-[10px] font-bold text-white flex items-center justify-center">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </div>
        </nav>

        {/* Search bar (expands under nav) */}
        {searchOpen && (
          <div className="border-t border-border bg-background">
            <form onSubmit={submitSearch} className="mx-auto max-w-7xl px-4 lg:px-6 py-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cameras, brands, accessories..."
                  className="pl-11 pr-24 h-12 rounded-full bg-secondary border-0"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 rounded-full font-bold uppercase tracking-wide cursor-pointer"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Mobile menu - full screen overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground bg-background">
              <span className="text-lg font-black tracking-tight uppercase">Measure Joy</span>
              <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 bg-background h-[calc(100dvh-60px)] overflow-y-auto">
              {/* Mobile search */}
              <form
                onSubmit={(e) => {
                  submitSearch(e)
                  setMobileMenuOpen(false)
                }}
                className="relative mb-6"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pl-11 h-12 rounded-full bg-secondary border-0"
                />
              </form>

              <nav className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-between py-4 text-xl font-bold text-foreground uppercase tracking-wide hover:text-brand transition-colors border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                    <ChevronDown className="h-5 w-5 -rotate-90" />
                  </Link>
                ))}
                <SignedIn>
                  <MobileAdminLink setOpen={setMobileMenuOpen} />
                  <Link
                    href="/account/wishlist"
                    className="flex items-center justify-between py-4 text-xl font-bold text-foreground uppercase tracking-wide hover:text-brand transition-colors border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Wishlist
                    <Heart className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center justify-between py-4 text-xl font-bold text-foreground uppercase tracking-wide hover:text-brand transition-colors border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Account
                    <ChevronDown className="h-5 w-5 -rotate-90" />
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link
                    href="/sign-in"
                    className="flex items-center justify-between py-4 text-xl font-bold text-foreground uppercase tracking-wide hover:text-brand transition-colors border-b border-border"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                    <ChevronDown className="h-5 w-5 -rotate-90" />
                  </Link>
                </SignedOut>
              </nav>

              {/* Mobile promo */}
              <div className="mt-8 p-5 bg-pop-yellow rounded-2xl">
                <p className="font-mono text-xs text-foreground font-bold uppercase tracking-wide mb-2">★ Limited Time</p>
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

function MobileAdminLink({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { user } = useUser()
  if (user?.publicMetadata?.role !== "admin") return null

  return (
    <Link
      href="/admin/orders"
      className="flex items-center justify-between py-4 text-xl font-bold text-brand uppercase tracking-wide hover:text-brand/80 transition-colors border-b border-border"
      onClick={() => setOpen(false)}
    >
      Admin Panel
      <ChevronDown className="h-5 w-5 -rotate-90" />
    </Link>
  )
}

function AdminLink() {
  const { user } = useUser()
  if (user?.publicMetadata?.role !== "admin") return null

  return (
    <Link
      href="/admin/orders"
      className="hidden lg:flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand hover:bg-secondary rounded-full transition-colors"
    >
      Admin
    </Link>
  )
}
