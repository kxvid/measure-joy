"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useSavedFinds } from "./use-saved-finds";
import { useStorefrontCopy } from "./copy-provider";
import { Newsletter } from "@/components/newsletter";
import { ProductReviews } from "@/components/product-reviews";
import { SiteHeader, SiteFooter } from "./site-chrome";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Heart,
  X,
  Plus,
  Minus,
  SlidersHorizontal,
  Check,
  Camera,
  Package,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import {
  type Product,
  isAvailable,
  formatPrice,
  productPath,
  resolveProductParam,
  checkoutUrl,
  safeImageUrl,
} from "@/lib/storefront-catalog";
import {
  type Category,
  type ShopFilters,
  DEFAULT_FILTERS,
  categoryMatch,
  classifyProduct,
  readFilters,
  filtersUrl,
  readSavedIds,
  missingSavedIds,
} from "./catalog-filters";

type Mode = "home" | "shop" | "product";
const LIVE = "";
const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "All finds" },
  { id: "digital", label: "Digital cameras" },
  { id: "film", label: "Film cameras" },
  { id: "accessory", label: "The extras" },
];
const EXTRA_LABELS = {
  lens: "Lenses",
  memory: "Memory cards",
  power: "Batteries & chargers",
};

function Spark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 0c3 23 9 29 32 32-23 3-29 9-32 32C29 41 23 35 0 32 23 29 29 23 32 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
function ProductImage({
  product,
  index = 0,
  className = "",
}: {
  product: Product;
  index?: number;
  className?: string;
}) {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const src = safeImageUrl(product.images?.[index]);
  return src && src !== brokenSrc ? (
    <img
      className={className}
      src={src}
      alt={product.name}
      loading="lazy"
      onError={() => setBrokenSrc(src)}
    />
  ) : (
    <div className="image-fallback">
      <Camera size={40} strokeWidth={1} />
      <span>Meet your next memory maker</span>
    </div>
  );
}
function ProductCard({
  product,
  saved,
  toggle,
}: {
  product: Product;
  saved: boolean;
  toggle: (id: string) => void;
}) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <a href={productPath(product)} aria-label={`View ${product.name}`}>
          <ProductImage product={product} />
        </a>
        <div className="product-status">
          {isAvailable(product) ? (
            product.stockCount === 1 ? (
              <span className="tag tag-lime">One of a kind</span>
            ) : (
              <span className="tag">Ready for a new story</span>
            )
          ) : (
            <span className="tag tag-muted">Found a home</span>
          )}
        </div>
        <button
          className={`save-button ${saved ? "is-saved" : ""}`}
          aria-label={`${saved ? "Unsave" : "Save"} ${product.name}`}
          aria-pressed={saved}
          onClick={() => toggle(product.id)}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
        <a
          className="card-explore"
          href={productPath(product)}
          aria-label={`Explore ${product.name}`}
        >
          <ArrowUpRight size={22} />
        </a>
      </div>
      <div className="product-meta">
        <span>
          {product.brand ||
            (categoryMatch(product, "camera")
              ? "Camera collection"
              : "The extras")}
        </span>
        <span>{product.condition}</span>
      </div>
      <a href={productPath(product)} className="product-name">
        {product.name}
      </a>
      <p className="product-price">{formatPrice(product.priceInCents)}</p>
    </article>
  );
}

