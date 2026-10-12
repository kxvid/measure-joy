# Measure Joy production rebuild implementation plan

**Goal:** Apply the approved brand and storefront to the real GitHub Next.js application, deliver public submissions directly to Christian, and account for Vercel deployment requirements.
**Architecture:** Retain native Stripe products/prices/checkout/webhooks, Clerk accounts, Supabase content/reviews/wishlist, and Resend. Reuse the approved typography, vector identity, campaign images and storefront components. Public forms use server validation and provider-confirmed delivery to a fixed recipient.
**Spec:** User approval of the published MeasureJoy Sites design plus the October 12 request to rebuild the real codebase and connect all forms.

## Constraints
- Stripe remains the source of truth for products, prices and availability. No secondary catalog or production fixtures.
- Keep existing URL, SEO, customer account, cart, fulfillment and administration contracts.
- All public customer submissions notify christianvelasquez363@gmail.com; no fake success or email-app-only flow.
- Preserve the approved ivory, ink, coral and acid palette; Space Grotesk + Instrument Serif; actual item photos remain authoritative.
- Work on the existing dedicated codex branch. Reviewable PR and preview deployment precede a live production cutover.
- Never print or commit secret values.

## Work packages
- [x] Root: shared chrome/theme/fonts/assets, home/shop/product/cart, public support/repair UI, brand studio.
- [x] Forms agent: contact/repair APIs, subscriber/review notifications, idempotency, input validation, mocked delivery tests.
- [x] Commerce agent: full route map and preservation audit, original Stripe price references, correct fulfillment identifiers, safe preview return origins, tests.
- [x] Vercel agent: exact linked project, variables/scopes, runtime/features, deployment runbook and sanitized environment template.
- [x] Integrate: dynamic editorial/collection routes and existing account/admin surfaces with consistent typography and navigation.
- [ ] Verify: meaningful tests, types/build, desktop/mobile browser flows, origin boundaries, provider errors, stock gating, full route coverage.
- [ ] Publish: commit/push draft PR, attach, Vercel preview, report concrete production configuration blockers.

## Review focus
Missing/inactive Stripe prices must never yield purchasable $0 items; archived items retain useful pages. Form provider errors must preserve input and never claim delivery. Checkout rereads price/inventory server-side and keeps signed-in identity server-derived. A test/preview checkout must return to its own origin. Admin/Clerk routes preserve existing authorization.

## Verification evidence — 12 October 2026
- Production build completed successfully with Next.js 16.0.10 and the committed lockfile.
- TypeScript passes; 75 automated boundary/regression tests pass; edited source lint reports zero errors (26 existing/native-image warnings).
- Public desktop/mobile previews checked, including repair validation, actual Stripe product page and adding a camera to the bag. Account authentication cannot be validated on localhost/preview with the configured production-only Clerk instance.
- Read-only live Stripe catalog: 68 listings, 26 available. User explicitly authorized live catalog and checkout for this branch's preview.
- Resend account has no verified sending domain, so real delivery remains a setup blocker; all delivery tests use mocks. No test emails or payments were sent.
- New `storefront` CMS section controls approved hero, story, about, announcement and footer copy. Existing newsletter CMS remains connected. Retired legacy presentation sections remain stored without seeding or overwriting the database.
- `vercel.json` pins pnpm 11.25.0 frozen installation instead of the historical Bun project override. New CI runs types/tests on Node 24.
