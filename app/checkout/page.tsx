"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Loader2, LockKeyhole } from "lucide-react";
import { CommerceShell } from "@/components/storefront/commerce-shell";
import Checkout from "@/components/checkout";
import { useCart } from "@/lib/cart-context";
import {
  formatPrice,
  parseCatalog,
  productPath,
  safeImageUrl,
  type Product,
} from "@/lib/storefront-catalog";

function CheckoutContent() {
  const params = useSearchParams();
  const productId = params.get("product");
  const quantity = Number(params.get("qty") || "1");
  const { items, isHydrated } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!!productId);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setProduct(null);
    if (
      !/^prod_[A-Za-z0-9]+$/.test(productId) ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      setError(
        "This checkout link has an invalid product or quantity. Please choose your find again.",
      );
      setLoading(false);
      return;
    }
    fetch(`/api/products?id=${encodeURIComponent(productId)}&fresh=true`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            response.status === 404
              ? "We couldn’t find this camera. Explore the collection for another good find."
              : "We couldn’t check this find right now. Please try again shortly.",
          );
        const current = parseCatalog([await response.json()])[0];
        if (!current.inStock || current.stockCount === 0)
          throw new Error(
            "This find has already found a home. Explore the collection for something new.",
          );
        if (current.stockCount !== undefined && quantity > current.stockCount)
          throw new Error(
            `Only ${current.stockCount} of this find available. Please update your quantity.`,
          );
        return current;
      })
      .then(setProduct)
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "We couldn’t load this find.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [productId, quantity]);
  const summary = productId
    ? product?.id === productId
      ? [{ product, quantity }]
      : []
    : items;
  const subtotal = summary.reduce(
    (sum, item) => sum + item.product.priceInCents * item.quantity,
    0,
  );
  return (
    <CommerceShell>
      <div className="commerce-shell">
        <Link
          className="commerce-back"
          href={productId ? `/product/${productId}` : "/cart"}
        >
          <ArrowLeft size={14} />{" "}
          {productId ? "Back to your find" : "Back to your bag"}
        </Link>
        {!isHydrated || loading ? (
          <div className="commerce-loading" role="status">
            <Loader2 size={24} className="commerce-spinner" /> Getting
            everything ready…
          </div>
        ) : error ? (
          <div className="commerce-empty">
            <p className="eyebrow">A LITTLE PAUSE</p>
            <h1>
              Let’s find
              <br />
              your <em>next step.</em>
            </h1>
            <p role="alert">{error}</p>
            <Link
              className="commerce-button"
              href={productId ? `/product/${productId}` : "/cart"}
            >
              Review your find <ArrowUpRight size={18} />
            </Link>
            <Link className="commerce-button secondary" href="/shop">
              Explore the collection
            </Link>
          </div>
        ) : summary.length === 0 ? (
          <div className="commerce-empty">
            <div className="commerce-mark">
              <img src="/brand/logos/measure-joy-icon-ink.svg" alt="" />
            </div>
            <h1>
              A little room
              <br />
              for <em>joy.</em>
            </h1>
            <p>Your bag is empty. Pick a camera and start a new story.</p>
            <Link href="/shop" className="commerce-button">
              Explore the collection <ArrowUpRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            <div className="commerce-heading">
              <div>
                <p className="eyebrow">02 / THE NEXT CHAPTER</p>
                <h1>
                  Almost <em>yours.</em>
                </h1>
              </div>
              <p>
                Good memories start
                <br />
                with one small step.
              </p>
            </div>
            <div className="commerce-grid">
              <Checkout productId={product?.id} quantity={quantity} />
              <aside className="order-summary">
                <p className="eyebrow">YOUR GOOD FINDS</p>
                <h2>Coming along for the ride.</h2>
                {summary.map((item) => {
                  const image = safeImageUrl(item.product.images[0]);
                  return (
                    <div className="summary-item" key={item.product.id}>
                      {image && <img src={image} alt={item.product.name} />}
                      <div>
                        <Link href={productPath(item.product)}>
                          {item.product.name}
                        </Link>
                        <p>Quantity {item.quantity}</p>
                      </div>
                      <span>
                        {formatPrice(item.product.priceInCents * item.quantity)}
                      </span>
                    </div>
                  );
                })}
                <div className="summary-total">
                  <span>Item subtotal</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
                <p className="summary-note">
                  Prices and availability are checked again before checkout.
                  Stripe confirms your final total, shipping, taxes, and
                  discounts before payment.
                </p>
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
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <CommerceShell>
          <div className="commerce-loading" role="status">
            <Loader2 className="commerce-spinner" size={24} /> Opening checkout…
          </div>
        </CommerceShell>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
