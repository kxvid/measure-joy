"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  Search,
  Heart,
  Menu,
  X,
  UserRound,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { ShoppingBag } from "lucide-react";
import { useStorefrontCopy } from "./copy-provider";
import { useSavedFinds } from "./use-saved-finds";
const LIVE = "";
const cameraLinks = [
  ["All cameras", "/shop?category=camera"],
  ["Digital cameras", "/shop?category=digital"],
  ["Film & instant cameras", "/shop?category=film"],
  ["All finds", "/shop"],
];
const extraLinks = [
  ["All accessories", "/shop?category=accessory"],
  ["Memory cards", "/shop?category=memory"],
  ["Batteries & chargers", "/shop?category=power"],
  ["Lenses", "/shop?category=lens"],
];
export function SiteHeader({
  savedCount,
  onSearch,
  onSaved,
}: {
  savedCount?: number;
  onSearch?: () => void;
  onSaved?: () => void;
}) {
  const { totalItems } = useCart();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const savedFinds = useSavedFinds();
  const visibleSavedCount =
    savedCount ?? (savedFinds.ready ? savedFinds.savedIds.length : null);
  useEffect(() => {
    if (menu) {
      ref.current?.showModal();
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);
  function closeDropdowns() {
    navRef.current?.querySelectorAll("details[open]").forEach((details) => {
      details.removeAttribute("open");
    });
  }
  function close() {
    ref.current?.close();
    setMenu(false);
    opener.current?.focus();
  }
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="announcement" aria-label="Shopping benefits">
        <Link prefetch={false} href="/shipping">Free shipping over $75</Link>
        <span aria-hidden="true">·</span>
        <Link prefetch={false} href="/returns">90-day camera warranty</Link>
      </div>
      <header className="site-header">
        <Link href="/" className="brand-logo" aria-label="Measure Joy home">
          <img
            src="/brand/logos/measure-joy-horizontal-ink.svg"
            alt="measure joy"
            width="211"
            height="45"
          />
        </Link>
        <nav ref={navRef} aria-label="Main navigation">
          <details className="nav-dropdown">
            <summary>
              Shop cameras <ChevronDown size={12} />
            </summary>
            <div className="nav-panel">
              <p>FIND YOUR POINT OF VIEW</p>
              {cameraLinks.map(([label, href]) => (
                <Link prefetch={false} key={label} href={href} onNavigate={closeDropdowns}>
                  {label}
                  <ArrowUpRight size={13} />
                </Link>
              ))}
              <div className="nav-brands">
                {["Canon", "Sony", "Nikon", "Fujifilm"].map((brand) => (
                  <Link prefetch={false}
                    href={`/shop?category=camera&brand=${brand}`}
                    key={brand}
                    onNavigate={closeDropdowns}
                  >
                    {brand}
                  </Link>
                ))}
              </div>
            </div>
          </details>
          <details className="nav-dropdown">
            <summary>
              The extras <ChevronDown size={12} />
            </summary>
            <div className="nav-panel">
              <p>THE LITTLE THINGS</p>
              {extraLinks.map(([label, href]) => (
                <Link prefetch={false} key={label} href={href} onNavigate={closeDropdowns}>
                  {label}
                  <ArrowUpRight size={13} />
                </Link>
              ))}
            </div>
          </details>
          <a href="/repair">Repairs & care</a>
          <Link href="/journal" onNavigate={closeDropdowns}>
            Field notes
          </Link>
          <Link prefetch={false} href="/about" onNavigate={closeDropdowns}>
            Our story
          </Link>
        </nav>
        <div className="header-actions">
          <button
            aria-label="Search cameras"
            onClick={
              onSearch ||
              (() => router.push("/shop#collection-search"))
            }
          >
            <Search size={20} />
          </button>
          <button
            className="saved-nav"
            aria-label={`Saved cameras${visibleSavedCount === null ? "" : `, ${visibleSavedCount} items`}`}
            onClick={
              onSaved ||
              (() => router.push("/shop?saved=1&stock=all"))
            }
          >
            <Heart size={20} />
            {visibleSavedCount !== null && <span>{visibleSavedCount}</span>}
          </button>
          <a className="account-nav" href="/account" aria-label="Your account">
            <UserRound size={20} />
          </a>
          <a
            href="/cart"
            className="cart-nav"
            aria-label={`Shopping bag, ${totalItems} items`}
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && <span>{totalItems}</span>}
          </a>
          <button
            ref={opener}
            className="mobile-menu-button"
            aria-label="Open navigation"
            onClick={() => setMenu(true)}
          >
            <Menu size={21} />
          </button>
        </div>
      </header>
      <dialog
        className="store-dialog drawer-dialog"
        ref={ref}
        aria-labelledby="navigation-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="dialog-inner">
          <button
            className="dialog-close"
            onClick={close}
            aria-label="Close navigation"
          >
            <X size={22} />
          </button>
          <p className="eyebrow" id="navigation-title">
            FIND YOUR JOY
          </p>
          <nav className="mobile-category-nav" aria-label="Mobile navigation">
            <div>
              <p>THE CAMERAS</p>
              {cameraLinks.map(([label, href]) => (
                <Link prefetch={false} key={label} href={href} onNavigate={close}>
                  {label}
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
            <div>
              <p>THE LITTLE EXTRAS</p>
              {extraLinks.map(([label, href]) => (
                <Link prefetch={false} key={label} href={href} onNavigate={close}>
                  {label}
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
            <a href="/repair">
              Repairs & care <ArrowUpRight size={18} />
            </a>
            <Link prefetch={false} href="/about" onNavigate={close}>
              Our story <ArrowUpRight size={18} />
            </Link>
            <Link prefetch={false} href="/faq" onNavigate={close}>
              A little help <ArrowUpRight size={18} />
            </Link>
            <Link prefetch={false} href="/brand" onNavigate={close}>
              Brand studio <ArrowUpRight size={18} />
            </Link>
            <a href="/cart">
              Your shopping bag <ArrowUpRight size={18} />
            </a>
            <a href="/account">
              Your account <ArrowUpRight size={18} />
            </a>
          </nav>
        </div>
      </dialog>
    </>
  );
}
export function SiteFooter() {
  const copy = useStorefrontCopy();
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <p className="eyebrow">GO MAKE SOME MEMORIES.</p>
          <h2>
            See you
            <br />
            <em>out there.</em> <span className="footer-flower">✳</span>
          </h2>
        </div>
        <div className="footer-links">
          <div>
            <p>FIND YOUR JOY</p>
            <Link prefetch={false} href="/shop">Shop the collection</Link>
            <Link prefetch={false} href="/shop?category=digital">Digital cameras</Link>
            <Link prefetch={false} href="/shop?category=film">Film cameras</Link>
            <Link prefetch={false} href="/shop?category=accessory">The extras</Link>
            <Link prefetch={false} href="/brand">Brand studio</Link>
          </div>
          <div>
            <p>A LITTLE HELP</p>
            <a href="/contact">Contact us</a>
            <a href="/repair">Camera repair</a>
            <Link href="/account/orders">Your orders</Link>
            <Link prefetch={false} href="/faq">Frequently asked</Link>
            <Link prefetch={false} href="/shipping">Shipping & returns</Link>
          </div>
          <div>
            <p>FOLLOW ALONG</p>
            <a
              href="https://www.instagram.com/measurejoycamera/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram <ArrowUpRight size={12} />
            </a>
            <Link prefetch={false} href={`${LIVE}/journal`}>
              Field notes <ArrowUpRight size={12} />
            </Link>
            <Link prefetch={false} href="/about">Our story</Link>
            <a href="/contact">
              Order help <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-wordmark" aria-hidden="true">
        measure joy<span>✳</span>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MEASURE JOY</span>
        <span>{copy.footer_location}</span>
        <Link prefetch={false} href={`${LIVE}/privacy`}>Privacy</Link>
        <Link prefetch={false} href={`${LIVE}/terms`}>Terms</Link>
      </div>
    </footer>
  );
}
