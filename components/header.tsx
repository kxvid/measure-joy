"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Menu, X, ShoppingBag, Search, ChevronDown, Heart, User, ArrowRight } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { CartDrawer } from "@/components/cart-drawer"
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs"

interface MegaColumn {
  heading: string
  links: { name: string; href: string }[]
}
interface NavItem {
  name: string
  href: string
  menu?: {
    columns: MegaColumn[]
    featured: { title: string; href: string; image: string }
  }
}

const navigation: NavItem[] = [
  { name: "Shop All", href: "/shop" },
  {
    name: "Cameras",
    href: "/shop?category=camera",
    menu: {
      columns: [
        {
          heading: "By Type",
          links: [
            { name: "Point & Shoot", href: "/shop?category=camera" },
            { name: "Premium Compacts", href: "/shop?category=camera" },
            { name: "Shop All Cameras", href: "/shop?category=camera" },
          ],
        },
        {
          heading: "By Brand",
          links: [
            { name: "Canon", href: "/shop?brand=Canon" },
            { name: "Sony", href: "/shop?brand=Sony" },
            { name: "Nikon", href: "/shop?brand=Nikon" },
            { name: "Fujifilm", href: "/shop?brand=Fujifilm" },
            { name: "Olympus", href: "/shop?brand=Olympus" },
          ],
        },
      ],
      featured: {
        title: "New arrivals, every week",
        href: "/shop?sort=newest",
        image: "/editorial-y2k-flatlay.png",
      },
    },
  },
  {
    name: "Accessories",
    href: "/shop?category=accessory",
    menu: {
      columns: [
        {
          heading: "Gear",
          links: [
            { name: "Cases & Bags", href: "/shop?category=accessory&sub=case" },
            { name: "Straps", href: "/shop?category=accessory&sub=strap" },
            { name: "Memory Cards", href: "/shop?category=accessory&sub=memory" },
          ],
        },
        {
          heading: "More",
          links: [
            { name: "Cleaning Kits", href: "/shop?category=accessory&sub=cleaning" },
            { name: "Tripods", href: "/shop?category=accessory&sub=tripod" },
            { name: "Shop All", href: "/shop?category=accessory" },
          ],
        },
      ],
      featured: {
        title: "Keep your kit shooting",
        href: "/shop?category=accessory",
        image: "/camera-cleaning-kit-complete.jpg",
      },
    },
  },
  { name: "Repair", href: "/repair" },
  { name: "About", href: "/about" },
]

