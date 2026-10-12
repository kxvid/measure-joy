# Public form delivery

## Submission map

| Surface | Server path | Result |
| --- | --- | --- |
| Contact | `POST /api/contact` | FormSubmit email to Christian after activation, with visitor reply-to |
| Repair, restoration, cleaning, film, quote | `POST /api/repairs` | FormSubmit email with the complete service inquiry after activation; does not book a service |
| Newsletter / welcome popup | `POST /api/subscribe` | Existing subscriber upsert, notification to Christian, then visitor welcome email |
| Product review | `submitReviewAction` | Existing authenticated review save, notification to Christian, best-effort profile sync |
| Search | Client navigation | No customer message is submitted |
| Checkout, payment, account forms | Existing Stripe / Clerk / commerce paths | Existing transactional behavior preserved |

All owner notifications go to `christianvelasquez363@gmail.com`. The delivery recipient is fixed in server code; the same address is publicly available as a direct-contact fallback. Submitted `to`, `from`, or other unknown fields cannot change it. Existing order/shipping email behavior in `lib/emails.ts` is outside this change.

## Runtime configuration

- Contact and repair requests use FormSubmit through a server-only AJAX adapter. No API key, new Vercel variable, or sending-domain DNS change is required for these two forms. Christian must activate the form from the email sent to `christianvelasquez363@gmail.com`.
- `RESEND_API_KEY`: still required for newsletter/review notifications and existing transactional email. Missing configuration fails those notification paths explicitly; contact and repair requests do not depend on this key.
- `RESEND_FROM_EMAIL`: optional server-only verified sender override for newsletter/review notifications. Default: `Measure Joy <orders@measurejoy.org>`, matching the existing order sender. Its domain must be verified in Resend.
- `NEXT_PUBLIC_APP_URL`: optional canonical origin. Same-origin form requests also work without it.
- `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL`: optional Vercel system origins, also allowed explicitly.
- Existing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: required for newsletter storage and reviews. No tables or schema changes are introduced.

Both contact and repair submissions use the fixed FormSubmit recipient and the same `_url` and `Referer`: `https://www.measurejoy.org/`. The actual contact/repair page is included as a normal content field. Keeping the canonical form identity consistent avoids creating a separate activation flow for each route or deployment. Preview and local submissions also target this live recipient: use mocked tests rather than submitting test inquiries from previews.

