# Measure Joy storefront and identity redesign

Date: October 7, 2026
Status: Concrete design proposal; awaiting written-design review before implementation.
Repository: https://github.com/kxvid/measure-joy
Audited base: f43f871b36469a813094d81e5753ac0ae6299480

## Outcome and agreed requirements

Rebuild Measure Joy's customer-facing experience and visual identity as a beautiful, modern vintage-camera store. The user selected a blend of an editorial camera boutique and colorful Y2K energy. Create original logo concepts, brand assets, and campaign imagery using Higgsfield. Keep the existing GitHub project and its complete backend.

**Stripe remains the source of truth for camera listings, pricing, inventory metadata, and commerce.** Every real product, displayed price, availability decision, and checkout product reference comes from the existing Stripe integration. Do not introduce a static product catalog, duplicate commerce database, replacement payment provider, or client-authored price.

Success means a cohesive, responsive storefront whose catalog, cart, purchase journey, account/order experience, and admin functions continue to use the existing contracts.

## Recommended approach

Replace the presentation layer inside the existing Next.js application. Use Higgsfield for original art direction, identity concepts, and editorial imagery. Retain the existing deployment architecture and domain. This gives the new design direct access to the established Stripe catalog and shopping flows without migrating the backend.

An independent frontend on another host would require duplicated integration, cross-origin authentication and checkout work, and separate release management. A complete backend migration would contradict the preservation requirement. Neither is part of this proposal.

## Visual identity

- Name: Measure Joy, with a friendly lowercase display wordmark and a compact viewfinder-inspired joy symbol.
- Palette: warm ivory `#F4F1E8`, ink `#191919`, coral `#FF5439`, acid yellow `#DAFF4F`, and restrained silver `#C7C9CF`.
- Typography: confident editorial sans-serif headlines, readable sentence-case body text, and small monospace details that recall camera settings. Resolve fonts through the project's existing font-loading setup.
- Composition: spacious product grids, clear hierarchy, occasional oversized type, rounded action buttons, and a small number of sticker/flash/chrome accents.
- Voice: warm, brief, candid, and enthusiastic about making photographs. Suggested campaign line: “Good cameras. Great stories.” Suggested hero: “Less scrolling. More living.”
- Motion: subtle entry and hover motion with reduced-motion support; shopping controls stay stable and usable.
- Logo delivery: turn the selected concept into a clean reusable vector wordmark and icon, with light/dark variants and favicon assets. The generated identity board is a concept, not the final production logo file.

Coral and acid yellow are accents; final text/button combinations must meet contrast requirements. Do not assume white-on-coral is accessible for small labels.

## Higgsfield concept assets

These images are completed design proposals, not screenshots of an implemented store:

