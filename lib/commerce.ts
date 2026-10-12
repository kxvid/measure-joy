import type Stripe from "stripe";

export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export function normalizeCheckoutItems(items: CheckoutItem[]): CheckoutItem[] {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    throw new Error("Please add an item to your cart before checking out.");
  }
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (
      !item ||
      !/^prod_[A-Za-z0-9]+$/.test(item.productId) ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new Error("Please choose a valid product quantity.");
    }
    const quantity = (quantities.get(item.productId) || 0) + item.quantity;
    if (!Number.isSafeInteger(quantity))
      throw new Error("Please choose a valid product quantity.");
    quantities.set(item.productId, quantity);
  }
  return Array.from(quantities, ([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export function stockCountFromMetadata(
  metadata: Stripe.Metadata,
): number | undefined {
  const raw = metadata.stockCount;
  if (raw === undefined || raw === "") return undefined;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function usablePrice(
  price: Stripe.Price | string | null | undefined,
): price is Stripe.Price {
  return Boolean(
    price &&
      typeof price === "object" &&
      price.active &&
      price.type === "one_time" &&
      price.currency === "usd" &&
      Number.isSafeInteger(price.unit_amount) &&
      price.unit_amount! >= 0,
  );
}

export function isPaidSession(session: Stripe.Checkout.Session): boolean {
  return (
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required"
  );
}

export function originalCheckoutItems(
  session: Stripe.Checkout.Session,
): CheckoutItem[] {
  const value = session.metadata?.items;
  if (!value) return [];
  try {
    return normalizeCheckoutItems(
      value.split(",").map((part) => {
        const [productId, quantity] = part.split(":");
        return { productId, quantity: Number(quantity) };
      }),
    );
  } catch {
    throw new Error("Checkout inventory metadata is invalid.");
  }
}

export function shippingDetails(session: Stripe.Checkout.Session) {
  // Keep historical sessions readable across Stripe's shipping field migration.
  return (
    session.collected_information?.shipping_details ||
    (
      session as Stripe.Checkout.Session & {
        shipping_details?: Stripe.Checkout.Session.CollectedInformation.ShippingDetails | null;
      }
    ).shipping_details ||
    null
  );
}

export function checkoutOrigin(requestHeaders: Pick<Headers, "get">): string {
  const origin = requestHeaders.get("origin");
  const forwardedHost = requestHeaders
    .get("x-forwarded-host")
    ?.split(",")[0]
    .trim();
  const host = forwardedHost || requestHeaders.get("host");
  if (origin && host) {
    const url = new URL(origin);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      url.host.toLowerCase() !== host.toLowerCase() ||
      (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    ) {
      throw new Error("The checkout request origin could not be verified.");
    }
    return url.origin;
  }
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://www.measurejoy.org");
  return new URL(configured).origin;
}
