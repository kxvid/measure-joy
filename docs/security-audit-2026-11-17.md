# November 17, 2026 security audit follow-up

## Scope and source evidence

Base: `dc3424cd988924deeeb2edab5dd672f7c77a75bc` on `main`.
Branch: `codex/security-audit-2026-11-17`.

[Audit run 44136289788](https://github.com/kxvid/measure-joy/actions/runs/44136289788)
reported one moderate production dependency advisory and one additional high
development dependency advisory. The production security-header check passed.
The separate production ZAP scan completed with seven warning categories,
zero `FAIL-NEW` alerts, and 63 passes. Its warnings deliberately fail the job.
Those seven rule IDs expand to ten non-informational alert types in the JSON
artifact: four medium and six low. Eleven further types are informational.
This does not establish a breach or successful exploit.

## Next.js update

- Upgrade `next` and `eslint-config-next` from exactly 16.4.3 to exactly 16.4.5.
- Regenerate the authoritative pnpm lockfile with pnpm 11.25.0.
- Replace only the existing exact Next package release-age exceptions with
  16.4.5 entries. Keep the minimatch overrides and all existing compatibility
  patches. Do not use wildcard exceptions or disable package-policy checks.

[GHSA-mfr8-8qww-v76h](https://github.com/vercel/next.js/security/advisories/GHSA-mfr8-8qww-v76h)
affects Next.js 16.3.0 through 16.4.4; 16.4.5 is patched. Its exploit requires a
root-parameter-reading `use cache` function called both directly and through
`unstable_cache`, with overlapping initial cache fills.

Source inspection found no `use cache`, `cacheComponents`, or `rootParams` in
application code/configuration. Existing `unstable_cache` calls wrap public
catalog reads in `lib/stripe-products.ts` and owner-keyed reads in
`app/actions/orders.ts`; the orders cache receives the authenticated user ID.
The advisory's required combination was not found. That reduces the observed
applicability but does not justify retaining an affected package or establish
the contents of every deployed artifact.

## Picomatch remains unresolved

[GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) covers
picomatch through 4.0.7 and listed no patched release when checked on November 17.
Repeated attacker-controlled extglob patterns can cause regular-expression
denial of service. The referenced [upstream PR #194](https://github.com/micromatch/picomatch/pull/194)
is incomplete and explicitly leaves an exponential case; it is not a safe
replacement for a published fix.

The base lockfile contains picomatch 2.3.2 through Next's ESLint plugin,
fast-glob, and micromatch, and 4.0.5 through TypeScript ESLint/import-resolver
tooling, tinyglobby, and fdir. No direct app import or public interface accepting
glob patterns was found. The production dependency audit is the independent
check of production scope; an all-dependency advisory is not removed merely by
being development-only.

Do not suppress this advisory, force a different matcher behind picomatch's API,
or install the incomplete upstream parser patch. Keep the required full audit
failing until a complete fix or separately reviewed dependency replacement is
available. Existing read-only CI permissions, disposable test database and
timeouts remain in place.

## Production ZAP findings

These findings belong to the deployed site, not this unpromoted branch. No scan
rules or failure thresholds are changed by this patch.

| Alert | Follow-up before claiming resolution |
| --- | --- |
| Cross-domain JavaScript inclusion (10017) | Verify the precise scripts against the Clerk/Stripe/analytics integrations and nonce policy. |
| Missing X-Content-Type-Options (10021) | Recheck the exact optimized-image response and caching path; source already sets `nosniff` for `/:path*`. |
| Large redirect response (10044) | Inspect product 308 response bodies and verify no private content is included. |
| CSP wildcard directive and inline styles (10055) | The wildcard finding is `img-src https:`; JSON also flags `style-src 'unsafe-inline'`. Inventory image origins and test Clerk/Radix/runtime styling before narrowing either directive. |
| Cross-domain configuration (10098) | Distinguish deliberately public assets from authenticated/API responses; validate the actual CORS behavior. |
| Missing subresource integrity (90003) | Evidence identifies Clerk's CDN `clerk.browser.js`, with a nonce but no integrity attribute. Do not hardcode a hash for an unpinned response or break dynamic authentication/payment scripts. |
| Missing/invalid cross-origin isolation (90004) | JSON flags COEP and COOP as well as CORP. Validate policies per resource and test provider frames/popups before enforcing globally. |

A read-only follow-up GET reproduced the exact optimized image's missing
`nosniff`: status 200, `Content-Type: image/png`, attachment disposition, and
Vercel cache HIT. The homepage did return `nosniff`. In a separately authorized
preview, compare cold/warm-cache GET responses and generated routing before
adding any scoped edge header. A second source rule alone is not proof that a
managed CDN response has changed. The retained ZAP artifact ZIP has SHA-256
`3b55cfe8e11018b6f4a4ef8a7ae2b9f4a46f4f3a6afe959f27d6907000cab092`.

## Release controls

[PR #363](https://github.com/kxvid/measure-joy/pull/363) merged November 1 at
`16ab15a6c997e63fe6a06541a355b04ff2be30d2`. Its later PR body records Node 24.22.2
runtime verification. The old October 24 runtime-blocked paragraph in
`security-remediation.md` is historical, not evidence of today's runtime.

Read-only Vercel inspection on November 17 found the canonical domain on
`dpl_EgXW9V6Kd6VMHzxpngspudeTjf4U`, commit
`7d94bb4b8395c774f9a64151b61ecfa2455f7248`. Actual runtime logs at 17:23 UTC
reported `Node v24.22.3; patched=true`. The runtime blocker is superseded;
these observations do not prove today's inventory reconciliation, checkout-gate
state or old-deployment drain status. No claim is made that this branch is live.

Preserve the Node startup guard, enforced CSP, durable inventory coordinator,
checkout gate, and [inventory cutover/rollback procedure](./inventory-operations.md).
Required checks include `verify`, `Dependency audit (production)`, and
`Dependency audit (all)`. No bypass or risk acceptance is implied by this patch.

The user authorized publishing the branch to GitHub. To preserve the separate
deployment hold, `vercel.json` sets `git.deploymentEnabled` to `false` for the
exact branch `codex/security-audit-2026-11-17`. Per
[Vercel's documented branch controls](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled),
unspecified branches remain enabled. GitHub Actions and required checks are
unchanged. A future authorized preview from this branch requires changing this
branch-specific setting.

No merge, deployment, production configuration change, provider write, live
checkout, or secret retrieval is part of this task. After dependency blockers
are resolved, a separately authorized release still needs exact-build runtime,
authentication, CSP, inventory and non-payment checkout verification. A prior
deployment's success does not verify this patch.

## Validation

Validated locally on macOS arm64 with Node 24.22.1 and pnpm 11.25.0:

| Check | Verified result |
| --- | --- |
| Frozen lockfile installation | Passed; existing package-policy verification and compatibility patches applied. |
| Production dependency audit | Passed, exit 0; zero known advisories at all severities. |
| Full dependency audit | Failed as expected, exit 1; one high picomatch advisory, zero moderate/critical/low. No suppression added. |
| TypeScript (`tsc --noEmit`) | Passed. |
| ESLint | Passed with zero errors and 80 warnings. |
| Full regression suite | 270 passed, zero failures, zero skips, including real PostgreSQL inventory concurrency/fencing/role checks and ESLint glob compatibility. |
| Production build | Passed on Next.js 16.4.5 using inert test placeholders; no live provider credentials. This does not verify real authentication, checkout or service connectivity. |
| Diff whitespace validation | Passed. |

The build emitted catalog/sitemap 401 responses from the intentionally invalid
test credential, admin dynamic-render notices, the middleware convention
deprecation, and two Edge instrumentation warnings. It still exited successfully.
These logs are retained and must not be described as successful live catalog,
sign-in, or payment validation.

Database tests used a dedicated loopback-only PostgreSQL 17 cluster and a test
database, not a hosted/production database. The lockfile update also deduplicates
Next's caniuse-lite and an ESLint dependency's semver onto versions already
present in the base lock; it does not perform a general dependency upgrade.

Evidence is retained locally in `outputs/`: installation, typecheck, lint,
test and build logs, both machine-readable audit reports and exit statuses,
and the original ZAP artifact/summary. These files are not application assets.
Full-audit and production-response findings remain explicit blockers; this is
a tested dependency patch, not approval to merge or deploy.

Independent GPT-6 Astra review at Ultra reasoning checked advisory applicability,
production evidence, lockfile consistency and the final diff; no blocking code
findings were raised. Its review does not waive the unresolved full-audit and
production-response findings.
