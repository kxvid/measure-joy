"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Check, Clock3, Loader2, RefreshCw } from "lucide-react";
import { getCheckoutSessionStatus } from "@/app/actions/stripe";
import { CommerceShell } from "@/components/storefront/commerce-shell";
import { useCart } from "@/lib/cart-context";

function CheckoutReturnContent() {
  const sessionId = useSearchParams().get("session_id");
  const { clearCart, isHydrated } = useCart();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const cleared = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!isHydrated) return;
    if (!sessionId) {
      setStatus("missing");
      setLoading(false);
      return;
    }
    setLoading(true);
    getCheckoutSessionStatus(sessionId)
      .then((result) => {
        if (cancelled) return;
        setStatus(result.status);
        if (result.status === "complete" && cleared.current !== sessionId) {
          cleared.current = sessionId;
          clearCart();
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, clearCart, isHydrated, attempt]);
  const complete = status === "complete";
  const pending = status === "pending";
  return (
    <CommerceShell>
      <div className="commerce-shell">
        <div className="commerce-empty return-state">
          {loading ? (
            <>
              <div className="commerce-mark">
                <Loader2 className="commerce-spinner" size={30} />
              </div>
              <p className="eyebrow">ONE LITTLE MOMENT</p>
              <h1>
                Checking the
                <br />
                <em>good news.</em>
              </h1>
              <p role="status">We’re checking your payment with Stripe.</p>
            </>
          ) : complete ? (
            <>
              <div className="commerce-mark">
                <Check size={36} strokeWidth={1.5} />
              </div>
              <p className="eyebrow">03 / YOUR NEXT CHAPTER</p>
              <h1>
                Good things
                <br />
                are <em>coming.</em>
              </h1>
              <p>
                Your payment is confirmed. Thanks for giving a camera a new
                story.
              </p>
              <div className="checkout-actions">
                <Link className="commerce-button" href="/account/orders">
                  View your orders <ArrowUpRight size={17} />
                </Link>
                <Link className="commerce-button secondary" href="/shop">
                  Keep exploring
                </Link>
              </div>
              <p className="return-note">
                Checked out as a guest? <Link href="/contact">Contact us</Link>{" "}
                with your order reference for a little help.
              </p>
            </>
          ) : pending ? (
            <>
              <div className="commerce-mark">
                <Clock3 size={32} strokeWidth={1.5} />
              </div>
              <p className="eyebrow">A LITTLE TIME TO DEVELOP</p>
              <h1>
                Your payment
                <br />
                is <em>processing.</em>
              </h1>
              <p>
                Stripe is still confirming your payment. Your bag is saved;
                there’s no need to pay again.
              </p>
              <div className="checkout-actions">
                <button
                  className="commerce-button"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  Check payment <RefreshCw size={16} />
                </button>
                <Link className="commerce-button secondary" href="/contact">
                  Ask for help
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="commerce-mark">
                <img src="/brand/logos/measure-joy-icon-ink.svg" alt="" />
              </div>
              <p className="eyebrow">LET’S GET YOU BACK ON TRACK</p>
              <h1>
                A small pause.
                <br />
                More <em>possibility.</em>
              </h1>
              <p role="alert">
                {status === "missing"
                  ? "There isn’t a checkout reference in this link. Your bag is still saved."
                  : status === "open"
                    ? "Your payment hasn’t been completed. You can return to your bag when you’re ready."
                    : status === "expired"
                      ? "This checkout session has expired. Your bag is saved so you can start again."
                      : "We couldn’t confirm your payment. If you were charged, please contact us before trying again."}
              </p>
              <div className="checkout-actions">
                <Link className="commerce-button" href="/cart">
                  Back to your bag <ArrowUpRight size={17} />
                </Link>
                <Link className="commerce-button secondary" href="/contact">
                  Ask for help
                </Link>
              </div>
              {sessionId && status === "error" && (
                <button
                  className="commerce-back"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  Check payment again <RefreshCw size={13} />
                </button>
              )}
            </>
          )}
          {sessionId && !loading && (
            <p className="return-reference">Order reference: {sessionId}</p>
          )}
        </div>
      </div>
    </CommerceShell>
  );
}
export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <CommerceShell>
          <div className="commerce-loading" role="status">
            <Loader2 className="commerce-spinner" size={24} /> Checking your
            order…
          </div>
        </CommerceShell>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  );
}