const navLinkClass =
  "font-display text-[13px] font-medium uppercase tracking-[0.12em] text-foreground/80 hover:text-foreground transition-colors relative after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-foreground after:transition-all"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { totalItems } = useCart()
  const router = useRouter()
  const reduce = useReducedMotion()

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

  const active = navigation.find((n) => n.name === activeMenu && n.menu)?.menu

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-background transition-shadow duration-300 ${
          scrolled || activeMenu ? "border-b border-border" : "border-b border-transparent"
        }`}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-8">
            <Button variant="ghost" size="icon" className="lg:hidden -ml-2 cursor-pointer" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>

            <Link href="/" className="shrink-0" onMouseEnter={() => setActiveMenu(null)}>
              <span className="inline-block bg-foreground px-2.5 py-1 font-display text-base lg:text-lg font-extrabold uppercase tracking-tight text-background">
                Measure Joy
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-7">
              {navigation.map((item) => (
                <div key={item.name} onMouseEnter={() => setActiveMenu(item.menu ? item.name : null)}>
                  <Link href={item.href} className={`${navLinkClass} ${activeMenu === item.name ? "after:w-full text-foreground" : "after:w-0 hover:after:w-full"}`}>
                    {item.name}
                  </Link>
                </div>
              ))}
              <SignedIn>
                <span onMouseEnter={() => setActiveMenu(null)}>
                  <AdminLink />
                </span>
              </SignedIn>
            </div>
          </div>

          {/* Right: icon actions */}
          <div className="flex items-center gap-1" onMouseEnter={() => setActiveMenu(null)}>
            <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => setSearchOpen((o) => !o)} aria-label="Search" aria-expanded={searchOpen}>
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </Button>
            <SignedIn>
              <Button variant="ghost" size="icon" className="hidden sm:flex cursor-pointer" asChild>
                <Link href="/account/wishlist">
                  <Heart className="h-5 w-5" strokeWidth={1.5} />
                  <span className="sr-only">Wishlist</span>
                </Link>
              </Button>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
            </SignedIn>
            <SignedOut>
              <Button variant="ghost" size="icon" className="cursor-pointer" asChild>
                <Link href="/sign-in">
                  <User className="h-5 w-5" strokeWidth={1.5} />
                  <span className="sr-only">Account</span>
                </Link>
              </Button>
            </SignedOut>
            <Button variant="ghost" size="icon" className="relative cursor-pointer" onClick={() => setCartOpen(true)}>
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center bg-foreground px-1 text-[10px] font-bold text-background">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </div>
        </nav>

        {/* Mega-menu panel */}
        <AnimatePresence>
          {active && (
            <motion.div
              key={activeMenu}
              initial={reduce ? undefined : { opacity: 0, y: -8 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-full hidden lg:block border-t border-border bg-background shadow-[0_12px_24px_-12px_rgba(0,0,0,0.12)]"
            >
              <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-8 px-8 py-10">
                {active.columns.map((col) => (
                  <div key={col.heading} className="col-span-3">
                    <p className="mb-4 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {col.heading}
                    </p>
                    <ul className="space-y-2.5">
                      {col.links.map((l) => (
                        <li key={l.name}>
                          <Link
                            href={l.href}
                            onClick={() => setActiveMenu(null)}
                            className="font-display text-sm uppercase tracking-[0.06em] text-foreground/75 hover:text-foreground transition-colors"
                          >
                            {l.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <Link
                  href={active.featured.href}
                  onClick={() => setActiveMenu(null)}
                  className="group col-span-6 col-start-7 relative overflow-hidden bg-secondary"
                >
                  <div className="relative aspect-[16/7]">
                    <Image src={active.featured.image} alt={active.featured.title} fill sizes="50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <span className="absolute bottom-4 left-4 flex items-center gap-2 bg-background px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.1em]">
                    {active.featured.title}
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                  </span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-border bg-background">
            <form onSubmit={submitSearch} className="mx-auto max-w-[1400px] px-5 lg:px-8 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH CAMERAS, BRANDS, ACCESSORIES"
                  className="h-12 rounded-none border-border bg-background pl-10 pr-24 font-display text-sm uppercase tracking-[0.08em] placeholder:text-muted-foreground/70"
                />
                <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 rounded-none font-display text-xs font-semibold uppercase tracking-[0.1em] cursor-pointer">
                  Search
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="inline-block bg-foreground px-2.5 py-1 font-display text-base font-extrabold uppercase tracking-tight text-background">
                Measure Joy
              </span>
              <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-5 h-[calc(100dvh-65px)] overflow-y-auto">
              <form onSubmit={(e) => { submitSearch(e); setMobileMenuOpen(false) }} className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="SEARCH" className="h-12 rounded-none border-border bg-background pl-10 font-display text-sm uppercase tracking-[0.08em]" />
              </form>
              <nav>
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href} className="flex items-center justify-between py-4 font-display text-lg font-medium uppercase tracking-[0.08em] text-foreground border-b border-border" onClick={() => setMobileMenuOpen(false)}>
                    {item.name}
                    <ChevronDown className="h-5 w-5 -rotate-90 text-muted-foreground" />
                  </Link>
                ))}
                <SignedIn>
                  <MobileAdminLink setOpen={setMobileMenuOpen} />
                  <Link href="/account/wishlist" className="flex items-center justify-between py-4 font-display text-lg font-medium uppercase tracking-[0.08em] text-foreground border-b border-border" onClick={() => setMobileMenuOpen(false)}>
                    Wishlist <Heart className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                  </Link>
                  <Link href="/account" className="flex items-center justify-between py-4 font-display text-lg font-medium uppercase tracking-[0.08em] text-foreground border-b border-border" onClick={() => setMobileMenuOpen(false)}>
                    Account <ChevronDown className="h-5 w-5 -rotate-90 text-muted-foreground" />
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link href="/sign-in" className="flex items-center justify-between py-4 font-display text-lg font-medium uppercase tracking-[0.08em] text-foreground border-b border-border" onClick={() => setMobileMenuOpen(false)}>
                    Account <ChevronDown className="h-5 w-5 -rotate-90 text-muted-foreground" />
                  </Link>
                </SignedOut>
              </nav>
              <div className="mt-8 bg-brand px-5 py-4">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-brand-foreground">Free US shipping on orders $99+</p>
              </div>
            </div>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

function MobileAdminLink({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { user } = useUser()
  if (user?.publicMetadata?.role !== "admin") return null
  return (
    <Link href="/admin/orders" className="flex items-center justify-between py-4 font-display text-lg font-medium uppercase tracking-[0.08em] text-foreground border-b border-border" onClick={() => setOpen(false)}>
      Admin Panel <ChevronDown className="h-5 w-5 -rotate-90 text-muted-foreground" />
    </Link>
  )
}

function AdminLink() {
  const { user } = useUser()
  if (user?.publicMetadata?.role !== "admin") return null
  return (
    <Link href="/admin/orders" className="font-display text-[13px] font-medium uppercase tracking-[0.12em] text-foreground/80 hover:text-foreground transition-colors">
      Admin
    </Link>
  )
}
