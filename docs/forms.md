# Public form delivery

## Submission map

| Surface | Server path | Result |
| --- | --- | --- |
| Contact | `POST /api/contact` | Email to Christian, with visitor reply-to |
| Repair, restoration, cleaning, film, quote | `POST /api/repairs` | Complete service inquiry email to Christian; does not book a service |
| Newsletter / welcome popup | `POST /api/subscribe` | Existing subscriber upsert, notification to Christian, then visitor welcome email |
| Product review | `submitReviewAction` | Existing authenticated review save, notification to Christian, best-effort profile sync |
| Search | Client navigation | No customer message is submitted |
| Checkout, payment, account forms | Existing Stripe / Clerk / commerce paths | Existing transactional behavior preserved |

All owner notifications go to `christianvelasquez363@gmail.com`. This recipient exists only in server code. Submitted `to`, `from`, or other unknown fields cannot change it. Existing order/shipping email behavior in `lib/emails.ts` is outside this change.

## Runtime configuration

- `RESEND_API_KEY`: required server-only delivery credential. Missing configuration fails publicly with HTTP 503; it never simulates a send.
- `RESEND_FROM_EMAIL`: optional server-only verified sender override. Default: `Measure Joy <orders@measurejoy.org>`, matching the existing order sender. Its domain must be verified in Resend.
- `NEXT_PUBLIC_APP_URL`: optional canonical origin. Same-origin form requests also work without it.
- `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL`: optional Vercel system origins, also allowed explicitly.
- Existing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: required for newsletter storage and reviews. No tables or schema changes are introduced.

The Vercel audit found `RESEND_API_KEY` configured for development, preview and production. A subsequent read-only `GET /domains` check with that configured account returned only `kahlalabs.com` with `status: not_started` and no additional pages. `measurejoy.org` is absent and there is no verified sending domain. **Live delivery is blocked until the operator verifies the Measure Joy domain or supplies a key/sender for a verified sending domain.** No credentials were printed or changed. No live email or production database write was used for verification. Read-only Supabase OpenAPI and zero-row HEAD requests confirmed that subscribers, reviews, and profiles exist with the expected columns; review and profile user identifiers are text and are compatible with Clerk IDs.

## API contract

All HTTP endpoints require `Content-Type: application/json` and a matching `Origin` header. They return JSON with `Cache-Control: no-store`.

Contact:

```json
{
  "name": "Alex Camera",
  "email": "alex@example.com",
  "topic": "Camera advice",
  "message": "Could you help me choose a camera?",
  "website": "",
  "requestToken": "dd15e062-7e16-4b34-a25f-9f035d7dce54"
}
```

Repair:

```json
{
  "service": "repair",
  "brand": "Canon",
  "model": "PowerShot SD1000",
  "issues": ["Lens stuck/jammed"],
  "description": "The lens will not retract after switching off.",
  "name": "Alex Camera",
  "email": "alex@example.com",
  "phone": "",
  "preferredContact": "email",
  "consent": true,
  "website": "",
  "requestToken": "ed52ba77-ea69-4bb7-bc26-2089d727d2c7"
}
```

`service`: `repair`, `restoration`, `cleaning`, `film-dev`, or `quote`. `preferredContact`: `email` or `phone`; selecting phone requires at least seven digits. Consent must be the boolean `true`. Name: 100 characters; topic/model: 120; brand: 80; message/description: 10–5,000; issues: up to 12 strings of at most 100. Name, topic, camera fields, and issue labels must be single lines. Email validation and whitespace normalization happen on the server.

Newsletter: `{email, source?: "newsletter" | "welcome_popup", website?: "", requestToken?: UUID}`. Token omission is supported for older clients; a stable hash of normalized email and source is then used.

Generate a UUID when starting a new submission. Reuse it when retrying unchanged content after a network or delivery error. Generate a new UUID when editing submitted content or starting another inquiry. [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys) suppresses duplicate emails for the same key and payload for 24 hours, including across server instances. Changed content with the same key receives HTTP 409; this asks the client to start a new request. A retry after 24 hours can send another email.

