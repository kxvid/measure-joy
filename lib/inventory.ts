import "server-only";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe as catalogStripe } from "@/lib/stripe";
import { isPaidSession, normalizeCheckoutItems, originalCheckoutItems, stockCountFromMetadata, type CheckoutItem } from "@/lib/commerce";

// Stripe v1 and Resend retain idempotency keys for at least 24 hours. Stop
// automatic writes early; an old, uncertain result requires reconciliation.
const SAFE_RETRY_MS = 23 * 60 * 60 * 1000;
const OPERATION_MARKER = "commerce_operation";
type StockOperation = { id: string; product_id: string; checkout_id: string | null; metadata: Record<string, string>; state: "pending" | "applied"; created_at: string };
type InventorySnapshot = { productId: string; revision: number; operation: StockOperation | null };
type CheckoutRecord = { capability_hash?: string | null; id: string; session_id: string | null; session_params: Stripe.Checkout.SessionCreateParams | null; created_at: string; expires_at: string | null; state: string };
export type ReservationItem = CheckoutItem & { revision: number; stock: number | null };

async function rpc<T>(name: string, params: Record<string, unknown>): Promise<T> {
  const { data, error } = await createAdminClient().rpc(name, params);
  if (error) throw new Error(`Inventory coordination failed: ${error.message}`);
  return data as T;
}
function operationId(checkoutId: string, productId: string) {
  return createHash("sha256").update(`${checkoutId}:${productId}`).digest("hex");
}
export function inventoryMarkerSuffix(productId: string) {
  return productId.length <= 27 ? productId : createHash("sha256").update(productId).digest("hex").slice(0, 24);
}
function canRetry(createdAt: string) {
  return Date.now() - Date.parse(createdAt) < SAFE_RETRY_MS;
}

async function applyStockOperation(stripe: Stripe, operation: StockOperation) {
  if (operation.state === "applied") return;
  if (Object.keys(operation.metadata).length) {
    const product = await stripe.products.retrieve(operation.product_id);
    if (product.metadata[OPERATION_MARKER] !== operation.id) {
      if (!canRetry(operation.created_at)) throw new Error("An uncertain stock update needs manual reconciliation before this product can be sold.");
      // Persisted target + idempotency key are immutable. No catch/finally may
      // clear the DB barrier after a timeout or an unconfirmed provider error.
      await stripe.products.update(operation.product_id, {
        metadata: { ...operation.metadata, [OPERATION_MARKER]: operation.id },
      }, { idempotencyKey: `commerce-stock-${operation.id}`, timeout: 20_000, maxNetworkRetries: 2 });
    } else {
      // A marker is positive evidence that this exact side effect succeeded.
      // An unexpected edit after it is not safe to reinterpret as success.
      for (const [key, value] of Object.entries(operation.metadata)) {
        if ((product.metadata[key] || "") !== value) throw new Error("Stripe inventory changed outside its coordinator; manual reconciliation required.");
      }
    }
  }
  await rpc("commerce_complete_stock_operation", { p_id: operation.id });
}

export async function inventorySnapshot(stripe: Stripe, productIds: string[]): Promise<InventorySnapshot[]> {
  let rows = await rpc<InventorySnapshot[]>("commerce_inventory_snapshot", { p_products: productIds });
  for (const row of rows) if (row.operation) await applyStockOperation(stripe, row.operation);
  // Completing pending writes changes revision. Always return fresh revisions.
  if (rows.some(row => row.operation)) rows = await rpc<InventorySnapshot[]>("commerce_inventory_snapshot", { p_products: productIds });
  return rows;
}

export async function createReservedCheckout(stripe: Stripe, id: string, items: ReservationItem[], params: Stripe.Checkout.SessionCreateParams, capabilityHash: string, onReserved: () => void) {
  try {
    await rpc("commerce_reserve_checkout", { p_id: id, p_items: items, p_params: params, p_capability_hash: capabilityHash });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("temporarily paused")) throw new Error("Checkout is temporarily paused. Please try again shortly.");
    if (message.includes("reserved or out of stock")) throw new Error("This item is reserved or out of stock. Please try again later.");
    if (message.includes("Inventory changed")) throw new Error("Availability changed. Please try checkout again.");
    throw new Error("Checkout is temporarily unavailable. Please try again later.");
  }
  onReserved();
  // An ambiguous create response retains all holds. The original complete
  // parameters and key are in the ledger for safe reconciliation.
  const session = await stripe.checkout.sessions.create(params, { idempotencyKey: `commerce-checkout-${id}`, timeout: 20_000, maxNetworkRetries: 2 });
  await rpc("commerce_bind_checkout", { p_id: id, p_session_id: session.id, p_state: session.status === "complete" ? "pending" : "open" });
  return session;
}

