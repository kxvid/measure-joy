import "server-only";

import { getStripeProducts } from "@/lib/stripe-products";
import { logServerError } from "@/lib/security-logging";
import type { Product } from "@/lib/products";

export type StorefrontCatalogState = {
  initialProducts?: Product[];
  initialError?: string;
};

/** Render the real shared catalog in HTML; an upstream failure is not an empty shop. */
export async function loadStorefrontCatalog(): Promise<StorefrontCatalogState> {
  try {
    return { initialProducts: await getStripeProducts() };
  } catch (error) {
    logServerError("[Storefront] Initial catalog read failed", error);
    return {
      initialError:
        "The collection is temporarily unavailable. Please try again shortly.",
    };
  }
}