On 12 October 2026, one owner-authorized setup request received FormSubmit's explicit activation-required response: it reported sending an email with an **Activate Form** link. Inbox arrival and activation have not been independently confirmed. According to [FormSubmit's help](https://formsubmit.co/help), submissions are held until activation and retained for 30 days. The UI shows this pending state and offers Christian's direct email for time-sensitive help. Unknown provider failures never become a successful submission.

Newsletter, review and order email delivery still use Resend and require a verified sender. Their existing domain-verification dependency is separate from this FormSubmit setup. Read-only Supabase checks previously confirmed subscribers, reviews and profiles with the expected columns; this change makes no database or schema mutations.

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

Generate a UUID when starting a new submission. Reuse it when retrying unchanged content after a network error. Generate a new UUID when editing submitted content or starting another inquiry. FormSubmit does not document provider-level idempotency; a retry after an ambiguous network failure can create a duplicate inquiry. Request tokens are included for identification, not a cross-instance deduplication guarantee. Newsletter/review notifications still use [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), which suppresses duplicate emails for the same key and payload for 24 hours; changed content with the same key receives HTTP 409.

Contact/repair success: HTTP 200 for accepted submissions or HTTP 202 for activation pending, with `{success:true,status:"accepted"|"activation_pending",message}`. The UI checks HTTP success and `success === true` and distinguishes the status:

- `accepted`: FormSubmit accepted the submission. This does not prove inbox delivery or that Christian has read it.
- `activation_pending`: FormSubmit explicitly says activation is required and that it sent the activation email. The request is queued under the provider's retention policy; the UI must not claim it was emailed to Christian.

FormSubmit can return JSON with a `text/html` content type and string booleans (`"true"`, `"false"`). The adapter parses and validates the response body. Only the recognized activation-required response can turn `success:false` into the explicit pending state; other false, malformed, HTTP or network failures return an error.

Failure: `{success:false,error,fieldErrors?}`. Codes: 400 validation/honeypot/JSON; 403 origin; 409 changed Resend retry; 413 body too large; 415 media type; 429 rate limit (with `Retry-After`); 502 upstream submission failure; 503 unavailable configuration/storage. Upstream error bodies and customer content are not exposed in error logs.

Newsletter success additionally returns `welcomeSent`. The UI should only promise a welcome email when true. A database failure returns an error before any mail. If subscriber storage succeeds but owner delivery fails, the response has `success:false,subscriptionSaved:true`; retrying the same input is safe because storage is an upsert and delivery is idempotent.

Reviews retain their existing server action signature. The result adds `notificationDelivered` and an optional `warning`. After a review is saved, a notification failure returns `success:true,notificationDelivered:false` with a warning explicitly saying the review is saved but Christian could not be notified. Display that warning without inviting another review insert. There is no durable notification queue in this change; this secondary failure needs manual follow-up through the saved review/admin data.

## Abuse controls and verification

HTTP bodies are capped at 16 KiB while reading the stream, including when `Content-Length` is missing or inaccurate. A hidden `website` honeypot must stay empty. Contact/repair details are sent as JSON fields to FormSubmit with its table template and the visitor email as reply-to. Provider control fields are set only by the server; arbitrary submitted recipients, CCs, URLs and webhooks are never forwarded. Resend notifications still escape every visitor-supplied value in HTML and include plain text. Contact/repair use `_captcha:false` to keep the existing in-page experience, with the validation, honeypot and throttle below retained.

Limits allow at most five attempts per ten minutes per email and, on Vercel, per trusted `x-vercel-forwarded-for` address across public form endpoints. Reviews are limited per authenticated user. This bounded in-process limiter is best effort: a cold start or a different server instance has independent counters. Distributed bot protection should be applied in the deployment firewall if traffic requires it. The trusted header is documented in [Vercel request headers](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for). Origin checks protect browser cross-site submissions; they do not authenticate non-browser callers.

Run `pnpm test` with Node 24 after `pnpm install --frozen-lockfile` (the repository pins pnpm 11.25.0). Tests run the real route handlers, validators, FormSubmit adapter, Resend SDK and Supabase client, intercepting all outbound HTTP with fixtures. Clerk identity and Next cache invalidation are supplied by test-only adapters. There are no live third-party calls, secrets, or database mutations in the test run. Tests cover fixed recipient and reply-to, canonical form identity, validation, parsing, origins, body limits, honeypot, limits, activation-pending and accepted states, provider false/malformed/HTTP/network failures, unchanged Resend retry behavior, subscription partial failures, and review notifications.

## Catalog administration

`POST /api/products/category` and `POST /api/categorize` enforce the same Clerk identity and `ADMIN_EMAILS` allowlist as the admin layout, with verified email required. Missing identity returns 401; signed-in non-admin or cross-site requests return 403. Requests must be same-origin JSON under 16 KiB. Category identifiers and fields are validated before any Stripe mutation.

Bulk categorization moved from a mutating GET to explicit JSON POST `{bulk:true,force:false}`. GET returns 405 without calling Stripe. The existing admin category screen uses the new POST contract. Single-product categorization remains `{productId?,name,description?}`, including the existing rule fallback when AI is unavailable.

## Saved finds

The storefront hook `components/storefront/use-saved-finds.ts` keeps guest browser saves and signed-in account wishlists separate. While Clerk identity is loading, it does not read or write the guest list. Guest state uses the existing `measurejoy-saved` localStorage key; signed-in state uses the authenticated Supabase wishlist actions. There is no automatic merge.

`toggle(id)` returns `{success,added?,error?}`; the caller must await it before showing a success message. The hook also returns `savedIds`, `ready`, `loading`, `pendingIds`, `error`, `source`, `refresh()`, and `clearError()`. Persistent writes complete before visible IDs change; failure leaves the prior list intact. Same-window consumers receive the `measurejoy-saved-change` event and guest lists also respond to storage events from other tabs. Account wishlist now uses the same hook, with visible load/removal failures and placeholders for products absent from the active catalog.