export default function Storefront({
  mode = "home",
  productSlug,
  initialProduct,
  initialProducts,
  newsletter,
}: {
  mode?: Mode;
  productSlug?: string;
  initialProduct?: Product;
  initialProducts?: Product[];
  newsletter?: Record<string, string>;
}) {
  const cart = useCart();
  const copy = useStorefrontCopy();
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [filters, setFilters] = useState<ShopFilters>(DEFAULT_FILTERS);
  const [filtersReady, setFiltersReady] = useState(false);
  const { category, brand, query, year, sort, onlyAvailable, savedOnly } =
    filters;
  const savedFinds = useSavedFinds();
  const saved = savedFinds.savedIds;
  const [toast, setToast] = useState("");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [modal, setModal] = useState<"search" | "saved" | "menu" | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/products", { cache: "no-store", signal: abort.signal })
      .then(async (r) => {
        if (!r.ok)
          throw new Error("We couldn’t load the collection. Please try again.");
        return (await r.json()) as Product[];
      })
      .then((data) => setProducts(data))
      .catch((e) => {
        if (e.name !== "AbortError")
          setError("We couldn’t load the collection. Please try again.");
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [retry, initialProducts]);
  useEffect(() => {
    function restoreFilters() {
      const next = readFilters(window.location.search);
      setFilters(next);
      setSearchDraft(next.query);
      setFiltersReady(true);
    }
    restoreFilters();
    window.addEventListener("popstate", restoreFilters);
    return () => window.removeEventListener("popstate", restoreFilters);
  }, []);
  useEffect(() => {
    if (!filtersReady || mode !== "shop") return;
    const next = filtersUrl(window.location.href, filters);
    if (next !== window.location.href)
      window.history.replaceState(window.history.state, "", next);
  }, [filters, filtersReady, mode]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2300);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const el = dialog.current;
    if (modal && el) {
      el.showModal();
      document.body.style.overflow = "hidden";
    } else if (el?.open) el.close();
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal]);

  function openModal(type: "search" | "saved" | "menu") {
    opener.current = document.activeElement as HTMLElement;
    if (type === "search") setSearchDraft(query);
    setModal(type);
  }
  function closeModal() {
    setModal(null);
    dialog.current?.close();
    opener.current?.focus();
  }
  async function toggleSave(id: string) {
    const result = await savedFinds.toggle(id);
    setToast(
      result.success
        ? result.added
          ? "Saved for a little later"
          : "Removed from your saved cameras"
        : result.error || "Your saved finds are temporarily unavailable.",
    );
  }
  function retryCatalog() {
    setLoading(true);
    setError("");
    setRetry((previous) => previous + 1);
  }
  function updateFilters(patch: Partial<ShopFilters>) {
    setFilters((previous) => ({ ...previous, ...patch }));
  }
  function updateCategory(id: Category) {
    updateFilters({ category: id });
  }
  function selectedCategory(id: Category) {
    return category === id || (id === "accessory" && category in EXTRA_LABELS);
  }
  const brands = useMemo(
    () =>
      [
        ...new Set(
          products.map((p) => p.brand).filter((b): b is string => !!b),
        ),
      ].sort(),
    [products],
  );
  const filtered = useMemo(
    () =>
      products
        .filter(
          (p) =>
            categoryMatch(p, category) &&
            (!savedOnly || saved.includes(p.id)) &&
            (!onlyAvailable || isAvailable(p)) &&
            (brand === "all" ||
              p.brand?.toLowerCase() === brand.toLowerCase()) &&
            (year === "all" || p.year === year) &&
            `${p.name} ${p.brand || ""} ${p.description}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "price-low"
            ? a.priceInCents - b.priceInCents
            : sort === "price-high"
              ? b.priceInCents - a.priceInCents
              : (b.createdAt || 0) - (a.createdAt || 0),
        ),
    [
      products,
      category,
      onlyAvailable,
      brand,
      query,
      year,
      sort,
      savedOnly,
      saved,
    ],
  );
  const featured = useMemo(
    () =>
      [...products]
        .filter((p) => isAvailable(p) && categoryMatch(p, category))
        .sort(
          (a, b) =>
            Number(categoryMatch(b, "camera")) -
              Number(categoryMatch(a, "camera")) ||
            (b.createdAt || 0) - (a.createdAt || 0),
        )
        .slice(0, 8),
    [products, category],
  );
  const selected = useMemo(() => {
    if (initialProduct) return initialProduct;
    if (!productSlug) return undefined;
    try {
      const id = resolveProductParam(productSlug);
      return products.find((p) => p.id === id);
    } catch {
      return undefined;
    }
  }, [products, productSlug, initialProduct]);
  useEffect(() => {
    if (!selected) return;
    try {
      const previous = readSavedIds(
        JSON.parse(localStorage.getItem("recentlyViewed") || "[]"),
      );
      localStorage.setItem(
        "recentlyViewed",
        JSON.stringify(
          [selected.id, ...previous.filter((id) => id !== selected.id)].slice(
            0,
            20,
          ),
        ),
      );
    } catch {
      /* History remains optional when storage is unavailable. */
    }
  }, [selected]);
  const savedProducts = products.filter((p) => saved.includes(p.id));
  const unavailableSaved =
    !loading && !error ? missingSavedIds(saved, products) : [];
  const activeProducts = mode === "home" ? featured : filtered;

  function renderCatalog() {
    return loading ? (
      <div
        className="loading-grid"
        aria-label="Loading the collection"
        aria-busy="true"
      >
        {[0, 1, 2, 3].map((i) => (
          <div className="loading-card" key={i}>
            <div />
            <span />
            <span />
          </div>
        ))}
      </div>
    ) : error ? (
      <div className="catalog-message" role="alert">
        <Camera size={32} />
        <h3>A little pause in the picture.</h3>
        <p>{error}</p>
        <button className="button button-dark" onClick={retryCatalog}>
          Try again <RefreshCw size={16} />
        </button>
        <a href="/contact">
          Ask the workshop <ArrowUpRight size={14} />
        </a>
      </div>
    ) : activeProducts.length === 0 ? (
      <div className="catalog-message">
        <Camera size={32} />
        <h3>No finds in this frame.</h3>
        <p>Try another filter to find your next camera.</p>
        <button
          className="button button-dark"
          onClick={() =>
            setFilters({ ...DEFAULT_FILTERS, onlyAvailable: false })
          }
        >
          See all finds <ArrowRight size={16} />
        </button>
      </div>
    ) : (
      <div className="product-grid">
        {activeProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            saved={saved.includes(p.id)}
            toggle={toggleSave}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="storefront">
      <SiteHeader
        savedCount={saved.length}
        onSearch={() => openModal("search")}
        onSaved={() => openModal("saved")}
      />

      <main id="main-content">
        {mode === "home" && (
          <>
            <section className="hero">
              <div className="hero-photo">
                <img
                  src="/editorial/hero.webp"
                  alt="An editorial silver digital camera floating against a warm ivory backdrop"
                  fetchPriority="high"
                />
              </div>
              <div className="hero-topline">
                <span>
                  <i /> {copy.hero_badge}
                </span>
                <span>POINT. SHOOT. FEEL SOMETHING.</span>
              </div>
              <div className="hero-copy">
                <h1>
                  {copy.hero_line1}
                  <br />
                  <span>
                    {copy.hero_line2} <em>{copy.hero_accent}</em>
                  </span>
                </h1>
                <p>{copy.hero_description}</p>
                <a className="button button-dark hero-cta" href="/shop">
                  {copy.hero_button}{" "}
                  <span>
                    <ArrowUpRight size={20} />
                  </span>
                </a>
                <div className="hero-small">
                  <span className="small-star">✦</span> Vintage finds. Ready for
                  your next chapter.
                </div>
              </div>
              <div className="hero-sticker">
                <Spark />
                <span>
                  less scroll
                  <br />
                  more soul
                </span>
              </div>
              <a className="hero-snapshot" href="#story">
                <img
                  src="/editorial/lifestyle.webp"
                  alt="Friends enjoying a sunlit afternoon by the sea"
                />
                <span>
                  life looks better here. <ArrowUpRight size={15} />
                </span>
              </a>
              <div className="hero-bottom">
                <span>
                  CURATED IN CALIFORNIA <span className="tiny-dot" /> SENT WITH
                  JOY
                </span>
                <a href="#fresh-finds">
                  A FEW GOOD FINDS <span>↓</span>
                </a>
              </div>
            </section>
            <div className="belief-strip">
              <span>
                Old cameras. <i>New adventures.</i>
              </span>
              <Spark />
              <span>
                A little imperfect. <i>Entirely yours.</i>
              </span>
              <Spark />
              <span>
                Keep the moment. <i>Lose the scroll.</i>
              </span>
              <Spark />
            </div>
            <section
              id="fresh-finds"
              className="collection-section section-shell"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">01 / THE COLLECTION</p>
                  <h2>
                    Your next
                    <br className="mobile-break" /> <em>memory maker.</em>
                  </h2>
                </div>
                <a className="text-link" href="/shop">
                  Explore all finds <ArrowUpRight size={19} />
                </a>
              </div>
              <div className="collection-tabs" aria-label="Product categories">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className={selectedCategory(c.id) ? "selected" : ""}
                    aria-pressed={selectedCategory(c.id)}
                    onClick={() => updateCategory(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
                <span className="collection-note">
                  <i /> Fresh from the collection
                </span>
              </div>
              {renderCatalog()}
              <a className="button button-outline collection-more" href="/shop">
                There’s more where that came from <ArrowRight size={18} />
              </a>
            </section>
            <section id="story" className="story-section">
              <div className="story-image">
                <img
                  src="/editorial/lifestyle.webp"
                  alt="A candid coastal afternoon, captured in Measure Joy’s campaign imagery"
                  loading="lazy"
                />
                <span className="photo-caption">
                  THE GOOD STUFF HAPPENS OFFLINE.
                </span>
                <span className="story-index">MJ / 002</span>
              </div>
              <div className="story-copy">
                <p className="eyebrow">02 / WHY WE DO THIS</p>
                <h2>
                  Some things
                  <br />
                  are better
                  <br />
                  <em>out of focus.</em>
                </h2>
                <p className="story-description">{copy.story_paragraph1}</p>
                <p className="story-description">{copy.story_paragraph2}</p>
                <a className="text-link" href="/about">
                  A little more about us <ArrowUpRight size={20} />
                </a>
                <div className="story-signature">
                  with love, measure joy <Spark />
                </div>
              </div>
            </section>
            <section className="care-section section-shell">
              <p className="eyebrow">03 / LITTLE DETAILS. BIG DIFFERENCE.</p>
              <div className="care-grid">
                <div>
                  <span>01</span>
                  <Camera strokeWidth={1.3} />
                  <h3>Character included.</h3>
                  <p>
                    Real photos of the actual find. Explore its condition,
                    features, and details before you make it yours.
                  </p>
                </div>
                <div>
                  <span>02</span>
                  <ShieldCheck strokeWidth={1.3} />
                  <h3>Old soul. New chapter.</h3>
                  <p>
                    Cameras with a past, ready for what comes next. See every
                    listing for its condition and included kit.
                  </p>
                </div>
                <div>
                  <span>03</span>
                  <Package strokeWidth={1.3} />
                  <h3>A little help, always.</h3>
                  <p>
                    From choosing a camera to getting started, good advice is
                    just a conversation away.
                  </p>
                  <a href="/contact">
                    Say hello <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </section>
            <section className="brand-teaser">
              <div>
                <p className="eyebrow">A NEW LOOK FOR THE SAME GOOD FEELING</p>
                <h2>
                  Joy, by <em>design.</em>
                </h2>
                <p>
                  A whole world of color, character, and a little camera magic.
                </p>
                <a className="button button-dark" href="/brand">
                  Meet the brand system <ArrowUpRight size={18} />
                </a>
              </div>
              <div className="brand-teaser-art">
                <div className="brand-tile coral-tile">
                  <img
                    src="/brand/logos/measure-joy-icon-ink.svg"
                    alt="Measure Joy viewfinder mark"
                  />
                </div>
                <div className="brand-tile lime-tile">
                  <span>
                    good
                    <br />
                    things
                    <br />
                    <em>happen.</em>
                  </span>
                </div>
                <Spark className="teaser-spark" />
              </div>
            </section>
          </>
        )}

        {mode === "shop" && (
          <section className="shop-page section-shell">
            <div className="shop-intro">
              <p className="eyebrow">THE MEASURE JOY COLLECTION</p>
              <h1>
                A camera for
                <br />
                <em>your kind of life.</em>
                <Spark />
              </h1>
              <p>
                Digital nostalgia, film favorites, and the little extras.
                <br />
                Find the one that feels like you.
              </p>
            </div>
            <div className="shop-tools">
              <div className="collection-tabs">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    aria-pressed={selectedCategory(c.id)}
                    className={selectedCategory(c.id) ? "selected" : ""}
                    onClick={() => updateCategory(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <label className="catalog-search" id="collection-search">
                <Search size={18} />
                <input
                  aria-label="Search the collection"
                  placeholder="Find a camera, brand, or feeling…"
                  value={query}
                  onChange={(e) => updateFilters({ query: e.target.value })}
                />
                {query && (
                  <button
                    onClick={() => updateFilters({ query: "" })}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
            </div>
            <div className="filter-row">
              <span className="filter-count">
                {year !== "all" && (
                  <button
                    className="saved-filter-clear"
                    onClick={() => updateFilters({ year: "all" })}
                  >
                    Year {year} ×
                  </button>
                )}
                {category in EXTRA_LABELS && (
                  <button
                    className="saved-filter-clear"
                    onClick={() => updateCategory("accessory")}
                  >
                    {EXTRA_LABELS[category as keyof typeof EXTRA_LABELS]} ×
                  </button>
                )}
                {savedOnly && (
                  <button
                    className="saved-filter-clear"
                    onClick={() => updateFilters({ savedOnly: false })}
                  >
                    Saved favorites ×
                  </button>
                )}
                {loading
                  ? "Loading your next favorite…"
                  : `${filtered.length} ${filtered.length === 1 ? "find" : "finds"}`}
              </span>
              <label className="stock-toggle">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) =>
                    updateFilters({ onlyAvailable: e.target.checked })
                  }
                />
                In stock only
              </label>
              <label className="select-wrap">
                <SlidersHorizontal size={14} />
                <span className="sr-only">Filter brand</span>
                <select
                  value={brand}
                  onChange={(e) => updateFilters({ brand: e.target.value })}
                >
                  <option value="all">All brands</option>
                  {brands.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </label>
              <label className="select-wrap">
                <span className="sr-only">Sort products</span>
                <select
                  value={sort}
                  onChange={(e) =>
                    updateFilters({
                      sort: e.target.value as ShopFilters["sort"],
                    })
                  }
                >
                  <option value="fresh">Freshest finds</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </label>
            </div>
            {renderCatalog()}
          </section>
        )}

        {mode === "product" && (
          <section className="product-page section-shell">
            <a href="/shop" className="back-link">
              <ArrowLeft size={16} /> Back to the good stuff
            </a>
            {loading && !selected ? (
              <div className="product-loading">Finding your camera…</div>
            ) : error && !selected ? (
              <div className="catalog-message" role="alert">
                <h1>The picture is taking a moment.</h1>
                <p>{error}</p>
                <button className="button button-dark" onClick={retryCatalog}>
                  Try again
                </button>
              </div>
            ) : !selected ? (
              <div className="catalog-message">
                <h1>This find may have found a home.</h1>
                <p>
                  Explore the current collection, or check the original listing.
                </p>
                <a className="button button-dark" href="/shop">
                  Shop the collection <ArrowRight size={18} />
                </a>
                <a href="/contact">
                  Ask the workshop <ArrowUpRight size={15} />
                </a>
              </div>
            ) : (
              <>
                <div className="product-detail">
                  <div className="detail-gallery">
                    <div className="detail-main-image">
                      <ProductImage product={selected} index={galleryIndex} />
                      <span className="tag tag-lime">
                        {isAvailable(selected)
                          ? "Your next chapter starts here"
                          : "This one found a home"}
                      </span>
                    </div>
                    {selected.images.length > 1 && (
                      <div className="gallery-thumbnails">
                        {selected.images.map((_, i) => (
                          <button
                            key={i}
                            aria-label={`View photo ${i + 1}`}
                            aria-pressed={galleryIndex === i}
                            className={galleryIndex === i ? "active" : ""}
                            onClick={() => setGalleryIndex(i)}
                          >
                            <ProductImage product={selected} index={i} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="detail-copy">
                    <p className="eyebrow">
                      {selected.brand || "MEASURE JOY FINDS"}{" "}
                      {selected.year && ` / ${selected.year}`}
                    </p>
                    <h1>{selected.name}</h1>
                    <div className="detail-price">
                      {formatPrice(selected.priceInCents)}
                      <span>
                        {isAvailable(selected)
                          ? selected.stockCount === 1
                            ? "Only one like this."
                            : "Ready for a new story."
                          : "Currently unavailable"}
                      </span>
                    </div>
                    <p className="detail-description">
                      {selected.description ||
                        "A new chapter for a classic find. Ask the workshop for more details about this camera."}
                    </p>
                    {selected.longDescription &&
                      selected.longDescription !== selected.description && (
                        <p className="detail-description">
                          {selected.longDescription}
                        </p>
                      )}
                    {!!selected.features?.length && (
                      <ul className="detail-features">
                        {selected.features.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    )}
                    <div className="detail-condition">
                      <span>THE DETAILS</span>
                      <span>
                        Condition: <strong>{selected.condition}</strong>
                      </span>
                      {Object.entries(selected.specs || {})
                        .filter(([, v]) => !!v)
                        .map(([k, v]) => (
                          <span key={k}>
                            {k.replace(/([A-Z])/g, " $1")}: <strong>{v}</strong>
                          </span>
                        ))}
                    </div>
                    {isAvailable(selected) && selected.stockCount !== 1 && (
                      <div className="quantity-control">
                        <span>Quantity</span>
                        <button
                          aria-label="Decrease quantity"
                          disabled={quantity <= 1}
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        >
                          <Minus size={14} />
                        </button>
                        <output>{quantity}</output>
                        <button
                          aria-label="Increase quantity"
                          disabled={
                            quantity >= Math.min(selected.stockCount ?? 10, 10)
                          }
                          onClick={() =>
                            setQuantity((q) =>
                              Math.min(selected.stockCount ?? 10, 10, q + 1),
                            )
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                    <div className="buy-actions">
                      {isAvailable(selected) ? (
                        <button
                          type="button"
                          className="button button-dark"
                          onClick={() => {
                            cart.addItem(selected, quantity);
                            setToast("Added to your bag. A good find.");
                          }}
                        >
                          Add to bag <Plus size={20} />
                        </button>
                      ) : (
                        <button className="button button-dark" disabled>
                          Found a home <Check size={18} />
                        </button>
                      )}
                      <button
                        className={`button button-outline ${saved.includes(selected.id) ? "saved-detail" : ""}`}
                        aria-pressed={saved.includes(selected.id)}
                        onClick={() => toggleSave(selected.id)}
                      >
                        <Heart
                          size={18}
                          fill={
                            saved.includes(selected.id)
                              ? "currentColor"
                              : "none"
                          }
                        />
                        {saved.includes(selected.id)
                          ? "Saved"
                          : "Save for later"}
                      </button>
                    </div>
                    <p className="checkout-note">
                      {isAvailable(selected)
                        ? "Your next memory starts here. Current price and availability are confirmed at secure checkout."
                        : "Every good camera deserves another adventure. Explore our other finds."}
                    </p>
                    {isAvailable(selected) && (
                      <a
                        className="text-link buy-now-link"
                        href={checkoutUrl(selected.id, quantity)}
                      >
                        Buy this find now <ArrowUpRight size={16} />
                      </a>
                    )}
                    <div className="detail-help">
                      <a href="/shipping">
                        Shipping <ArrowUpRight size={13} />
                      </a>
                      <a href="/returns">
                        Returns & warranty <ArrowUpRight size={13} />
                      </a>
                      <a href="/contact">
                        Ask us anything <ArrowUpRight size={13} />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="product-review-wrap">
                  <ProductReviews productId={selected.id} />
                </div>
                <div className="related-section">
                  <div className="section-heading">
                    <h2>
                      A few more <em>good finds.</em>
                    </h2>
                    <a href="/shop" className="text-link">
                      Explore all <ArrowUpRight size={18} />
                    </a>
                  </div>
                  <div className="product-grid">
                    {products
                      .filter(
                        (p) =>
                          p.id !== selected.id &&
                          classifyProduct(p) === classifyProduct(selected) &&
                          isAvailable(p),
                      )
                      .slice(0, 4)
                      .map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          saved={saved.includes(p.id)}
                          toggle={toggleSave}
                        />
                      ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {mode === "home" && <Newsletter cms={newsletter} />}
      <SiteFooter />

      <dialog
        ref={dialog}
        className={`store-dialog ${modal === "saved" || modal === "menu" ? "drawer-dialog" : ""}`}
        onCancel={(e) => {
          e.preventDefault();
          closeModal();
        }}
        onClick={(e) => {
          if (e.target === dialog.current) closeModal();
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-inner">
          <button
            className="dialog-close"
            onClick={closeModal}
            aria-label="Close dialog"
          >
            <X size={22} />
          </button>
          {modal === "search" && (
            <>
              <p className="eyebrow">FIND YOUR NEXT FAVORITE</p>
              <h2 id="dialog-title">
                What’s your <em>type?</em>
              </h2>
              <form action="/shop" className="search-form">
                <Search size={22} />
                <input
                  name="search"
                  aria-label="Search cameras"
                  placeholder="Canon, silver, pocket-sized…"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  autoFocus
                />
                <button aria-label="Search" type="submit">
                  <ArrowRight size={22} />
                </button>
              </form>
              <p className="search-hint">
                A brand. A color. A camera you’ve been dreaming of.
              </p>
            </>
          )}
          {modal === "saved" && (
            <>
              <p className="eyebrow">YOUR LITTLE COLLECTION</p>
              <h2 id="dialog-title">
                Good things,
                <br />
                <em>saved.</em>
              </h2>
              <p className="saved-subtitle">
                Your favorites, all in one frame.
              </p>
              {savedFinds.error ? (
                <div className="saved-empty" role="alert">
                  <p>{savedFinds.error}</p>
                  <button
                    className="button button-dark"
                    onClick={() => void savedFinds.refresh()}
                  >
                    Try again
                  </button>
                </div>
              ) : !savedFinds.ready ? (
                <p className="saved-subtitle" role="status">
                  Waiting for your account connection. If this takes a moment,
                  try reloading the page.
                </p>
              ) : loading ? (
                <p className="saved-subtitle" role="status">
                  Loading your saved finds…
                </p>
              ) : error ? (
                <div className="saved-empty">
                  <p>
                    Your favorites are saved. The collection is taking a moment
                    to load.
                  </p>
                  <button className="button button-dark" onClick={retryCatalog}>
                    Try again <RefreshCw size={16} />
                  </button>
                </div>
              ) : saved.length === 0 ? (
                <div className="saved-empty">
                  <Heart size={36} strokeWidth={1} />
                  <p>A good find is worth keeping close.</p>
                  <button
                    className="button button-dark"
                    onClick={() => {
                      closeModal();
                      window.location.assign("/shop");
                    }}
                  >
                    Find your favorite <ArrowUpRight size={18} />
                  </button>
                </div>
              ) : (
                <div className="saved-list">
                  {savedProducts.map((p) => (
                    <div className="saved-item" key={p.id}>
                      <a href={productPath(p)}>
                        <ProductImage product={p} />
                      </a>
                      <div>
                        <a href={productPath(p)}>{p.name}</a>
                        <span>{formatPrice(p.priceInCents)}</span>
                        <a className="saved-explore" href={productPath(p)}>
                          Take a closer look <ArrowUpRight size={13} />
                        </a>
                      </div>
                      <button
                        aria-label={`Remove ${p.name} from saved cameras`}
                        onClick={() => toggleSave(p.id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {unavailableSaved.map((id) => (
                    <div className="saved-item" key={id}>
                      <div>
                        <span>
                          This saved find is no longer in the current
                          collection.
                        </span>
                        <a
                          className="saved-explore"
                          href={`${LIVE}/product/${encodeURIComponent(id)}`}
                        >
                          View original listing <ArrowUpRight size={13} />
                        </a>
                      </div>
                      <button
                        aria-label={`Remove unavailable saved item ${id}`}
                        onClick={() => toggleSave(id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {modal === "menu" && (
            <>
              <p className="eyebrow" id="dialog-title">
                MEASURE JOY
              </p>
              <nav className="mobile-nav">
                <a href="/shop">
                  The collection <ArrowUpRight />
                </a>
                <Link href="/#story" onClick={closeModal}>
                  Our story <ArrowUpRight />
                </Link>
                <a href={`${LIVE}/journal`}>
                  Field notes <ArrowUpRight />
                </a>
                <a href="/brand">
                  Brand studio <ArrowUpRight />
                </a>
              </nav>
              <p>Good cameras. Great stories.</p>
            </>
          )}
        </div>
      </dialog>
      <div
        className={`toast ${toast ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <>
            <Check size={16} />
            {toast}
          </>
        )}
      </div>
    </div>
  );
}
