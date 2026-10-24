"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Loader2 } from "lucide-react";
import {
  startCheckoutSession,
  startSingleProductCheckout,
} from "@/app/actions/stripe";
import { useCart } from "@/lib/cart-context";
import { checkoutRedirectUrl } from "@/lib/checkout-redirect";

export default function Checkout({
  productId,
  quantity = 1,
}: {
  productId?: string;
  quantity?: number;
}) {
  const { items, isHydrated, refreshCart } = useCart();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const started = useRef<string | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!isHydrated || (!productId && items.length === 0)) return;
    const key = `${productId || "bag"}:${quantity}:${attempt}`;
    if (started.current === key) return;
    started.current = key;
    void (async () => {
      try {
        let url: string | null;
        if (productId) {
          url = await startSingleProductCheckout(
            productId,
            undefined,
            quantity,
          );
        } else {
          const refreshed = await refreshCart();
          if (!refreshed.items.length)
            throw new Error(
              "Your bag is empty. Choose a find before checking out.",
            );
          if (refreshed.issues.length)
            throw new Error(refreshed.issues.join(" "));
          url = await startCheckoutSession(
            refreshed.items.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
            })),
            undefined,
          );
        }
        if (!url)
          throw new Error(
            "We couldn’t open secure checkout. Please try again.",
          );
        const destination = checkoutRedirectUrl(url, window.location.origin);
        if (!destination)
          throw new Error(
            "We couldn’t verify the secure checkout link. Please try again.",
          );
        if (mounted.current) window.location.assign(destination);
      } catch (cause) {
        if (mounted.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "We couldn’t open checkout. Please try again.",
          );
      }
    })();
  }, [productId, quantity, items.length, isHydrated, refreshCart, attempt]);

  return (
    <section className="checkout-panel" aria-live="polite">
      <div className="commerce-mark">
        <img src="/brand/logos/measure-joy-icon-ink.svg" alt="" />
      </div>
      <h2>
        {error
          ? "A little pause in the picture."
          : "One last step to your next chapter."}
      </h2>
      {error ? (
        <>
          <div className="commerce-alert" role="alert">
            <p>{error}</p>
          </div>
          <div className="checkout-actions">
            <Link
              className="commerce-button secondary"
              href={productId ? `/product/${productId}` : "/cart"}
            >
              <ArrowLeft size={15} />{" "}
              {productId ? "Back to the camera" : "Review your bag"}
            </Link>
            <button
              className="commerce-button"
              onClick={() => {
                setError("");
                setAttempt((value) => value + 1);
              }}
            >
              Try again <ArrowUpRight size={16} />
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            We’re checking your finds and opening Stripe’s secure checkout.
            You’ll review the final details before paying.
          </p>
          <div className="checkout-progress" role="status">
            <Loader2 className="commerce-spinner" size={18} />
            <span>
              {isHydrated
                ? "Opening secure checkout…"
                : "Getting your bag ready…"}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
