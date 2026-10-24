# Security Remediation Implementation Plan

**Goal:** Resolve the verified security audit findings and release a tested storefront.
**Architecture:** Stripe retains catalog, prices and stock. Supabase supplies private coordination, reservations, fulfillment history and durable request quotas. Nonce-based CSP and input/output boundaries protect the existing UI.
**Tech Stack:** Next.js, Clerk, Stripe, Supabase PostgreSQL, Vercel, pnpm.
**Spec:** `outputs/measurejoy-security-audit-2026-10-23.md` and its supporting reports.

## Constraints

- Preserve existing design, native Stripe checkout/pricing, admin ownership checks and Christian's form delivery.
- Never expose credentials or customer records in tests/logs. No live test payments or unsolicited messages.
- Test production artifacts before assigning the live domain; database migrations must be backward compatible.
- Fail closed on ambiguous inventory or security-control errors; provide a reconciliation path.

## Review focus

- Concurrent last-item checkouts and delayed/duplicate webhooks must not oversell or repeat stock decrements.
- Network failure after a Stripe write must not release stock or replay an obsolete target.
- Malicious catalog/address strings must remain inert text.
- Cross-instance submissions must share quotas; anonymous DB writes must fail.
- CSP must preserve Clerk login, product images, Stripe checkout and responsive UI.

## Tasks

- [x] Dependencies: update compatible patched releases, remove stale npm lock, fail-closed pnpm audits in PR/scheduled workflows; verify fresh audits, typecheck and build.
- [x] Application boundaries: shared safe JSON serializer, escaped emails, admin origin/media/body validation, remove debug surface, cache bounded catalog reads and enforce CSP; add payload regression tests.
- [x] Commerce: reservation/fulfillment RPCs and ledger, serialization barriers, checkout expiry and retry reconciliation, remove public buyer email; reproduce concurrent and interrupted flows in tests.
- [x] Forms/database: private atomic `consume_rate_limit(p_key,p_limit,p_window_seconds)` RPC; async `consumeRateLimit(identity,maximum,windowSeconds)` helper; shared form/user quotas, restrictive grants, fixed function search paths; verify role permissions and database failures.
- [ ] Platform: enable repository alerts/scanning and scheduled workflow, stage targeted Vercel protections, verify patched Node via private telemetry; no blind credential revocation.
- [ ] Release: integrated tests, clean dependency audit, fresh review, migration tests, staged production build, browser/HTTP checks, promotion and observability. Record any provider-controlled limitations explicitly.

## Verified progress

Implementation and independent review are complete. Both live migrations, webhook event coverage, repository protections and the targeted edge quota are applied. The staged production runtime failed the patch baseline (Node24.21.0); the supported Node22 probe also failed (22.23.2). Production promotion, deployed browser/checkout smoke, final inventory cutover and checkout-gate activation remain pending Vercel managed-runtime patch availability. See `docs/security-remediation.md` for exact evidence and safe resume steps.
