import { NextResponse } from "next/server";
import {
  getStripeProducts,
  getStripeProductById,
  searchStripeProducts,
} from "@/lib/stripe-products";

// Cache products for 60 seconds in production
const CACHE_DURATION = process.env.NODE_ENV === "production" ? 60 : 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const cacheControl =
    searchParams.get("fresh") === "true"
      ? "no-store"
      : `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`;
  const category = searchParams.get("category") as
    | "camera"
    | "accessory"
    | null;
  const featured = searchParams.get("featured") === "true";
  const productId = searchParams.get("id");
  const search = searchParams.get("search");

  try {
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
      category: category || undefined,
      featured: featured,
    });

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    console.error("[Products API] Error:", error);

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
