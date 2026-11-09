# Measure Joy storefront conversion implementation plan

**Goal:** Implement the first release from the approved meeting recommendations: make products visible immediately, strengthen accurate buyer trust, improve repair enquiries, and measure the buying funnel.

**Architecture:** Preserve the current Next.js storefront, Stripe inventory and durable checkout coordinator. Server-render initial catalog data; keep existing client filters. Optional GA4/Meta tracking loads only after consent and valid configuration. Repair photos travel through the existing protected form-delivery path with strict payload limits.

**Tech stack:** Next.js 16, React 19, TypeScript, Stripe, Clerk, Supabase, existing form delivery.

**Spec:** The user's November 9 meeting checklist, the prioritized recommendations in this chat, and their “implement please” approval. The user also authorized creating missing GA4/Meta resources.

## Constraints

- Preserve visual identity, Stripe source of truth, Christian's routing, startup guard, nonce CSP and deployment protection.
- No customer test email, valid live repair submission, live payment, inventory mutation or additional live test checkout.
- Do not publish unverified sales counts, discount offers, pickup logistics, sample photos or new service guarantees.
- Keep legacy repair inputs compatible. New service names describe enquiries, not confirmed bookings.
- No tracking before consent; no personal/contact data, order capability or raw query strings in analytics.
- Build on current main; preserve old damaged iCloud checkout.

## Work

- [x] Catalog/trust: initial Stripe catalog on shop/home, shop canonical, plain metadata, compact mobile layout, accurate shipping/warranty links, qualifying tested badges, weekly newsletter copy. Verify initial HTML and filters.
- [x] Repair: readable mobile labels, clear service groups and optional bounded image attachments with server validation; preserve quotas, origin checks, idempotency and routing. Test invalid/oversized files, compatibility and delivery mocking.
- [x] Analytics: create account resources where authenticated access permits, consent-aware GA4/Meta loader, product/cart/checkout events and owner-verified paid purchase events with duplicate protection. Test denied consent, sensitive URLs, repeat/pending/unpaid status and missing configuration.
- [ ] Verification: relevant unit tests, full TypeScript/lint/test suite, build and browser checks at mobile/desktop sizes; independent review. Prepare a PR and protected deployment for review.

## Deferred inputs

Sample photos, Merchant Center connection, pickup operations, starting service prices, abandoned-cart sending and branded mailbox setup require separate assets/account setup or operational decisions. The first release does not fabricate these. Verify existing discount configuration before advertising 10% off.

## Implementation notes

GA4 property and production ID are configured; Meta is deferred at the user's request. Repair photo requests use the existing Resend sender with documented attachment support and the same Christian recipient; text-only requests retain FormSubmit. Browser test collection requests were intercepted, with no live checkout, payment, form submission or email sent. Tests: 222 passed, zero failed, one external PostgreSQL integration skipped; TypeScript/build pass; lint zero errors and 83 existing warnings; production dependency audit clean. Protected deployment/PR verification follows.
