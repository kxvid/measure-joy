import "server-only";
import Stripe from "stripe";
import type { Product } from "./products";
import { extractProductInfo } from "./product-fallback";
import { stockCountFromMetadata, usablePrice } from "./commerce";

// Keep server modules importable during builds; fail clearly when a catalog read
// is attempted without the required integration rather than serving fake products.
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("The product catalog is not configured.");
  _stripe = new Stripe(key);
  return _stripe;
}

/**
 * Transform Stripe product/price into our Product format
 */
function transformStripeProduct(
  product: Stripe.Product,
  price: Stripe.Price | null,
): Product {
  const metadata = product.metadata || {};
  const stockCount = stockCountFromMetadata(metadata);

  // Fallback if metadata is missing
  const fallback = extractProductInfo(product.name, product.description || "");

  return {
    id: product.id,
    name: product.name,
    brand:
      metadata.brand && metadata.brand !== "Unknown"
        ? metadata.brand
        : fallback.brand,
    description: product.description || "",
    longDescription: metadata.longDescription || product.description || "",
    priceInCents: price?.unit_amount || 0,
    originalPriceInCents: metadata.originalPrice
      ? parseInt(metadata.originalPrice, 10)
      : undefined,
    images: product.images || [],
    badge: metadata.badge || undefined,
    year:
      metadata.year && metadata.year !== "Unknown"
        ? metadata.year
        : fallback.year,
    category:
      (metadata.category as "camera" | "accessory") || fallback.category,
    subcategory: metadata.subcategory || undefined,
    condition: metadata.condition || "Good",
    specs: {
      megapixels: metadata.megapixels,
      zoom: metadata.zoom,
      display: metadata.display,
      storage: metadata.storage,
      capacity: metadata.capacity,
      compatibility: metadata.compatibility,
      material: metadata.material,
      size: metadata.size,
    },
    features: (() => {
      try {
        return metadata.features ? JSON.parse(metadata.features) : undefined;
      } catch {
        return undefined;
      }
    })(),
    sellingPoints: (() => {
      try {
        return metadata.sellingPoints
          ? JSON.parse(metadata.sellingPoints)
          : undefined;
      } catch {
        return undefined;
      }
    })(),
    inStock:
      product.active &&
      metadata.inStock !== "false" &&
      stockCount !== 0 &&
      usablePrice(price),
    stockCount,
    reviewCount: metadata.reviewCount
      ? parseInt(metadata.reviewCount, 10)
      : undefined,
    rating: metadata.rating ? parseFloat(metadata.rating) : undefined,
    isTrending: metadata.isTrending === "true",
    isBestseller: metadata.isBestseller === "true",
    createdAt: product.created * 1000, // Stripe uses seconds, JS uses ms
  };
}

/** Read every page so catalog and sitemap do not silently stop at 100 items. */
async function listStripeProducts(active?: boolean): Promise<Stripe.Product[]> {
  const stripe = getStripe();
  const products: Stripe.Product[] = [];
  let startingAfter: string | undefined;
  do {
    const page = await stripe.products.list({
      ...(active === undefined ? {} : { active }),
      limit: 100,
      expand: ["data.default_price"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    products.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);
  return products;
}

export async function getStripeProducts(options?: {
  category?: "camera" | "accessory";
  limit?: number;
  featured?: boolean;
}): Promise<Product[]> {
  const products = (await listStripeProducts(true))
    .filter((product) => usablePrice(product.default_price))
    .map((product) =>
      transformStripeProduct(product, product.default_price as Stripe.Price),
    )
    .filter(
      (product) =>
        (!options?.category || product.category === options.category) &&
        (!options?.featured || product.isTrending || product.isBestseller),
    );
  return options?.limit ? products.slice(0, options.limit) : products;
}

/** Archived products remain available as sold-out pages for existing links. */
export async function getStripeProductById(
  productId: string,
): Promise<Product | null> {
  try {
    const product = await getStripe().products.retrieve(productId, {
      expand: ["default_price"],
    });
    const price =
      product.default_price && typeof product.default_price === "object"
        ? product.default_price
        : null;
    return transformStripeProduct(product, price);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "resource_missing"
    )
      return null;
    throw error;
  }
}

export async function getAllStripeProducts(): Promise<Product[]> {
  return (await listStripeProducts()).map((product) =>
    transformStripeProduct(
      product,
      product.default_price && typeof product.default_price === "object"
        ? product.default_price
        : null,
    ),
  );
}

export async function getProductInventory(
  productId: string,
): Promise<number | null> {
  const product = await getStripe().products.retrieve(productId);
  return stockCountFromMetadata(product.metadata) ?? null;
}

/** Search the current native catalog without interpolation into Stripe query syntax. */
export async function searchStripeProducts(query: string): Promise<Product[]> {
  const normalized = query.trim().toLowerCase();
  return (await getStripeProducts()).filter(
    (product) =>
      product.name.toLowerCase().includes(normalized) ||
      product.description.toLowerCase().includes(normalized),
  );
}
