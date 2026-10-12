"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  EditorialPage,
  EditorialHeading,
  EditorialBackLink,
} from "@/components/editorial-page";
import { useSavedFinds } from "@/components/storefront/use-saved-finds";
import {
  formatPrice,
  isAvailable,
  productPath,
  type Product,
} from "@/lib/storefront-catalog";
import { useCart } from "@/lib/cart-context";
import { ArrowUpRight, Heart, Loader2, Trash2 } from "lucide-react";

export default function WishlistPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { addItem } = useCart();
  const { savedIds, loading, ready, error, toggle, pendingIds, refresh } =
    useSavedFinds();
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (isLoaded && !userId)
      router.replace("/sign-in?redirect_url=/account/wishlist");
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    const abort = new AbortController();
    setCatalogLoading(true);
    setCatalogError("");
    fetch("/api/products", { cache: "no-store", signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return (await response.json()) as Product[];
      })
      .then(setProducts)
      .catch((failure) => {
        if (failure.name !== "AbortError")
          setCatalogError("We couldn't load the cameras in your saved list.");
      })
      .finally(() => {
        if (!abort.signal.aborted) setCatalogLoading(false);
      });
    return () => abort.abort();
  }, [isLoaded, userId, retry]);

  async function remove(id: string) {
    const result = await toggle(id);
    setNotice(
      result.success
        ? "Removed from your saved finds."
        : result.error || "This find could not be removed.",
    );
  }
  function add(product: Product) {
    if (!isAvailable(product)) return;
    addItem(product);
    setNotice(`${product.name} added to your bag.`);
  }
  const busy = !isLoaded || !userId || loading || catalogLoading;
  const savedProducts = savedIds.map((id) => ({
    id,
    product: products.find((product) => product.id === id),
  }));

  return (
    <EditorialPage>
      <EditorialHeading
        label="A little later"
        title="Your saved finds."
        description="The cameras that caught your eye, saved to your account. A saved find isn't reserved until checkout."
      >
        <EditorialBackLink href="/account">Your account</EditorialBackLink>
      </EditorialHeading>
      <div className="ed-account-content">
        {(error || catalogError) && (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-border p-5 text-sm"
          >
            {error || catalogError}
            <button
              type="button"
              className="ml-3 underline"
              onClick={() => {
                void refresh();
                setRetry((value) => value + 1);
              }}
            >
              Try again
            </button>
          </div>
        )}
        {notice && (
          <p role="status" className="mt-6 text-sm">
            {notice}
          </p>
        )}
        {busy ? (
          <p role="status" className="mt-12 flex items-center gap-3 text-sm">
            <Loader2 size={18} className="animate-spin" />
            Loading your saved finds…
          </p>
        ) : ready && !catalogError && savedProducts.length ? (
          <div className="ed-wishlist-grid mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedProducts.map(({ id, product }) => (
              <article
                key={id}
                className="ed-wishlist-item overflow-hidden rounded-xl border border-border bg-card"
              >
                {product ? (
                  <>
                    <Link
                      href={productPath(product)}
                      className="block aspect-square bg-secondary/60 p-6"
                    >
                      <Image
                        src={product.images[0] || "/placeholder.svg"}
                        alt={product.name}
                        width={400}
                        height={400}
                        unoptimized
                        className="h-full w-full object-contain mix-blend-multiply"
                      />
                    </Link>
                    <div className="p-5">
                      <p className="text-xs text-muted-foreground">
                        {product.brand}
                      </p>
                      <Link
                        href={productPath(product)}
                        className="mt-2 block text-lg font-semibold"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-3 text-sm">
                        {formatPrice(product.priceInCents)}{" "}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {isAvailable(product) ? "Available" : "Found a home"}
                        </span>
                      </p>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <button
                          className="button button-dark"
                          type="button"
                          onClick={() => add(product)}
                          disabled={!isAvailable(product)}
                        >
                          Add to bag <ArrowUpRight size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(id)}
                          disabled={pendingIds.length > 0}
                          aria-label={`Remove ${product.name} from saved finds`}
                          className="p-3"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6">
                    <Heart size={28} className="mb-5" />
                    <h2 className="text-lg font-semibold">
                      A find from an earlier chapter.
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      This saved item is no longer in the current collection.
                    </p>
                    <button
                      className="button button-outline mt-6"
                      type="button"
                      disabled={pendingIds.length > 0}
                      onClick={() => void remove(id)}
                    >
                      Remove from saved
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          ready &&
          !catalogError && (
            <div className="mt-12 rounded-2xl border border-border p-10 text-center">
              <Heart className="mx-auto mb-5 h-9 w-9" />
              <h2 className="text-2xl font-semibold">
                Make room for a favorite.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Tap a heart in the shop to save a camera here.
              </p>
              <Link className="button button-dark mt-7" href="/shop">
                Explore the collection <ArrowUpRight size={17} />
              </Link>
            </div>
          )
        )}
      </div>
    </EditorialPage>
  );
}