1. [Identity board](https://d8j0ntlcm91z4.cloudfront.net/user_3FBnpR8QRNnkjo7QGJ5EgRz9ktw/hf_20261007_220100_f462e7af-5ce1-4bde-a9ca-dc3b82172f8e.png)
2. [Storefront concept](https://d8j0ntlcm91z4.cloudfront.net/user_3FBnpR8QRNnkjo7QGJ5EgRz9ktw/hf_20261007_220100_40796ad3-6f6f-4907-a483-81ef09024282.png)
3. [Camera campaign still life](https://d8j0ntlcm91z4.cloudfront.net/user_3FBnpR8QRNnkjo7QGJ5EgRz9ktw/hf_20261007_220100_ca4a4cf1-3595-4199-ad5d-6c6eac3226ac.png)
4. [Lifestyle campaign photograph](https://d8j0ntlcm91z4.cloudfront.net/user_3FBnpR8QRNnkjo7QGJ5EgRz9ktw/hf_20261007_220102_d8b5aab2-293a-4846-a0fe-b0c76a48d7f1.png)

Generated imagery can support heroes, story sections, banners, and social/editorial uses. Product cards and galleries continue to show the actual images attached to Stripe products. Never depict a generated camera as the precise used item for sale, alter apparent wear/condition, or claim generated lifestyle imagery is a sample photograph from a specific camera. Refresh the framing and backgrounds around existing item photographs first. Actual item-photo retouching would require item-specific references and identity/condition checks.

## Customer experience

### Home and navigation

Create a recognizable header with the new wordmark, shop navigation, search, account access, and an accessible cart count. Use an editorial campaign hero with one clear path to the catalog. Follow it with compact service information, a curated selection of actual Stripe products, category/brand browsing, an editorial story, real reviews when available, newsletter, and footer.

Avoid rendering the entire catalog as the homepage's new-arrivals section. Merchandise a small useful selection of available products while preserving catalog access. Do not fabricate prices, review counts, customer totals, discounts, shipping promises, or warranties. Read existing business copy through CMS where supported and reconcile inconsistent claims before release.

### Catalog

Keep `/shop`, existing category/filter query behavior, search, sorting, and product links. Present a spacious grid with actual photographs, Stripe titles/prices, concise condition/spec information, clear availability, and actionable filters on mobile. Distinguish loading, no matches, empty catalog, and service failure where the existing data contract permits. Never fill a catalog outage with invented merchandise.

Derive available brands and years from the returned Stripe products; synchronize filter state with navigation and URL changes. Honor category/subcategory links and sort new arrivals by `createdAt`, not manufacture year. Product actions must remain discoverable with keyboard focus and touch, not only hover.

### Product details

Retain product slugs and legacy Stripe-ID URLs. Redesign gallery, condition/specs, price, quantity selection, cart/buy actions, genuine reviews, and related products. Display stock conservatively: `stockCount === 0` or `inStock === false` prevents purchase controls, and known stock limits quantity. Preserve server-side price and availability checks as authoritative. Archived one-of-one products retain their URLs and show sold-out state.

### Cart and checkout

Apply the new design to the cart drawer, cart page, and checkout transition/return screens. Preserve existing cart storage, item identities, quantities, and subtotal calculation from Stripe-derived prices. Keep keyboard focus, accessible names, dismiss behavior, loading states, and clear payment-error recovery.

Keep the existing server-created, Stripe-hosted Checkout journey. “Native integration intact” means retaining the existing application-to-Stripe integration; it does not require replacing hosted Checkout with a new embedded payment form. Preserve success and cancellation destinations, existing shipping/promotion settings, and original-product metadata.

### Supporting pages

Carry typography, spacing, colors, image treatment, and navigation across collections, About, journal, contact/repair/help, and policy pages. Preserve working URLs, contact/subscription submissions, policy meaning, and existing CMS fields. Reuse shared styling in account and order views without replacing the order/account backend. Admin functionality remains available and unchanged.

Saved CMS content overrides component defaults. Preserve CMS keys and draft-preview behavior, and inspect the rendered result with saved content so a new layout does not silently show stale assumptions or lose owner-editable fields.

## Backend preservation map

| Contract | Preserve |
| --- | --- |
| Catalog retrieval | `lib/stripe-products.ts`; Stripe products/default prices and metadata |
| Product shape | `lib/products.ts`; existing IDs, prices in cents, images, specs, condition and availability fields |
| Public product API | `GET /api/products`, including `id`, `category`, `featured`, and `search` filters |
| Product URLs | `productPath` / `resolveProductParam` in `lib/seo.ts` |
| Cart | `lib/cart-context.tsx`, `{product, quantity}` items, `measurejoy-cart` key |
| Checkout actions | `startCheckoutSession`, `startSingleProductCheckout`, `getCheckoutSessionStatus` in `app/actions/stripe.ts` |
| Payment destinations | `/checkout/return?session_id=…`, cart/product cancellation routes |
| Webhook | `/api/stripe/webhook`, signature verification, existing order/email/inventory workflow |
| Orders and fulfillment | Stripe Checkout sessions and metadata through `app/actions/orders.ts` and `app/actions/admin.ts` |
| Authentication | ClerkProvider, middleware, sign-in/up, account protections and admin allowlist |
| Supporting services | Existing Supabase CMS/reviews/wishlist/subscriptions and Resend email |
| Search visibility | Canonical routes, product structured data, sitemap and archived product pages |

No schema migration or production Stripe mutation is part of the visual rebuild. Preserve secret handling in the existing environment. Never place secret keys in assets, browser code, documentation, or chat.

## Error handling and validation

Validate catalog and detail screens against live/read-only Stripe-derived public data and the existing Product contract. Cover sold-out and missing-image states, absent optional metadata, and prices in cents. Verify cart quantity changes/removal and persistence; verify request payloads pass original product IDs and never client prices.

Read-only public catalog snapshot on October 7, 2026: `/api/products` returned 63 Stripe-ID records, including 24 with `inStock === true` and a stock count other than zero. No record in that snapshot combined `inStock: true` with `stockCount: 0`. This is an audit snapshot, not a catalog to embed in the application.

Run the project's type checking, lint, and build checks after implementation. Exercise representative mobile and desktop sizes, keyboard navigation, dialogs and focus return, reduced motion, and contrast. Check all preserved public routes and an archived product URL. Compare backend files with the audited base to make preservation reviewable.

Payment, webhook, fulfillment, and account integration tests require the existing secure preview/test environment. Use Stripe test mode for transactional validation; do not create a live charge or send customer communications during testing. If that environment is unavailable, record the exact untested flow and leave production rollout pending.

## Existing issues discovered during read-only audit

These are pre-existing observations, not changes made by this redesign. Investigate separately before launch where they affect purchase correctness:

- Checkout builds inline `price_data.product_data`, while the webhook appears to use returned line-item product IDs when decrementing stock. Original product IDs are stored separately in `metadata.items`. Verify that inventory updates reach the original catalog products.
- Customer order listing invokes a sessions `search` method through an `any` cast; verify the runtime path against the installed Stripe API client.
- `/api/products/category` writes product metadata without an explicit handler-level auth check; examine its actual exposure before any production release.
- The current adapter can expose `inStock: true` together with a zero stock count. The new UI must not present zero stock as purchasable, and server behavior needs verification.
- Product cards, quick view, and link-based Buy Now controls need consistent disabled states for unavailable products. Mobile navigation and cart/quick-view overlays need keyboard focus and dialog behavior verified.
- Existing UI copy advertises a $75 free-shipping threshold, while the checkout actions currently configure unconditional free shipping. Reconcile customer-facing copy with the preserved commerce configuration without inventing a new policy.
- Older documentation and SQL files describe a different auth/order model. Runtime code uses Clerk identity and Stripe sessions; do not rebuild from outdated README assumptions.

## Review and release boundary

The current deliverables are the verified preservation map, visual concept set, and this design proposal. Application implementation, functional testing, a reviewable preview, and production rollout remain to be completed. No production website, Stripe catalog, payment setting, webhook, DNS record, or existing backend has been changed.

After design review, prepare the implementation plan, execute the storefront work in the existing project, and provide a tested preview and change review before production promotion. Do not publish a separate Higgsfield community website as a substitute for the user's existing store.
