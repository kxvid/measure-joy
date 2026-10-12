# Measure Joy production route and commerce map

Audit date: 2026-10-12. Source: `codex/measurejoy-storefront-redesign` in the production Next.js repository. The approved preview supplies visual direction only; product, price, stock, checkout, authentication and order records remain in the production integrations.

## Shared integration contracts

- Root layout mounts `ClerkProvider`, `CartProvider`, exit-intent subscription, social-proof toasts and Vercel Analytics. Public pages individually mount `Header` and `Footer`. Checkout and return pages mount a header only. Admin has its own authenticated layout. Replacing shared components provides global coverage; adding another header/footer to the root would duplicate them.
- `useCart()` exposes `items: { product: Product; quantity: number }[]`, `addItem(product, quantity = 1)`, `removeItem(productId)`, `updateQuantity(productId, quantity)`, `clearCart()`, `totalItems`, and `totalPrice` in cents. Browser storage key is `measurejoy-cart`. Retain this shape so existing carts survive.
- `Product` comes from native Stripe products and expanded `default_price`, with metadata for brand, year, category, condition, specs, stock and merchandising. Product images are native Stripe image URLs. `priceInCents` is a display field; checkout must independently retrieve live Stripe prices and stock.
- Product URLs use `productPath(product)`: `/product/<readable-slug>-<Stripe-id-suffix>`. Raw `/product/prod_…` and stale slugs redirect permanently to that canonical path. `resolveProductParam()` reverses both formats. Archived products deliberately remain readable and show sold-out state.
- Catalog API: `GET /api/products`, with `category=camera|accessory`, `featured=true`, `id=prod_…`, or `search=…`. List responses are `Product[]`; the ID response is `Product` or 404. Production edge cache is 60 seconds. There is no static catalog fallback. Current list implementation reads at most 100 Stripe products.
- Checkout exports remain `startCheckoutSession([{ productId, quantity }], userId?)`, `startSingleProductCheckout(productId, userId?, quantity?)` and `getCheckoutSessionStatus(sessionId)`. UI enters at `/checkout` or `/checkout?product=prod_…&qty=N`; successful checkout returns to `/checkout/return?session_id=cs_…`.
- Clerk owns sign-in, sign-up, account and administrative identity. Middleware gates `/account(.*)` and `/admin(.*)`; individual server actions must authorize their own calls. Supabase holds site CMS content, reviews, profiles and wishlists. Stripe Checkout Session metadata holds `user_id`, original `items` mapping, tracking number, carrier, shipped/delivered dates.

## Public route coverage

