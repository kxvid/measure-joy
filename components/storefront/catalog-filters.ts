import type { Product } from "@/lib/products";

export type Category =
  | "all"
  | "camera"
  | "digital"
  | "film"
  | "accessory"
  | "lens"
  | "memory"
  | "power";
type ProductKind = Exclude<Category, "all" | "camera">;
export interface ShopFilters {
  category: Category;
  brand: string;
  year: string;
  query: string;
  sort: "fresh" | "price-low" | "price-high";
  onlyAvailable: boolean;
  savedOnly: boolean;
}
export const DEFAULT_FILTERS: ShopFilters = {
  category: "all",
  brand: "all",
  year: "all",
  query: "",
  sort: "fresh",
  onlyAvailable: true,
  savedOnly: false,
};
const categories: Category[] = [
  "all",
  "camera",
  "digital",
  "film",
  "accessory",
  "lens",
  "memory",
  "power",
];

/** Presentation groups only: never change Stripe records, stock, prices, or IDs. */
export function classifyProduct(
  product: Pick<Product, "name" | "category" | "subcategory">,
): ProductKind {
  // Ignore bundled items and compatibility tails when identifying the item being sold.
  const title = product.name.split(
    /\b(?:with|includes?|for|compatible with)\b/i,
  )[0];
  const camera =
    /\bcamera\b(?!\s+(?:lens|battery|charger|case|bag|strap|manual|adapter|cable|cap))|\b(?:camcorder|handycam|digicam|instax)\b/i.test(
      title,
    );
  if (/\b(?:manual|instructions?|guide)\b/i.test(title)) return "accessory";
  if (!camera) {
    if (/\blens(?:es)?\b/i.test(title)) return "lens";
    if (
      /\b(?:sd(?:hc|xc)?|micro\s?sd|compact\s?flash|memory\s+(?:card|stick)|cf\s+card)\b/i.test(
        title,
      )
    )
      return "memory";
    if (
      /\b(?:batter(?:y|ies)|chargers?|charging|power adapter|ac adapter)\b/i.test(
        title,
      )
    )
      return "power";
    if (
      /\b(?:cases?|bags?|straps?|adapters?|filters?|caps?|cables?|flash)\b/i.test(
        title,
      )
    )
      return "accessory";
  }
  const subcategory = product.subcategory?.toLowerCase();
  if (camera || product.category === "camera") {
    if (/\b(?:digital|camcorder|handycam)\b/i.test(title)) return "digital";
    if (/\b(?:film|instant|instax|analog|analogue)\b/i.test(title))
      return "film";
  }
  if (subcategory === "film" || subcategory === "instant") return "film";
  if (subcategory === "lens" || subcategory === "lenses") return "lens";
  if (subcategory === "memory" || subcategory === "memory-card")
    return "memory";
  if (
    ["battery", "batteries", "charger", "chargers", "power"].includes(
      subcategory || "",
    )
  )
    return "power";
  return camera || product.category === "camera" ? "digital" : "accessory";
}

export function categoryMatch(
  product: Pick<Product, "name" | "category" | "subcategory">,
  category: Category,
): boolean {
  if (category === "all") return true;
  const kind = classifyProduct(product);
  if (category === "camera") return kind === "digital" || kind === "film";
  if (category === "accessory") return kind !== "digital" && kind !== "film";
  return kind === category;
}

export function readFilters(search: string): ShopFilters {
  const params = new URLSearchParams(search);
  const legacySub = params.get("sub");
  const category = (
    legacySub === "memory-card"
      ? "memory"
      : legacySub === "lens"
        ? "lens"
        : legacySub === "battery"
          ? "power"
          : params.get("category")
  ) as Category;
  const sort = params.get("sort");
  return {
    category: categories.includes(category) ? category : "all",
    brand: params.get("brand") || "all",
    year: /^\d{4}$/.test(params.get("year") || "")
      ? params.get("year")!
      : "all",
    query: params.get("search") || "",
    sort: sort === "price-low" || sort === "price-high" ? sort : "fresh",
    onlyAvailable: params.get("stock") !== "all",
    savedOnly: params.get("saved") === "1",
  };
}

/** Replace only this UI's parameters, preserving attribution parameters and anchors. */
export function filtersUrl(currentUrl: string, filters: ShopFilters): string {
  const url = new URL(currentUrl);
  for (const key of [
    "category",
    "sub",
    "brand",
    "year",
    "search",
    "sort",
    "stock",
    "saved",
  ])
    url.searchParams.delete(key);
  if (filters.category !== "all")
    url.searchParams.set("category", filters.category);
  if (filters.brand !== "all") url.searchParams.set("brand", filters.brand);
  if (filters.year !== "all") url.searchParams.set("year", filters.year);
  if (filters.query) url.searchParams.set("search", filters.query);
  if (filters.sort !== "fresh") url.searchParams.set("sort", filters.sort);
  if (!filters.onlyAvailable) url.searchParams.set("stock", "all");
  if (filters.savedOnly) url.searchParams.set("saved", "1");
  return url.href;
}

export function readSavedIds(value: unknown): string[] {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string =>
              typeof id === "string" && /^prod_[a-zA-Z0-9]+$/.test(id),
          ),
        ),
      ].slice(0, 100)
    : [];
}

export function missingSavedIds(
  saved: readonly string[],
  products: readonly Pick<Product, "id">[],
): string[] {
  const currentIds = new Set(products.map((product) => product.id));
  return saved.filter((id) => !currentIds.has(id));
}