Success: HTTP 200, `{success:true,message}`. The UI must check both HTTP success and `success === true`. For contact/repair, this means Resend accepted the email with a message ID. It does not prove final inbox placement or that the recipient has read it.

Failure: `{success:false,error,fieldErrors?}`. Codes: 400 validation/honeypot/JSON; 403 origin; 409 changed retry; 413 body too large; 415 media type; 429 rate limit (with `Retry-After`); 502 upstream delivery failure; 503 unavailable configuration/storage. Upstream error bodies and customer content are not exposed in error logs.

Newsletter success additionally returns `welcomeSent`. The UI should only promise a welcome email when true. A database failure returns an error before any mail. If subscriber storage succeeds but owner delivery fails, the response has `success:false,subscriptionSaved:true`; retrying the same input is safe because storage is an upsert and delivery is idempotent.

Reviews retain their existing server action signature. The result adds `notificationDelivered` and an optional `warning`. After a review is saved, a notification failure returns `success:true,notificationDelivered:false` with a warning explicitly saying the review is saved but Christian could not be notified. Display that warning without inviting another review insert. There is no durable notification queue in this change; this secondary failure needs manual follow-up through the saved review/admin data.

## Abuse controls and verification

HTTP bodies are capped at 16 KiB while reading the stream, including when `Content-Length` is missing or inaccurate. A hidden `website` honeypot must stay empty. HTML escapes every visitor-supplied value; plain text is included. Reply-to is the visitor email; sender and recipient remain controlled by the server.

Limits allow at most five attempts per ten minutes per email and, on Vercel, per trusted `x-vercel-forwarded-for` address across public form endpoints. Reviews are limited per authenticated user. This bounded in-process limiter is best effort: a cold start or a different server instance has independent counters. Distributed bot protection should be applied in the deployment firewall if traffic requires it. The trusted header is documented in [Vercel request headers](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for). Origin checks protect browser cross-site submissions; they do not authenticate non-browser callers.

Run `npm test` with Node 22.15+ after `npm ci`. Tests run the real route handlers, validators, Resend SDK and Supabase client, intercepting all outbound HTTP with fixtures. Clerk identity and Next cache invalidation are supplied by test-only adapters. There are no live third-party calls, secrets, or database mutations in the test run. Tests cover delivery recipient and reply-to, escaping, validation, parsing, origins, body limits, honeypot, limits, stable retry keys, explicit provider failures, subscription partial failures, and review notifications.

## Catalog administration

`POST /api/products/category` and `POST /api/categorize` enforce the same Clerk identity and `ADMIN_EMAILS` allowlist as the admin layout, with verified email required. Missing identity returns 401; signed-in non-admin or cross-site requests return 403. Requests must be same-origin JSON under 16 KiB. Category identifiers and fields are validated before any Stripe mutation.

Bulk categorization moved from a mutating GET to explicit JSON POST `{bulk:true,force:false}`. GET returns 405 without calling Stripe. The existing admin category screen uses the new POST contract. Single-product categorization remains `{productId?,name,description?}`, including the existing rule fallback when AI is unavailable.

## Saved finds

The storefront hook `components/storefront/use-saved-finds.ts` keeps guest browser saves and signed-in account wishlists separate. While Clerk identity is loading, it does not read or write the guest list. Guest state uses the existing `measurejoy-saved` localStorage key; signed-in state uses the authenticated Supabase wishlist actions. There is no automatic merge.

`toggle(id)` returns `{success,added?,error?}`; the caller must await it before showing a success message. The hook also returns `savedIds`, `ready`, `loading`, `pendingIds`, `error`, `source`, `refresh()`, and `clearError()`. Persistent writes complete before visible IDs change; failure leaves the prior list intact. Same-window consumers receive the `measurejoy-saved-change` event and guest lists also respond to storage events from other tabs. Account wishlist now uses the same hook, with visible load/removal failures and placeholders for products absent from the active catalog.