| Route | Dynamic/content source | Native actions to retain | Design treatment |
|---|---|---|---|
| `/` | Stripe inventory; Supabase CMS sections and latest reviews | Shop/category navigation, product actions, newsletter | Approved coral/cream hero, lifestyle imagery, real new arrivals, editorial cards and footer |
| `/shop` | `/api/products`; filters from `q`/`search`, `category`, `brand`, `year`, `sort` | Filter, sort, stock toggle, quick view, wishlist, cart | Responsive collection grid, generous product imagery, mobile filter sheet, real loading/empty/error states |
| `/product/[id]` | Live Stripe product, same-category in-stock related products; Supabase reviews | Gallery, quantity, add to cart, buy now, wishlist, reviews, recommendations | Gallery-led product detail, visible native price/condition/stock, clear purchase controls and sold-out alternatives |
| `/collections` | Stripe catalog summarized by brand | Links to collection/shop views | Editorial collection tiles with live product counts/images |
| `/collections/[slug]` | Six definitions in `lib/collections.ts`, filtered Stripe products; hourly revalidation | Product actions, adjacent collections | Distinct brand hero, crawlable collection copy, live product grid |
| `/journal` | Eight articles in `lib/journal.ts` | Article links, newsletter | Magazine index, readable category/date labels and photography |
| `/journal/[slug]` | Static article definitions; article JSON-LD | Related articles, relevant shop links, newsletter | Wide editorial image, readable article measure, clear related content |
| `/about` | Existing brand story | Shop, repair, contact links | Approved visual identity applied to authentic story and supporting images |
| `/repair` | Service copy and camera-service selection | Repair request form; email Christian | Service-led editorial page, accessible form, truthful loading/success/error states |
| `/contact` | Contact details and FAQ links | Contact form; email Christian | Clear contact options and accessible form with actual delivery status |
| `/faq` | Existing questions and answers; FAQ JSON-LD | Policy, repair, contact navigation | Readable accordion/help layout |
| `/shipping` | Existing shipping policy | Contact links | Consistent text-led policy layout; do not invent shipping rates |
| `/returns` | Existing return policy | Contact links | Consistent policy layout and clearly presented conditions |
| `/privacy` | Existing privacy policy | Contact links | Readable legal text with clear headings |
| `/terms` | Existing terms | Contact links | Readable legal text with clear headings |
| `/los-angeles-y2k-digital-camera-store` | Local copy, service areas, native camera inventory; Store JSON-LD | Shop, collection, repair, contact links | Local landing page with approved imagery, live products and retained local search content |
| `/cart` | CartProvider/local storage; native product snapshots | Quantity, removal, recommendations, checkout | Responsive bag page with totals, stock limits, empty state and checkout CTA |
| `/checkout` | Cart or queried native product; live server revalidation | Redirect to hosted Stripe Checkout | Branded transition, order summary and actionable errors; preserve Stripe payment UI |
| `/checkout/return` | Retrieved Stripe Checkout Session | Payment confirmation, clear completed cart, order/shop navigation | Branded success/pending/error states; never claim payment based solely on URL |
| `/sign-in/[[...sign-in]]` | Clerk hosted component | Sign-in, recovery, OAuth, sign-up routing | Brand wrapper plus Clerk appearance configuration |
| `/sign-up/[[...sign-up]]` | Clerk hosted component | Registration, verification, sign-in routing | Matching brand wrapper; retain Clerk path routing |
| `/account` | Clerk current user and owned Stripe orders | Account settings, orders, wishlist, sign-out | Branded customer dashboard using live data |
| `/account/orders` | Owned completed Stripe Checkout Sessions | Order details | Responsive order list with truthful empty/error state |
| `/account/orders/[id]` | Owned Stripe Checkout Session and metadata tracking | Tracking link and purchased product links | Clear order, delivery and item information |
| `/account/wishlist` | Supabase wishlist IDs + Stripe catalog | Remove wishlist item, add to cart | Real saved-product grid and signed-in empty state |
| `/account/settings` | Clerk UserProfile | Identity/security/account updates | Branded wrapper; retain `routing="hash"` |
| Unmatched route | `app/not-found.tsx` | Recovery to shop/home/help | Matching 404 illustration/layout |
| `/test-auth` | Clerk diagnostic user data | None for customers | Exclude from navigation; remove or restrict before public launch |

Collection slugs: `canon-powershot`, `sony-cyber-shot`, `nikon-coolpix`, `fujifilm-finepix`, `olympus-digicams`, `y2k-digital-cameras`.

Journal slugs: `why-y2k-cameras`, `best-cameras-beginners`, `care-guide`, `memory-cards-guide`, `photo-editing-tips`, `sony-cybershot-history`, `where-to-buy-y2k-cameras-los-angeles`, `canon-powershot-vs-sony-cyber-shot`.

## Supporting surfaces

Preserve product-card, quick-view, image-gallery, sticky add-to-cart, wishlist, review form, product reviews, upsell/cart drawers and recently viewed behavior while applying shared tokens. Preserve loading files, suspense/empty states, reduced-motion support and accessible labels. Keep JSON-LD, canonical URLs, `app/sitemap.ts`, and `app/robots.ts` aligned with the existing public URLs. `app/shop/metadata.ts` is a separate file and is not automatically exported as App Router route metadata.

Admin routes are operational: `/admin`, `/admin/products`, `/admin/categories`, `/admin/inventory`, `/admin/orders`, `/admin/orders/[id]`, `/admin/content`, `/admin/emails`, `/admin/copywriter`. Preserve their allowlist enforcement and native Stripe/CMS/email operations; avoid substituting preview adapters.

## Findings requiring care at launch