async function checkoutRecord(id: string) {
  const { data, error } = await createAdminClient().from("commerce_checkouts").select("id,session_id,session_params,capability_hash,created_at,expires_at,state").eq("id", id).maybeSingle();
  if (error) throw new Error("Could not read checkout coordination ledger.");
  return data as CheckoutRecord | null;
}

export async function fulfillInventory(stripe: Stripe, session: Stripe.Checkout.Session, fallbackItems: CheckoutItem[]) {
  if (!isPaidSession(session)) throw new Error("Payment is not complete.");
  const id = session.metadata?.reservation_id || session.id;
  const originals = originalCheckoutItems(session);
  let items = originals.length ? originals : fallbackItems.length ? normalizeCheckoutItems(fallbackItems) : [];
  if (!items.length) {
    const { data, error } = await createAdminClient().from("commerce_checkout_items").select("product_id,quantity").eq("checkout_id", id);
    if (error) throw new Error("Could not read checkout inventory ledger.");
    items = normalizeCheckoutItems((data || []).map(row => ({ productId: row.product_id as string, quantity: row.quantity as number })));
  }
  if (!items.length || items.some(item => !/^prod_[A-Za-z0-9]+$/.test(item.productId) || !Number.isSafeInteger(item.quantity) || item.quantity < 1)) throw new Error("Checkout inventory items are invalid.");
  if (session.metadata?.reservation_id) {
    const record = await checkoutRecord(id);
    if (!record) throw new Error("Checkout reservation is missing; manual reconciliation required.");
    await rpc("commerce_bind_checkout", { p_id: id, p_session_id: session.id, p_state: "pending" });
  } else {
    const record = await checkoutRecord(id);
    if (record && record.session_id !== session.id) throw new Error("Checkout reservation identity mismatch.");
    if (record) {
      const { data, error } = await createAdminClient().from("commerce_checkout_items").select("product_id,quantity").eq("checkout_id", id);
      if (error || !data?.length) throw new Error("Checkout inventory ledger is missing.");
      const adoptedItems = normalizeCheckoutItems(data.map(row => ({ productId: row.product_id as string, quantity: row.quantity as number })));
      const signature = (values: CheckoutItem[]) => values.map(item => `${item.productId}:${item.quantity}`).sort().join(",");
      if (originals.length && signature(originals) !== signature(adoptedItems)) throw new Error("Legacy inventory items differ from the verified adoption; manual reconciliation required.");
      // A verified legacy ledger can map old inline line-item products back to
      // the catalog. Never append fallback products or widen its quantities.
      items = adoptedItems;
    }
    const appliedItems = items.map(item => ({ ...item, applied: session.metadata?.inventory_processed === "true" || session.metadata?.[`stock_done_${inventoryMarkerSuffix(item.productId)}`] === "true" }));
    for (const item of items) {
      const suffix = inventoryMarkerSuffix(item.productId);
      if (session.metadata?.inventory_processed !== "true" && session.metadata?.[`stock_done_${suffix}`] !== "true" && session.metadata?.[`stock_target_${suffix}`] !== undefined) {
        // The old implementation never recorded when its idempotency key was
        // used. Replaying its absolute target can overwrite later sales.
        throw new Error("Legacy partial inventory fulfillment requires manual reconciliation.");
      }
    }
    // Earlier storefronts adjusted stock without these markers, including
    // manual adjustments. Their absence cannot authorize a historical debit.
    // Only an explicit, matching cutover adoption may hold unmarked items.
    if (!record && appliedItems.some(item => !item.applied)) {
      throw new Error("Legacy inventory history requires manual reconciliation before replay.");
    }
    if (!record) {
      await rpc("commerce_adopt_checkout", {
        p_id: id, p_session_id: session.id,
        p_items: appliedItems,
      });
    }
  }
  const { data: ledgerItems, error: ledgerError } = await createAdminClient().from("commerce_checkout_items").select("product_id,quantity,state").eq("checkout_id", id);
  if (ledgerError || !ledgerItems?.length) throw new Error("Checkout inventory ledger is missing.");
  for (const row of ledgerItems) {
    if (row.state === "applied") continue;
    const item = { productId: row.product_id as string, quantity: row.quantity as number };
    const [snapshot] = await inventorySnapshot(stripe, [item.productId]);
    const product = await stripe.products.retrieve(item.productId);
    const operation = await rpc<StockOperation>("commerce_begin_stock_operation", {
      p_id: operationId(id, item.productId), p_product_id: item.productId, p_checkout_id: id,
      p_revision: snapshot.revision, p_stock: stockCountFromMetadata(product.metadata) ?? null, p_metadata: {},
    });
    await applyStockOperation(stripe, operation);
  }
  await rpc("commerce_finish_checkout", { p_id: id });
  return id;
}

