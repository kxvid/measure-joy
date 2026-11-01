# Vercel readiness audit

Audited 12 October 2026 with the authenticated Vercel plugin, Vercel CLI 63.1.0 and the repository source. This audit's external inspection was read-only. Environment variable **names, scopes and metadata** were inspected with `decrypt=false`; this audit did not retrieve, copy or commit credential values. Later service checks and local catalog checks by the integration team are recorded below. The rebuild deployment evidence below confirms a hosted preview; external services have not passed end-to-end tests where launch blockers remain.

## Follow-up: contact and repair email (12 October 2026)

Contact and repair requests now use server-side FormSubmit with the fixed recipient `christianvelasquez363@gmail.com`. These two routes require **no additional Vercel variables or DNS records**. They share the canonical form identity `https://www.measurejoy.org/`, including from preview deployments; use mocked tests to avoid sending live inquiries from previews. Christian must click **Activate Form** in FormSubmit's email. A single authorized setup request returned the provider's activation-required response, confirming it requested that email. Final inbox delivery remains pending activation.

The form UI distinguishes accepted submissions from requests awaiting activation. Newsletter, review and transactional email still use Resend; their sender-verification requirements remain. Stripe catalog, pricing, checkout, webhook and existing Vercel configuration are unchanged by this form-delivery update. See [public form delivery](./forms.md) for the current contract. The audit below records the earlier pre-launch snapshot, not the subsequent production deployment state.

## Verified deployment target

| Item | Verified value |
| --- | --- |
| GitHub repository | `kxvid/measure-joy` |
| GitHub repository ID | `1122647498` |
| Vercel team | `kahla-labs` |
| Vercel team ID | `team_peVNyHVBUw6QDgOWVfZCaZuY` |
| Vercel project | `v0-y2-k-electronics-storefront` |
| Vercel project ID | `prj_SBMgwpWplG40yiEq3HGwf7rclzEL` |
| Framework / project Node setting | Next.js / `24.x` |
| Current production deployment returned by the project | `dpl_5CCMjKB399XkPt4aRakTqmXmUEwU` |
| State / source / target | `READY` / Git / Production |
| Production branch and commit | `main` / `f43f871b36469a813094d81e5753ac0ae6299480` |
| Deployment created | `2026-07-28T09:08:43.521Z` |
| Deployment region | `iad1` |
| Primary custom domain | `www.measurejoy.org`, verified |
| Apex domain | `measurejoy.org`, verified, redirects to `www.measurejoy.org` |

The project was found by its exact repository ID, then confirmed against deployment Git metadata. The other accessible team (`kovid-rastogis-projects`) returned no project for that repository ID. The older team name remains in some deployment aliases; it is not the current ownership scope.

