import "server-only";
import { createHash } from "node:crypto";
import type Stripe from "stripe";
import type { CommerceEvent } from "./analytics";

/** Call only after proving payment and ownership with the browser's checkout capability. */
export function purchaseAnalytics(
  session: Stripe.Checkout.Session,
  lines: Stripe.LineItem[],
): CommerceEvent | null {
  if (
    session.status !== "complete" ||
    !["paid", "no_payment_required"].includes(session.payment_status) ||
    session.currency !== "usd"
  )
    return null;
  const shipping = session.total_details?.amount_shipping ?? 0;
  const tax = session.total_details?.amount_tax ?? 0;
  const total = session.amount_total;
  if (
    total === null ||
    ![total, shipping, tax].every((x) => Number.isSafeInteger(x) && x >= 0) ||
    total < shipping + tax
  )
    return null;
  const items = lines.map((line) => {
    const id =
      typeof line.price?.product === "string"
        ? line.price.product
        : line.price?.product?.id;
    const quantity = line.quantity;
    const value = line.amount_total - line.amount_tax;
    if (
      !id ||
      !/^prod_[A-Za-z0-9]+$/.test(id) ||
      !quantity ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      !Number.isSafeInteger(value) ||
      value < 0
    )
      return null;
    return { item_id: id, quantity, price: value / quantity / 100 };
  });
  if (!items.length || items.length > 20 || items.some((item) => !item))
    return null;
  return {
    transaction_id: `mj_${createHash("sha256").update(session.id).digest("hex").slice(0, 32)}`,
    currency: "USD",
    value: (total - shipping - tax) / 100,
    shipping: shipping / 100,
    tax: tax / 100,
    items: items.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    ),
  };
}