export async function confirmationAction(id: string, sent = false) {
  return rpc<{ action: "send" | "done" }>("commerce_confirmation", { p_id: id, p_sent: sent });
}

export async function releaseExpiredCheckout(stripe: Stripe, session: Stripe.Checkout.Session, paymentFailed = false) {
  const id = session.metadata?.reservation_id || session.id;
  if (isPaidSession(session)) return false;
  // Old sessions imported during cutover have their session ID as ledger ID.
  if (!session.metadata?.reservation_id && !(await checkoutRecord(id))) return false;
  let terminal = session.status === "expired";
  if (!terminal && paymentFailed && session.status === "complete" && session.payment_intent) {
    // A failed event alone may be stale. Inspect the current payment intent;
    // Any retryable intent (including requires_payment_method) retains stock.
    // Only cancellation makes a failed intent unable to succeed later.
    const intent = typeof session.payment_intent === "string"
      ? await stripe.paymentIntents.retrieve(session.payment_intent)
      : session.payment_intent;
    terminal = intent.status === "canceled";
  }
  if (!terminal) return false;
  await rpc("commerce_bind_checkout", { p_id: id, p_session_id: session.id, p_state: "pending" });
  await rpc("commerce_release_checkout", { p_id: id });
  return true;
}

async function recoverCheckoutSession(stripe: Stripe, record: CheckoutRecord) {
  let session: Stripe.Checkout.Session;
  if (record.session_id) session = await stripe.checkout.sessions.retrieve(record.session_id);
  else {
    // Never invent a new create key or alter parameters after ambiguity. An
    // expired idempotency window is an operator task, not permission to free stock.
    if (!record.session_params || !canRetry(record.created_at)) throw new Error("Checkout creation needs manual reconciliation.");
    session = await stripe.checkout.sessions.create(record.session_params, { idempotencyKey: `commerce-checkout-${record.id}`, timeout: 20_000, maxNetworkRetries: 2 });
    await rpc("commerce_bind_checkout", { p_id: record.id, p_session_id: session.id, p_state: session.status === "complete" ? "pending" : "open" });
  }
  if ((session.metadata?.reservation_id || session.id) !== record.id) throw new Error("Checkout reservation identity mismatch.");
  return session;
}

// The random cookie is an independent bearer capability, not a session ID or
// Clerk user ID. Its SHA-256 digest lives only in the private coordination DB.
async function ownedCheckoutRecord(capability: string, userId: string | null) {
  const match = /^([a-f0-9-]{36})\.([a-f0-9]{64})$/.exec(capability);
  if (!match) return null;
  const record = await checkoutRecord(match[1]);
  const digest = createHash("sha256").update(match[2]).digest("hex");
  if (!record?.capability_hash || !timingSafeEqual(Buffer.from(digest), Buffer.from(record.capability_hash))) return null;
  return record.session_params?.metadata?.user_id === (userId || "") ? record : null;
}

export async function acknowledgeOwnedPaidCheckout(session: Stripe.Checkout.Session, capability: string, userId: string | null) {
  if (session.status !== "complete" || !isPaidSession(session)) return false;
  const record = await ownedCheckoutRecord(capability, userId);
  return Boolean(record && (record.session_id === session.id || (!record.session_id && session.metadata?.reservation_id === record.id)));
}

