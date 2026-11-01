# October 23, 2026 security remediation

## Release controls

Stripe remains the source for camera listings, prices, stock metadata and payment state. Supabase now provides private reservation/fulfillment coordination and shared request quotas. The visual design and native checkout remain intact.

- Next.js 16.4.3, Clerk 6.39.8, React/DOM 19.3.1 and compatible dependency patches replace the vulnerable graph. The checked-in pnpm lock is authoritative; the stale npm lock was removed. Production and development dependency audits returned zero known advisories at remediation time.
- Node 24.22.1 is pinned for development/CI. `instrumentation.ts` logs the deployed Node version privately and refuses runtimes below the October security baseline. A `24.x` project setting alone is not patch evidence.
- Per-request script nonces enforce CSP. Production permits neither inline scripts without a nonce nor `unsafe-eval`; inline styles remain necessary for the UI. Clerk/Stripe origins are explicitly supported. HTML renders dynamically so nonce-bearing documents are not shared through static caching.
- JSON-LD uses HTML-safe serialization. Transactional-email text and URL values are escaped. The old authentication diagnostic page is removed and admin email previews are sandboxed.
- Admin JSON mutations validate origin, media type and actual streamed size. User-facing provider failures and application logs avoid upstream payloads and customer data. Copy/category edits no longer replay stale stock metadata.
- Catalog data shares bounded caches; caller `fresh` flags cannot force a full Stripe scan. Catalog and account-order APIs have durable quotas. Cached order history is keyed by the authenticated owner; detailed order access still verifies ownership.
- Forms use a service-role-only atomic PostgreSQL quota shared across instances. Public subscriber insertion is disabled. Private data tables have reduced client grants. Missing quota service or trusted production address fails closed.
- Checkout uses durable holds and serialized stock writes, plus browser-owned resume capabilities and shared creation quotas. Buyer email is removed from public session status. See [inventory operations](./inventory-operations.md) for cutover, recovery and direct Stripe stock-edit constraints.

## Deployment sequence

1. Verify local tests, PostgreSQL concurrency/role checks, TypeScript, lint, dependency audits and build.
2. Apply `security_form_controls` then `durable_commerce_inventory` to the verified production project. Confirm RLS and service-role-only RPC access. Leave the new checkout gate closed.
3. Enable expired/failed-session events on the existing signed Stripe webhook. Keep its signing secret and URL unchanged.
4. Stage a production build without the live domain. Verify private runtime patch telemetry, CSP nonce behavior, catalog, forms, responsive pages and auth redirects.
5. Promote the verified build, ensure old deployment URLs remain protected and old invocations are drained, then scan/reconcile legacy open/pending/unfinished sessions. Enable the checkout gate only after this is clean.
6. Verify one non-payment checkout flow and explicitly expire its session; no charge or customer notification is required. Confirm stock is unchanged and its hold releases.
7. Verify CI/main, repository scanning, daily audit activation and post-release errors. Record exact deployment/commit and runtime evidence in the release report.

## Operations and rollback

Do not roll back to code that bypasses the reservation coordinator while holds exist. Pause checkout using the documented gate, drain requests, and reconcile provider state before changing stock or deploying incompatible commerce code. Additive database tables must remain for retry history; do not delete them to recover a deployment.

GitHub dependency alerts, secret scanning and push protection should remain enabled. Scheduled and PR audits fail on advisories, unavailable scanners or malformed output. PostgreSQL concurrency checks run against a disposable local CI database; they cannot target a remote or non-test database. Existing lint warnings are separate from security findings and do not indicate a clean-code claim.

No credential compromise was established by the audit. Review provider activity and rotate affected credentials through a coordinated replacement if evidence warrants it; a blind revocation would interrupt checkout. PHP is not part of this storefront and no PHP runtime was introduced.

## Release status — October 24, 2026 UTC

Implementation commit `c9baa75cbc82184c5f93fac27518094aad60c9de` passed 163 local tests with zero skips, the production build, TypeScript, lint (zero errors; 83 existing warnings), both dependency audits, and all three GitHub PR checks. [PR #363](https://github.com/kxvid/measure-joy/pull/363) remains a draft because production promotion is blocked.

The protected production build `dpl_A1pQcu1PzCKSaVoVhj3NGGsJeKe2` logs actual Node **24.21.0**, below required **24.22.1**, and the startup guard correctly refuses to serve. An isolated protected Node 22 probe logged **22.23.2**, below **22.23.4**; that probe was deleted. Vercel supports selecting a major line, not a patch. Its [October security bulletin](https://vercel.com/kb/bulletin/node-js-security-advisory) confirms that managed-runtime patch rollout is ongoing; automatic inbound WAF mitigation does not cover malicious fetched responses. Do not remove the guard or promote a failing build. Resume staging after a fresh runtime log proves a patched version, then perform browser checks and the inventory cutover below.

Already applied independently: both additive database migrations; subscriber client-write revocation; four-event Stripe webhook coverage; enforced form-only edge quota (30 POSTs per IP per 600 seconds); GitHub secret scanning, push protection, resumed Dependabot security updates, active scheduled workflows, and required main-branch checks with force pushes/deletion disabled. Vercel project build/install settings now match pnpm. The application-level quotas and CSP are implemented but are not yet serving production.

The public domain continues to serve original deployment `dpl_ExUrJGFX4xtNxQ2w4ogwXSiVrZ7K`. The new checkout gate remains closed with zero new ledger checkouts; the original storefront does not use that gate. No payment was made, no customer message was sent, and no Stripe key was revoked. No PHP application was found. Supabase's remaining no-policy RLS notices are intentional service-only tables; its password-protection warning concerns unused Supabase Auth, while the storefront uses Clerk.

A final follow-up review tightened historical Stripe replay adoption to the exact verified ledger scope and masked technical checkout errors. The final complete suite passed **174 tests, zero failures/skips**, with a successful production build and lint at zero errors (83 existing warnings). Local browser checks verified catalog hydration, product details, repairs and cart pricing under the enforced CSP. Production Clerk keys correctly reject localhost, so deployed authentication and no-payment checkout validation remain required after the provider runtime is patched.