- [Project dashboard](https://vercel.com/kahla-labs/v0-y2-k-electronics-storefront)
- [Production deployment inspection](https://vercel.com/kahla-labs/v0-y2-k-electronics-storefront/5CCMjKB399XkPt4aRakTqmXmUEwU)
- [Current website](https://www.measurejoy.org)
- [Environment settings](https://vercel.com/kahla-labs/v0-y2-k-electronics-storefront/settings/environment-variables)

## Build and runtime

The CLI resolved the linked project to the exact team/project IDs above. Project inspection and the scoped project API confirm the current command/runtime settings. The last production deployment's build logs agree with them:

| Setting | Evidence |
| --- | --- |
| Build entrypoint | Repository root (`.`) |
| Install command | `bun install` |
| Build command | `bun run build` → `next build` |
| Output directory setting | Next.js default |
| Framework version | Next.js `16.0.10`, Turbopack |
| Build machine | 2 cores, 8 GB, `iad1` |
| Build output | `/vercel/output`; build completed successfully |
| Approximate build-to-ready time | 63 seconds |

The repository initially contained both `package-lock.json` and `pnpm-lock.yaml`, without a `packageManager` or `engines` field. The historical build detected pnpm, then used the configured Bun install and migrated the npm lockfile. Existing quality/security workflows use Node 22; the weekly review workflow uses Node 20. The rebuild now declares `pnpm@11.25.0`. Align the committed lockfile and validation runtime with Vercel before release. The committed `vercel.json` overrides below make the rebuild's install/build commands explicit.

The initial `vercel.json` was `{}`. The rebuild now pins `framework: nextjs`, `installCommand: npx --yes pnpm@11.25.0 install --frozen-lockfile`, and `buildCommand: npm run build` in source. These deploy-time overrides replace the historical Bun commands for this branch; no application dependency versions were changed. No application cron configuration, explicit function duration, function memory, function region or Edge runtime override was found. Next.js server actions and route handlers require server execution; this project is not a static export. The project has **Fluid Compute enabled**, default function region `iad1`, and elastic concurrency enabled. Its build queue configuration is `SKIP_NAMESPACE_QUEUE`. No runtime setting was changed during the audit.

Git integration is explicitly connected to GitHub `kxvid/measure-joy` (`1122647498`), production branch `main`, with deployment creation enabled and Git fork protection enabled. Automatic system-environment exposure is enabled.

## Environment inventory

“Present” means a project variable entry was returned for that scope. It does **not** prove the value is valid, unexpired, correctly permissioned, or attached to an isolated nonproduction service. The endpoint reported `hiddenProductionEnvCount: 0`. The project-filtered shared-variable API returned no assignments (count 0, no next page).

| Variable | Production | Preview | Development | Purpose / action |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Present | Present | Present | Production Clerk instance is shared across scopes; localhost and Vercel preview origins are rejected. |
| `CLERK_SECRET_KEY` | Present | Present | Present | Clerk server authentication; a matching development instance is required for preview account testing. |
| `ADMIN_EMAILS` | Present | Present | Present | Server admin email allowlist. |
| `STRIPE_SECRET_KEY` | Present | Present | Present | Product catalogue, checkout and admin operations. Production has a separate entry from Preview/Development. Development initially returned an empty catalog; the user explicitly authorized the live catalog and checkout in the rebuild preview. See preview decision below. |
| `STRIPE_WEBHOOK_SECRET` | **Absent** | **Absent** | **Absent** | Required to verify payment-completion webhooks. Configure the secret for each environment's endpoint before testing fulfillment. |
| `NEXT_PUBLIC_APP_URL` | **Absent** | **Absent** | **Absent** | Canonical SEO and email origin. Set Production to `https://www.measurejoy.org`; native checkout now derives a verified return origin from the request and Vercel environment. |
| `NEXT_PUBLIC_SUPABASE_URL` | Present | Present | Present | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Present | Present | Present | Retained Supabase browser/SSR client support. |
| `SUPABASE_SERVICE_ROLE_KEY` | Present | Present | Present | Server database access for CMS, reviews, wishlist and subscribers. Never expose to client code. |
| `RESEND_API_KEY` | Present | Present | Present | Existing transactional/newsletter emails and new public inquiries. Read-only domain lookup found no verified sending domain; live delivery is blocked. |
| `RESEND_FROM_EMAIL` | Absent | Absent | Absent | Optional inquiry sender override; blank uses `Measure Joy <orders@measurejoy.org>`. |
| `GOOGLE_AI_API_KEY` | **Absent** | **Absent** | **Absent** | Existing admin copywriter/categorizer/rationalizer features. Not required to display the storefront. |

The checked-in `.env.example` covers the variables used by this implementation, including Clerk's SDK configuration. Populate a gitignored `.env.local` privately. Public-prefixed variables are client-visible; they must never hold server credentials. Rebuild after changing public variables because their values are embedded in the browser build. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

Other configured keys, with no active source reference found during the audit:

- All three scopes: `ADMIN_ACCESS_CODE`, `NEXT_PUBLIC_VERCEL_URL`, `NEXT_PUBLIC_SITE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`, `POSTGRES_HOST`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_SECRET_KEY`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `STRIPE_MCP_KEY`.
- All three scopes through separate production/nonproduction entries: `STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Development only: `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`.

`NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_VERCEL_URL` do not satisfy source references to `NEXT_PUBLIC_APP_URL`. Do not remove integration-managed or legacy keys without checking their owners and consumers outside this repository.

The API labels the listed values as `encrypted` and flags several private credentials as `readable-secret`. This was a metadata finding, not a credential exposure in this audit. Review their Secret/Config classification in Vercel's environment settings, with separate production and nonproduction service credentials. No classification or value was changed.

## Preview availability

Git previews already exist for this project. The most recent listed preview is `dpl_HkiKNUmhpGf8xyKYXFu97NZnSHd2`, state `READY`, from branch `codex/scan-codebase-4vc3qf` and commit `665393fd46b90d9f3de048deed1419cf15c66006`:

[Existing preview](https://v0-y2-k-electronics-storefront-rjkr3wsq6.vercel.app)

This is a previous implementation, not the current rebuild. A new rebuild preview was not created by this audit.

Vercel Authentication is enabled with `all_except_custom_domains`; password protection and trusted-IP protection are disabled. Team members can inspect protected deployment URLs with their authorized Vercel session. Public custom domains are excepted from that Vercel authentication layer. Keep the protection configuration intact; use authorized preview access for review.

### Rebuild preview decision and checks

The user explicitly chose **“Use live catalog and checkout”** for the rebuild preview. The integration team privately used the authorized live Stripe credentials locally and verified **68 visible catalog products, 26 available**. Purchases from that preview can use live payments; automated verification must not submit a payment or alter live inventory.

After pushing `codex/measurejoy-storefront-redesign`, branch-scoped Preview overrides for `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` were created successfully. They use the existing production Stripe credentials as explicitly requested; other preview branches retain their existing configuration. Vercel deployment `dpl_3GgxKv1DGycFPJcFZwdMue1Ryon7` reached `READY` for commit `61bd1fc54e1706fb794633461fdee18a2eb1bb92`. The protected hosted homepage and shop rendered successfully. Final review corrections follow in the same draft [PR #361](https://github.com/kxvid/measure-joy/pull/361); verify its newest deployment before release.

Before claiming functional preview completion:

1. Configure a matching Stripe webhook endpoint/signing secret. The environment inventory above still has no `STRIPE_WEBHOOK_SECRET`; opening checkout alone does not prove order fulfillment.
2. Verify checkout returns to the actual preview. The rebuilt native checkout derives a verified request origin; the earlier production fallback finding has been corrected in source. Vercel system URL values are hostnames and must be normalized. See [system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables).
3. Supply matching Clerk development-instance keys for nonproduction. The configured production instance rejects localhost/preview; account, order, wishlist and admin sign-in cannot yet be verified there. The redesign preserves their authentication contracts.
4. Confirm Supabase Preview/Development access does not write to customer production data. The same variable entries span all three scopes; service isolation has not been demonstrated. Read-only checks confirmed the form-related schema only.
5. Verify the Measure Joy sender domain in Resend, or provide a correctly scoped key and verified sender. The configured account has only `kahlalabs.com` with verification `not_started`, and no `measurejoy.org` domain. No live email was sent.

## Services and operational gaps

| Capability | Source and platform finding | Remaining verification |
| --- | --- | --- |
| Authentication | Clerk provider/middleware; account/admin pages require sign-in; admin actions use the email allowlist. Clerk keys are present. | The same production-instance keys serve all scopes and reject localhost/preview origins. Preview needs matching development-instance credentials; real sign-in and allowlist checks remain blocked. |
| Payments and fulfillment | Stripe hosts checkout; catalogue/inventory live in Stripe. `/api/stripe/webhook` verifies a signature, gates on paid state and handles completion/delayed success. Native price IDs and legacy metadata preserve original inventory IDs. | Missing project signing secret blocks verified fulfillment. Stripe endpoint registration and delivery history were not accessed. |
| Inquiry and transactional email | Resend key is present. Existing senders are `orders@measurejoy.org` and `hello@measurejoy.org`. Public inquiries reuse Resend with an optional sender override. | Read-only `GET /domains` returned only `kahlalabs.com`, status `not_started`, with no additional pages. `measurejoy.org` is absent. Live delivery is blocked; no email was sent. |
| Database | Supabase service client supports CMS, profiles, reviews, wishlist and subscriber records. SQL scripts/migrations exist. | Read-only OpenAPI and zero-row HEAD requests confirmed `subscribers`, `reviews` and `profiles` with expected columns and text user IDs compatible with Clerk. RLS, wishlist/CMS coverage and write isolation remain unverified; no schema or database writes were made. |
| File storage | Product image URLs come from Stripe; local images are in `public/`. No Vercel Blob SDK/token or Supabase storage upload flow was found. | No additional storage credential is required by the inspected storefront. |
| AI administration | Direct Google Generative AI SDK; hardcoded `gemini-2.0-flash`; Google key absent. No Vercel AI SDK/Gateway integration. | Restore/verify the provider configuration only if these admin tools are needed; model availability was not tested. AI Gateway would be a separate migration. |
| Analytics | `@vercel/analytics` and `<Analytics />` are included. Project API confirms Web Analytics enabled with data; scoped CLI query returned 167 pageviews and 66 visitors for 5–12 October 2026 UTC. | Speed Insights is enabled in project settings but reports `hasData: false`; its SDK was not found in source. |
| Cron jobs | Project API returns an empty cron definition list. No `crons` in `vercel.json` or application scheduler found. GitHub has scheduled quality/security/review workflows. | GitHub schedules are not Vercel Cron Jobs; no application cron secret is currently required. |
| Vercel webhooks | Scoped CLI API returned an empty list. | No platform deployment webhooks were found. This is distinct from Stripe's application webhook registration, which remains unverified. |
| Drains / Connect | Scoped CLI API returned empty drain and connector lists. | No project drains or Vercel Connect connections were found. Existing external services are directly SDK-configured. |

The authenticated runtime-error endpoint returned one error group for invalid Stripe product `prod_null` on `/product/[id]` (4 occurrences in the returned group, last seen 12 October 2026). Its first-seen date was older than the requested 24-hour window, so do not interpret that group count as a verified daily rate. Invalid product identifiers should lead to a safe not-found page without becoming valid catalogue entries.

The integration fixed the inherited original-product inventory mismatch: native checkout uses existing default-price IDs, and legacy sessions resolve original IDs through session metadata. Fulfillment now waits for paid state, persists per-product stock targets, uses Stripe idempotency keys, skips completed markers and returns 500 on stock-update failures for retry. Order history uses supported paginated listing with server ownership checks. Catalog listing paginates and reports outages as 503 rather than a successful empty array. Isolated mocked commerce tests cover these paths, including inventory marker cleanup and lost finalization responses; see [production route map](./production-route-map.md).

New checkout sessions are limited to 20 distinct items, leaving room within Stripe’s 50-key metadata limit for inventory retry markers and shipping updates. Long product IDs use bounded hashed marker suffixes. Finalization atomically clears those markers and records completion. These changes are not an atomic reservation system. Simultaneous distinct checkout sessions can still oversell the same inventory, and email/network ambiguity needs provider-level idempotency for strict exactly-once delivery. Missing webhook configuration still blocks live fulfillment verification. See [public form delivery](./forms.md) for the separate form delivery and schema evidence.

## Release conditions

The visual rebuild can be reviewed separately from the inherited service gaps. A production commerce release should have evidence for all of the following:

- A new successful preview of the exact rebuild commit, using the verified team/project IDs above.
- Consistent package-manager/build settings and passing type/build checks on the intended Node runtime.
- Matching webhook signing secrets configured for the production and chosen preview Stripe mode, original catalogue inventory matching verified, and repeated payment events handled safely.
- Checkout return URLs remain within the intended environment; invalid IDs and out-of-stock items fail safely.
- Clerk sign-in/account/admin checks, Supabase-backed reads/writes, and authorized Resend delivery verified in a suitable test environment.
- Existing Web Analytics preserved; verify the rebuilt preview has no new runtime failures and choose whether to instrument the enabled-but-empty Speed Insights capability.
- Production build staged and verified before assigning live custom domains. Promoting a preview can rebuild with production variables; a previously tested preview is not evidence that the production build is identical. See [deployment promotion](https://vercel.com/docs/deployments/promoting-a-deployment).

No production deployment, promotion, domain change, environment mutation, database migration, purchase, webhook registration or email delivery was performed by this audit. The plugin's compact project response omitted several settings, and its webhook/analytics/drain/connector reads returned permission or not-found errors. The mapped read-only CLI fallback, explicitly scoped to the same verified project/team, succeeded and supplies the current findings above. This audit did not broaden the project scope or change account permissions.


## October 23 security release

The earlier inventory limitation above is superseded by the durable reservation and fulfillment ledger in `lib/inventory.ts`. Stripe remains the source of product, price and stock values; PostgreSQL coordinates holds and external-write recovery. Follow `docs/security-remediation.md` for release sequencing, migration checks and rollback constraints. Production uses patched Next/Clerk, nonce-enforced CSP and shared request quotas. `instrumentation.ts` emits a private startup Node version and refuses runtimes below the October security baseline; no public diagnostics endpoint is added.