export async function resumeOwnedCheckout(stripe: Stripe, capability: string, items: CheckoutItem[], userId: string | null) {
  const record = await ownedCheckoutRecord(capability, userId);
  if (!record) return null;
  let session = await recoverCheckoutSession(stripe, record);
  const original = originalCheckoutItems({ metadata: record.session_params?.metadata } as Stripe.Checkout.Session);
  const signature = (cart: CheckoutItem[]) => cart.map(item => `${item.productId}:${item.quantity}`).sort().join(",");
  if (session.status === "open" && signature(items) === signature(original)) {
    if (!session.url) throw new Error("Checkout is temporarily unavailable. Please try again later.");
    return { url: session.url, sessionId: session.id, keepCookie: true };
  }
  if (session.status === "open") {
    // Changing a cart must close its old payment surface before releasing any
    // hold. A rejected or ambiguous expiry leaves the old reservation intact.
    await stripe.checkout.sessions.expire(session.id, {}, { idempotencyKey: `commerce-expire-${record.id}`, timeout: 20_000, maxNetworkRetries: 2 });
    session = await stripe.checkout.sessions.retrieve(session.id);
  }
  if (await releaseExpiredCheckout(stripe, session, true)) return null;
  if (session.status === "complete") {
    // A new cart after a successful payment is a new order. A pending payment
    // keeps its capability so repeated clicks cannot create another payment.
    if (isPaidSession(session) && signature(items) !== signature(original)) return null;
    return { url: null, sessionId: session.id, keepCookie: true };
  }
  throw new Error("The previous checkout is still being processed. Please try again shortly.");
}

export async function reconcileCheckoutReservation(stripe: Stripe, record: CheckoutRecord) {
  if (record.state === "released" || record.state === "fulfilled") return "complete";
  const session = await recoverCheckoutSession(stripe, record);
  if (await releaseExpiredCheckout(stripe, session, true)) return "released";
  if (isPaidSession(session)) {
    await fulfillInventory(stripe, session, []);
    // Email stays with the webhook; stock recovery is independent of sending.
    return "fulfilled";
  }
  return "held";
}

export async function reconcileInventory(stripe: Stripe, productIds?: string[], includeOpen = false) {
  let ids: string[] | undefined;
  if (productIds) {
    const { data, error } = await createAdminClient().from("commerce_checkout_items").select("checkout_id").in("product_id", productIds).eq("state", "held").limit(20);
    if (error) throw new Error("Could not read inventory reservations.");
    ids = [...new Set((data || []).map(row => row.checkout_id as string))];
  }
  let query = createAdminClient().from("commerce_checkouts").select("id,session_id,session_params,created_at,expires_at,state").in("state", ["reserved", "open", "pending"]).order("created_at").limit(20);
  if (ids) query = query.in("id", ids);
  const { data, error } = await query;
  if (error) throw new Error("Could not read inventory reconciliation ledger.");
  const result = { checked: 0, recovered: 0, needsReview: 0 };
  for (const record of (data || []) as CheckoutRecord[]) {
    // Ordinary open sessions should not be fetched on every cart request.
    if (productIds && !includeOpen && record.session_id && record.expires_at && Date.parse(record.expires_at) > Date.now()) continue;
    result.checked++;
    try {
      const outcome = await reconcileCheckoutReservation(stripe, record);
      if (outcome === "released" || outcome === "fulfilled") result.recovered++;
    } catch {
      result.needsReview++;
      console.error("[Inventory] Reservation needs reconciliation", record.id);
    }
  }
  if (!productIds || includeOpen) {
    let operations = createAdminClient().from("commerce_stock_operations").select("*").eq("state", "pending").order("created_at").limit(20);
    if (productIds) operations = operations.in("product_id", productIds);
    const { data: pending, error: pendingError } = await operations;
    if (pendingError) throw new Error("Could not read pending stock operations.");
    for (const operation of (pending || []) as StockOperation[]) {
      result.checked++;
      try { await applyStockOperation(stripe, operation); result.recovered++; }
      catch { result.needsReview++; console.error("[Inventory] Stock operation needs reconciliation", operation.id); }
    }
  }
  return result;
}

export async function setCoordinatedStock(productId: string, stock: number | null, inStock?: boolean) {
  if (!/^prod_[A-Za-z0-9]+$/.test(productId) || (stock !== null && (!Number.isSafeInteger(stock) || stock < 0)) || (inStock !== undefined && typeof inStock !== "boolean")) throw new Error("Invalid inventory update.");
  const [snapshot] = await inventorySnapshot(catalogStripe, [productId]);
  const metadata: Record<string, string> = { stockCount: stock === null ? "" : String(stock) };
  if (inStock !== undefined) metadata.inStock = String(inStock);
  else if (stock === 0) metadata.inStock = "false";
  const operation = await rpc<StockOperation>("commerce_begin_stock_operation", {
    p_id: randomUUID(), p_product_id: productId, p_checkout_id: null,
    p_revision: snapshot.revision, p_stock: null, p_metadata: metadata,
  });
  await applyStockOperation(catalogStripe, operation);
}
