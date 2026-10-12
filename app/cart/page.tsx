"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Camera,
  Loader2,
  LockKeyhole,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { CommerceShell } from "@/components/storefront/commerce-shell";
import { useCart } from "@/lib/cart-context";
import { cartIssues } from "@/lib/cart-state";
import {
  formatPrice,
  productPath,
  safeImageUrl,
} from "@/lib/storefront-catalog";

export default function CartPage() {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
    isHydrated,
    isRefreshing,
    refreshCart,
  } = useCart();
  const [error, setError] = useState("");
  const [pricesChanged, setPricesChanged] = useState(false);
  const [checked, setChecked] = useState(false);
  const requested = useRef(false);
  const router = useRouter();
  const verifyBag = useCallback(async () => {
    setError("");
    try {
      const result = await refreshCart();
      setPricesChanged(result.changedPrices);
      setChecked(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn’t refresh your bag. Please try again.",
      );
    }
  }, [refreshCart]);
  useEffect(() => {
    if (isHydrated && items.length > 0 && !requested.current) {
      requested.current = true;
      void verifyBag();
    }
  }, [isHydrated, items.length, verifyBag]);
  const issues = cartIssues(items);

  return (
    <CommerceShell>
      <div className="commerce-shell">
        <Link className="commerce-back" href="/shop">
          <ArrowLeft size={14} /> Back to the good finds
        </Link>
        {!isHydrated ? (
          <div className="commerce-loading" role="status">
            <Loader2 className="commerce-spinner" size={24} /> Opening your bag…
          </div>
        ) : items.length === 0 ? (
          <div className="commerce-empty">
            <div className="commerce-mark">
              <img src="/brand/logos/measure-joy-icon-ink.svg" alt="" />
            </div>
            <p className="eyebrow">A LITTLE ROOM FOR JOY</p>
            <h1>
              Your next story
              <br />
              starts <em>here.</em>
            </h1>
            <p>
              Your bag is waiting for a camera with a past and a little room for
              your future.
            </p>
            <Link className="commerce-button" href="/shop">
              Find your camera <ArrowUpRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            <div className="commerce-heading">
              <div>
                <p className="eyebrow">
                  01 / YOUR FINDS · {totalItems}{" "}
                  {totalItems === 1 ? "ITEM" : "ITEMS"}
                </p>
                <h1>
                  A bag full
                  <br />
                  of <em>possibility.</em>
                </h1>
              </div>
              <p>
                A few good finds.
                <br />A whole lot of memories ahead.
              </p>
            </div>
            {error && (
              <div className="commerce-alert" role="alert">
                <p>{error}</p>
                <button onClick={verifyBag} disabled={isRefreshing}>
                  Try checking again
                </button>
              </div>
            )}
            {pricesChanged && (
              <p className="commerce-notice" role="status">
                A price has changed since your last visit. Your bag now shows
                the latest catalog prices.
              </p>
            )}
            <div className="commerce-grid">
              <div>
                <div aria-label="Items in your bag">
                  {items.map(({ product, quantity }) => {
                    const unavailable =
                      !product.inStock || product.stockCount === 0;
                    const overStock =
                      product.stockCount !== undefined &&
                      quantity > product.stockCount;
                    const image = safeImageUrl(product.images[0]);
                    return (
                      <article className="bag-row" key={product.id}>
                        <Link
                          href={productPath(product)}
                          className="bag-image"
                          aria-label={`View ${product.name}`}
                        >
                          {image ? (
                            <img src={image} alt={product.name} />
                          ) : (
                            <Camera size={35} strokeWidth={1} />
                          )}
                        </Link>
                        <div>
                          <p className="bag-brand">
                            {product.brand || "Measure Joy collection"}
                          </p>
                          <Link
                            className="bag-name"
                            href={productPath(product)}
                          >
                            {product.name}
                          </Link>
                          <p className="bag-condition">
                            {product.condition}
                            {product.year ? ` · ${product.year}` : ""}
                          </p>
                          <p className="bag-unit">
                            {formatPrice(product.priceInCents)} each
                          </p>
                          <div className="bag-controls">
                            <div className="bag-quantity">
                              <button
                                aria-label={`Decrease quantity of ${product.name}`}
                                onClick={() =>
                                  updateQuantity(product.id, quantity - 1)
                                }
                                disabled={isRefreshing}
                              >
                                <Minus size={13} />
                              </button>
                              <span aria-live="polite">{quantity}</span>
                              <button
                                aria-label={`Increase quantity of ${product.name}`}
                                onClick={() =>
                                  updateQuantity(product.id, quantity + 1)
                                }
                                disabled={
                                  isRefreshing ||
                                  unavailable ||
                                  (product.stockCount !== undefined &&
                                    quantity >= product.stockCount)
                                }
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                            <button
                              className="bag-remove"
                              onClick={() => removeItem(product.id)}
                              disabled={isRefreshing}
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                          {unavailable ? (
                            <p className="bag-unavailable">
                              This find is no longer available. Remove it to
                              continue.
                            </p>
                          ) : overStock ? (
                            <p className="bag-unavailable">
                              Only {product.stockCount} available. Adjust your
                              quantity to continue.
                            </p>
                          ) : product.stockCount === 1 ? (
                            <p className="bag-condition">
                              One of a kind. Not reserved until purchased.
                            </p>
                          ) : null}
                        </div>
                        <span className="bag-row-total">
                          {formatPrice(product.priceInCents * quantity)}
                        </span>
                      </article>
                    );
                  })}
                </div>
                <p className="bag-help">
                  <Camera size={22} strokeWidth={1.2} />
                  <span>
                    A little advice before your next adventure?
                    <br />
                    <Link href="/contact">Ask the workshop.</Link>
                  </span>
                </p>
              </div>
              <aside className="order-summary" aria-label="Order summary">
                <p className="eyebrow">GOOD THINGS, ALL TOGETHER</p>
                <h2>Your little collection.</h2>
                <div className="summary-total">
                  <span>Item subtotal</span>
                  <strong>{formatPrice(totalPrice)}</strong>
                </div>
                <p className="summary-note">
                  Shipping, taxes, and any discounts are confirmed in secure
                  checkout before you pay.
                </p>
                {isRefreshing ? (
                  <p className="checkout-progress" role="status">
                    <Loader2 size={15} className="commerce-spinner" /> Checking
                    the latest prices & availability…
                  </p>
                ) : checked && !error ? (
                  <p className="summary-note">
                    Prices refreshed for this visit. Availability is checked
                    again at checkout.
                  </p>
                ) : null}
                {issues.length > 0 && (
                  <p className="bag-unavailable" role="alert">
                    Update the unavailable items or quantities in your bag to
                    continue.
                  </p>
                )}
                <button
                  className="commerce-button"
                  disabled={
                    !checked || isRefreshing || !!error || issues.length > 0
                  }
                  onClick={() => router.push("/checkout")}
                >
                  Continue to checkout <ArrowUpRight size={18} />
                </button>
                <p className="commerce-secure">
                  <LockKeyhole size={12} /> Secure payment with Stripe
                </p>
              </aside>
            </div>
          </>
        )}
      </div>
    </CommerceShell>
  );
}
