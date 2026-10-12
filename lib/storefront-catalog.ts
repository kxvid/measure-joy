import type { Product } from "./products";
export type { Product } from "./products";
export { productPath, resolveProductParam } from "./seo";

export interface CatalogResponse {
  products: Product[];
  source: "stripe";
  fetchedAt: string;
}

const STRIPE_PRODUCT_ID = /^prod_[a-zA-Z0-9]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/** Only safe image sources are displayable; this does not provide placeholder images. */
export function safeImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f\\]/.test(value))
    return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/** Fail closed rather than inventing product, price, or inventory values. */
export function parseCatalog(value: unknown): Product[] {
  if (!Array.isArray(value)) throw new Error("Invalid catalog response");
  const ids = new Set<string>();
  for (const product of value) {
    if (
      !isRecord(product) ||
      typeof product.id !== "string" ||
      !STRIPE_PRODUCT_ID.test(product.id) ||
      ids.has(product.id) ||
      typeof product.name !== "string" ||
      !product.name.trim() ||
      typeof product.description !== "string" ||
      !isNonnegativeInteger(product.priceInCents) ||
      !Array.isArray(product.images) ||
      !product.images.every((image) => safeImageUrl(image) !== null) ||
      (product.category !== "camera" && product.category !== "accessory") ||
      typeof product.condition !== "string" ||
      typeof product.inStock !== "boolean" ||
      !isRecord(product.specs) ||
      !Object.values(product.specs).every((spec) => typeof spec === "string")
    ) {
      throw new Error("Invalid catalog product");
    }

    for (const field of [
      "brand",
      "longDescription",
      "badge",
      "year",
      "subcategory",
    ]) {
      if (product[field] !== undefined && typeof product[field] !== "string")
        throw new Error("Invalid catalog text");
    }
    for (const field of [
      "originalPriceInCents",
      "stockCount",
      "reviewCount",
      "createdAt",
    ]) {
      if (product[field] !== undefined && !isNonnegativeInteger(product[field]))
        throw new Error("Invalid catalog number");
    }
    for (const field of ["features", "sellingPoints"]) {
      const entries = product[field];
      if (
        entries !== undefined &&
        (!Array.isArray(entries) ||
          !entries.every((entry) => typeof entry === "string"))
      ) {
        throw new Error("Invalid catalog list");
      }
    }
    for (const field of ["isTrending", "isBestseller"]) {
      if (product[field] !== undefined && typeof product[field] !== "boolean")
        throw new Error("Invalid catalog flag");
    }
    if (
      product.rating !== undefined &&
      (typeof product.rating !== "number" ||
        !Number.isFinite(product.rating) ||
        product.rating < 0)
    ) {
      throw new Error("Invalid catalog rating");
    }
    ids.add(product.id);
  }
  return value as Product[];
}

/** Explicit zero stock takes precedence over the upstream active/inStock flag. */
export function isAvailable(
  product: Pick<Product, "inStock" | "stockCount">,
): boolean {
  return (
    product.inStock &&
    (product.stockCount === undefined || product.stockCount > 0)
  );
}

export function formatPrice(cents: number): string {
  if (!isNonnegativeInteger(cents))
    throw new Error("Price must be a nonnegative integer in cents");
  return `$${(cents / 100).toFixed(2)}`;
}

/** The original storefront owns payment, inventory revalidation, and order creation. */
export function checkoutUrl(productId: string, quantity = 1): string {
  if (!STRIPE_PRODUCT_ID.test(productId))
    throw new Error("Invalid Stripe product ID");
  if (!Number.isSafeInteger(quantity) || quantity < 1)
    throw new Error("Quantity must be a positive integer");
  const url = new URL("https://measurejoy.org/checkout");
  url.searchParams.set("product", productId);
  url.searchParams.set("qty", String(quantity));
  return url.pathname + url.search;
}
