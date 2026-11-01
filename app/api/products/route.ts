import { consumeRateLimit } from "@/lib/rate-limit";
import { logServerError } from "@/lib/security-logging";
import { NextResponse } from "next/server";
import {
  getStripeProducts,
  getStripeProductById,
  searchStripeProducts,
} from "@/lib/stripe-products";

const CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=60";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const featured = searchParams.get("featured") === "true";
  const productId = searchParams.get("id");
  const search = searchParams.get("search");
  if (
    (productId !== null && !/^prod_[A-Za-z0-9]{1,100}$/.test(productId)) ||
    (category !== null && !["camera", "accessory"].includes(category)) ||
    (search !== null && (search.length > 120 || /[\u0000-\u001f\u007f]/.test(search)))
  ) {
    return NextResponse.json({ error: "Invalid catalog request." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  // Only a bounded product lookup used by checkout is fresh. Public full-catalog
  // requests always share the server data cache, regardless of caller hints.
  const cacheControl = productId ? "no-store" : CACHE_CONTROL;
  try {
    const ip = process.env.VERCEL === "1"
      ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "unknown"
      : "local";
    const quota = await consumeRateLimit(`catalog:${ip}`, 120, 60);
    if (!quota.allowed) {
      return NextResponse.json({ error: "Please wait before refreshing the catalog." }, {
        status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(quota.retryAfter) },
      });
    }
    // Single product fetch
    if (productId) {
      const product = await getStripeProductById(productId);

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(product, {
        headers: {
          "Cache-Control": cacheControl,
        },
      });
    }

    // Search query
    if (search) {
      const products = await searchStripeProducts(search);
      return NextResponse.json(products, {
        headers: {
          "Cache-Control": cacheControl,
        },
      });
    }

    // List products from Stripe
    const products = await getStripeProducts({
      category: (category as "camera" | "accessory" | null) || undefined,
      featured: featured,
    });

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    logServerError("[Products API] Catalog read failed", error);

    // A failed integration is distinct from a genuinely empty catalog.
    return NextResponse.json(
      {
        error:
          "The catalog is temporarily unavailable. Please try again shortly.",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
