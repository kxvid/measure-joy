# Inventory coordination and recovery

Stripe is the product, price, and stock authority. Supabase stores only reservations and fulfillment coordination. This runbook covers the production cutover and safe recovery of uncertain provider responses.

## Safety and recovery rules

The reservation RPC locks affected products in a consistent order, verifies the Stripe snapshot's DB revision, refuses any pending stock write, and checks all held quantities against the observed Stripe stock. A reservation across several products commits entirely or not at all. Fulfillment persists its stock target while holding the product barrier, changes Stripe, then atomically marks the item applied, increments revision and releases that barrier. Concurrent operations cannot reuse an old stock observation after another operation completes.

There is deliberately **no expiring lock or lease** that can unlock an ambiguous network side effect. A timeout does not release a reservation or a stock-write barrier. Retries use the original complete parameters and key for less than 23 hours, leaving margin below Stripe's documented minimum 24-hour idempotency retention. After that window, automatic replay stops. A matching Stripe operation marker and matching written fields can still prove success and finalize the DB record without another Stripe write.

Expiry is based on fresh Stripe state, never local wall-clock passage. Completed unpaid/delayed payments remain reserved. A failed event with a retryable PaymentIntent (including `requires_payment_method`) also retains stock; only confirmed cancellation or session expiration can release it. Refunds deliberately do not restock automatically: physical return/inspection is a separate decision. All stock edits must use the coordinated admin action. Direct Stripe dashboard inventory edits require a paused/drained checkout and reconciliation; Stripe does not offer a conditional compare-and-swap metadata write that would protect an out-of-band overwrite.

Legacy sessions already marked `inventory_processed` or per-item `stock_done` import as applied without subtracting again, including when a product has since been deleted. A legacy `stock_target` without `stock_done` is explicitly held for manual reconciliation: the old code stored no reliable idempotency timestamp, and replaying that historical absolute target could overwrite intervening sales.

Creation failures retain the reservation unless a terminal Stripe session is positively identified. This is conservative even for apparent parameter errors: retry/reconciliation may overlap an earlier uncertain call. Quantity and amount bounds prevent attacker-controlled enormous-cart rejections before any hold. Configuration/provider errors still surface through the reconciliation queue instead of silently freeing potentially paid stock.

## Production rollout

1. Apply the inventory migration and the durable quota migration to exact project `tffjckyzkowizxajxzkm`. Verify service-role RPC access and client-role denial. Keep `commerce_control.checkout_enabled=false`.
2. Configure the production Stripe webhook endpoint to deliver all four event types:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.expired`
   - `checkout.session.async_payment_failed`
3. Deploy the complete new release (checkout, webhook, coordinator, admin stock path, and UI return-URL compatibility together). While the gate is closed, checkout displays “Checkout is temporarily paused. Please try again shortly.” Confirm old deployment URLs/skew-protection cannot continue accepting old server actions; protect or remove public access to obsolete deployments if necessary. Allow old checkout/webhook invocations and their provider requests to drain before enabling the gate.
4. Repeat the scoped Stripe session scan after deployment/drain. For any remaining legacy **open** session (no reservation ID), retrieve fresh state, expire only while still open, and retrieve again to confirm expiration. Never infer expiration from the API call timing out. Do not cancel/refund paid sessions as part of this cutover.
5. For any legacy completed unpaid/pending session, derive and normalize its original catalog product quantities (existing `metadata.items`, otherwise native line items) and import held items with the service-role RPC below before enabling new sales. Already processed items must be imported as applied. Inspect unfinished paid sessions and old partial targets; resolve them before enabling products whose inventory is uncertain. Do not print customer email, addresses, full session payloads or secret values in rollout output.
6. Enable checkout only after the scan and reconciliation are clean:

```sql
update public.commerce_control set checkout_enabled = true where id = true;
```

To import a legacy pending session (use real verified values, through the service role):

```sql
select public.commerce_adopt_checkout(
  'cs_verified_legacy_session',
  'cs_verified_legacy_session',
  '[{"productId":"prod_verified","quantity":1,"applied":false}]'::jsonb
);
```

The imported ledger ID equals its Stripe session ID. The revised webhook and reconciliation paths recognize that form even though old Stripe metadata lacks a `reservation_id`.

## Operator recovery

Call the admin reconciliation route from an authenticated same-origin admin context:

```js
await fetch('/api/admin/reconcile-inventory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productIds: ['prod_verified'] }),
}).then(response => response.json())
```

Use an administrator's existing signed-in browser session; the route requires the exact Origin and rejects cross-site requests. The unscoped body is `{}`. This retry can recover ambiguous session creation within the safe window, bind the recovered session, release confirmed expired checkouts, finish paid inventory, or settle a positively marked stock operation. It does not send customer email; normal Stripe webhook retry handles confirmation.

For `needsReview > 0`, inspect **only necessary** private ledger fields and Stripe request/session state. A safe diagnostic query (no customer data or capability):

```sql
select id, session_id, state, created_at, expires_at
from public.commerce_checkouts
where state in ('reserved','open','pending')
order by created_at;

select id, product_id, checkout_id, state, created_at
from public.commerce_stock_operations
where state='pending'
order by created_at;
```

- An orphan older than 23 hours must not be recreated using a new key. Locate its existing Stripe session using the reservation metadata and request logs. Bind a positively identified session with `commerce_bind_checkout`, then retry reconciliation. If request logs prove creation never occurred and all possible invocations are drained, an operator may explicitly release that reservation with `commerce_release_checkout`; absence from an incomplete session listing is insufficient proof. Record the evidence in the operational incident record.
- A stock operation older than 23 hours with no matching Stripe marker stays blocked. Pause checkout, drain writers, compare Stripe request logs, the operation target, completed payments and physical stock. Resolve the actual stock discrepancy in Stripe, verify the result, and only then finalize the corresponding operation with `commerce_complete_stock_operation`. Never clear `pending_operation` directly, delete the ledger, refresh its creation timestamp, or blindly replay an old absolute target. Record the manual correction and its evidence.
- A failed but retryable payment can still succeed; keep its hold unless Stripe confirms cancellation. Once a legitimately canceled intent is visible, reconciliation can release it. A return/refund restock uses the normal admin inventory path only after physical-stock reconciliation and no competing holds.
- To pause new checkout for recovery: `update public.commerce_control set checkout_enabled=false where id=true;`. This does not unlock in-flight writes or release existing holds.
