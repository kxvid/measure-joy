import type { Product } from "./products";
import { parseCatalog } from "./storefront-catalog";

export interface CartItem {
  product: Product;
  quantity: number;
}
export interface CartRefresh {
  items: CartItem[];
  changedPrices: boolean;
  issues: string[];
}

export function boundedQuantity(product: Product, quantity: number): number {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || !product.inStock)
    return 0;
  const stock = product.stockCount;
  if (stock !== undefined && (!Number.isSafeInteger(stock) || stock < 1))
    return 0;
  return Math.min(quantity, stock ?? 999, 999);
}

/** Keep valid legacy cart entries; corrupt browser storage must not break checkout. */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const items = new Map<string, CartItem>();
    for (const entry of parsed.slice(0, 100)) {
      if (
        !entry ||
        typeof entry !== "object" ||
        !Number.isSafeInteger(entry.quantity) ||
        entry.quantity < 1
      )
        continue;
      try {
        const product = parseCatalog([entry.product])[0];
        const previous = items.get(product.id)?.quantity || 0;
        // Preserve unavailable entries so customers can see and remove them.
        const quantity = Math.min(previous + entry.quantity, 999);
        items.set(product.id, { product, quantity });
      } catch {
        /* Discard only the malformed entry. */
      }
    }
    return [...items.values()];
  } catch {
    return [];
  }
}

export function cartIssues(items: CartItem[]): string[] {
  return items.flatMap(({ product, quantity }) => {
    if (!product.inStock || product.stockCount === 0)
      return [
        `${product.name} is no longer available. Please remove it from your bag.`,
      ];
    if (product.stockCount !== undefined && quantity > product.stockCount)
      return [
        `Only ${product.stockCount} of ${product.name} available. Please adjust the quantity.`,
      ];
    return [];
  });
}

export function reconcileCart(
  items: CartItem[],
  catalog: Product[],
): CartRefresh {
  const products = new Map(catalog.map((product) => [product.id, product]));
  let changedPrices = false;
  const refreshed = items.map((item) => {
    const product = products.get(item.product.id);
    if (!product)
      return {
        ...item,
        product: { ...item.product, inStock: false, stockCount: 0 },
      };
    if (product.priceInCents !== item.product.priceInCents)
      changedPrices = true;
    return { product, quantity: item.quantity };
  });
  return { items: refreshed, changedPrices, issues: cartIssues(refreshed) };
}