1. **Original stock IDs were lost at checkout.** Checkout constructed inline `price_data.product_data`; Stripe line items then referenced newly created synthetic products, while the webhook decremented those IDs instead of the catalog IDs retained in `metadata.items`. Native default-price IDs preserve the original catalog relationship. Legacy sessions need their metadata mapping honored.
2. **Order history used unsupported `checkout.sessions.search()`.** Official Stripe Checkout Sessions supports paginated listing, not this search method. Replace with server-side ownership filtering over completed sessions; retain metadata ownership checks for direct detail access.
3. **Webhook processing lacked retry/concurrency guarantees.** Repeated completed events could decrement inventory/send email twice, and concurrent read/update operations on Stripe metadata are not atomic. A durable fulfillment ledger/inventory reservation is required for strict exactly-once/concurrent stock guarantees. No database migration or live inventory changes were performed during this audit.
4. **The webhook signing secret is a deployment prerequisite.** A missing `STRIPE_WEBHOOK_SECRET` blocks safe event verification. Configure the actual endpoint secret; do not use a fabricated fallback.
5. **Checkout paid state and event type differ.** Completed sessions may still have asynchronous payments pending. Fulfillment must wait for `payment_status=paid`/`no_payment_required` and handle delayed success if enabled. Return UI should distinguish pending payment.
6. **Store policies disagree with checkout.** Existing SEO constants advertise $9.99 US shipping below $75, while both checkout actions supply free shipping for all allowed countries. The redesign should preserve actual checkout policy pending a business decision and avoid new contradictory copy.
7. **Shared cart callbacks were unstable.** Return-page effect depended on `clearCart`, which is recreated each CartProvider render; repeated clearing can retrigger status reads. Stabilize callbacks in the shared provider.
8. **Catalog edge cases remain visible.** Catalog listing only requests the first 100 products, shop “newest” sorts camera model year rather than `createdAt`, URL changes do not resync initialized filter state, and accessory `sub` navigation is not consumed by shop filters. Address these when touching the catalog UI.
9. **Administrative mutation endpoints need authorization review.** `/api/products/category` updates Stripe metadata but has no action-level authorization, and middleware only gates `/admin`, not `/api/products/category`. `/api/categorize` also requires explicit review. These are existing backend risks, separate from visual treatment.
10. **Several contact identities coexist.** Forms must use the requested Christian destination consistently. Existing contact/SEO/product-policy text contains other addresses; coordinate copy and recipient configuration without sending test mail to real people.

Official API references consulted: [Create Checkout Session](https://docs.stripe.com/api/checkout/sessions/create), [List Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/list), [Checkout Session object](https://docs.stripe.com/api/checkout/sessions/object).

## Commerce fixes implemented during this integration

The initial findings above describe the inspected baseline. Native checkout now validates and combines quantities, uses live default-price IDs, checks native availability, resolves identity through Clerk on the server, and returns to a verified request origin. Catalog reads paginate; outages return 503 rather than a successful empty array; invalid or missing prices cannot be purchased; zero or malformed tracked stock is unavailable. Archived product detail pages remain accessible.

Order history now uses supported paginated listing with server-side ownership filtering and paginated line items. Unit prices, legacy original product IDs, and current/historical Stripe shipping fields are retained correctly.

Webhook fulfillment verifies configuration/signatures, gates on paid state, handles delayed payment success, and resolves legacy product IDs from session metadata. A persisted per-product stock target and Stripe idempotency key make retry requests repeat the same update; completed markers skip ordinary duplicate deliveries. Stock failures return 500 so Stripe retries them. Confirmation emails use the charged total and current shipping address. **This is not a reservation system:** simultaneous different checkout sessions still require an atomic inventory store to prevent overselling, and provider idempotency retention is finite. Order confirmation now uses a stable Resend idempotency key and records success only after provider acceptance; the sender domain still needs verification before delivery is operational.

Verification: 13 isolated mocked commerce tests cover native price/identity/origin, malformed quantities, combined stock limits, missing prices, catalog pagination/outages, original stock IDs, repeat deliveries, a lost stock-update response, pending payment, order ownership and archived product details. No live Stripe writes or payment sessions were used for this verification.


## Bag and checkout visual integration

The approved cream/coral identity now covers the bag, checkout transition and return screens through `components/storefront/commerce.css`. The bag preserves valid legacy storage, handles blocked storage, refreshes current native prices and availability, shows price changes, and retains unavailable items visibly until removed. Missing products and excessive quantities block checkout without silent cart changes. Final shipping/taxes/discounts remain on Stripe's confirmation step.

Cart callbacks are stable. Checkout waits for cart hydration and guards a single attempt per route/retry, while the server resolves the Clerk identity independently. Guest checkout does not depend on the client-side Clerk widget loading. Pending payments retain the bag; completed payments clear it once after storage hydration. Cart, checkout and return routes have canonical URLs and `noindex` metadata. Four cart-state tests cover malformed storage, duplicate entries, stock limits and fresh catalog reconciliation; three order-email tests cover missing configuration, rejected messages and stable retry keys.
