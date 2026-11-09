# Commerce measurement

GA4 property **MeasureJoy** (`563411747`), web stream `16306109402`, measurement ID `G-W9W8G08X29` uses Los Angeles time and USD. The web stream URL is `https://www.measurejoy.org`. Enhanced Measurement, Google Signals and user-provided data collection were verified off on November 9, 2026. Do not enable automatic history, form, search or outbound-link measurement: those events bypass the application's URL sanitization.

Only `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is configured in Vercel Production. Development and Preview should remain blank to exclude test traffic. There is no second GTM installation. The public ID is not a credential.

The client loads Google's tag only after analytics consent, respects Global Privacy Control, and offers a persistent Privacy choices control. Advertising consent stays denied. Optional analytics is disabled on account, admin, contact and repair pages. Global sanitized page context and `send_page_view:false` must precede `gtag('js')`, as the real Google SDK otherwise emits an automatic initial event with the raw URL. Per-event overrides alone are insufficient.

Manual events:

- `page_view`: public shopping/editorial pages; query strings and fragments removed, referring URL reduced to its origin.
- `view_item`: real product ID and current displayed price.
- `add_to_cart` / `remove_from_cart`: actual user quantity delta after stock bounds; hydration and stock refresh stay silent.
- `begin_checkout`: after the existing action returns a validated Stripe checkout destination, using the refreshed bag. No extra sessions are created.
- `purchase`: only for an explicitly requested, browser-owned, paid checkout. The server verifies the opaque HTTP-only checkout capability and Clerk identity before reading line items. Output contains product IDs, net item values, tax, shipping and a one-way transaction identifier; no raw Stripe session ID, contact details or form contents.

Purchases are best-effort browser measurement, not the financial ledger. Consent, ad blockers, browser closure, delayed payment, an expired capability or an optional provider read failure can omit a purchase. Reloads are deduplicated, and acknowledging the paid session clears the checkout capability. Use Stripe as the source of truth for sales and revenue. No live test payment or additional checkout was created for this implementation.

Meta setup was deferred at the user's request. Its public ID remains unset, and no Meta script loads. The prepared integration intentionally excludes query-bearing pages and checkout returns; do not claim Meta purchase attribution without a separately verified implementation and updated privacy disclosure.

## Campaign links

Use consistent lower-case labels; these three bounded fields are the only forwarded campaign parameters:

- Instagram: `https://www.measurejoy.org/shop?utm_source=instagram&utm_medium=social&utm_campaign=weekly_drop`
- TikTok: `https://www.measurejoy.org/shop?utm_source=tiktok&utm_medium=social&utm_campaign=weekly_drop`
- Weekly email: `https://www.measurejoy.org/shop?utm_source=newsletter&utm_medium=email&utm_campaign=weekly_drop`

Never place customer names, emails, order IDs or other personal information in campaign labels. GA4's acquisition reports show the channel labels; ecommerce reports use the standard shopping events. Collection will begin after the code is published and a visitor consents.

## Verification

Unit tests cover consent, GPC, URL/referrer sanitization, bounded campaign fields, actual cart deltas, ownership/payment checks and purchase deduplication. Browser verification used the real Google tag while intercepting all collection requests: no requests before consent or after revocation, and outgoing page/product events had sanitized URLs and no marker from the test query. Production CSP remains enforced with fresh nonces and no unsafe script evaluation.
