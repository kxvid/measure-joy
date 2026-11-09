# Admin analytics reporting

User request: after publishing PR 393, create a separate draft PR for Christian's GA4 reporting dashboard inside Measure Joy admin. User clarified analytics reports only; no writing/content/infrastructure controls. Do not merge or publish this new PR without a later instruction.

- Add an authorized read-only reporting boundary using the existing verified Clerk email allowlist. No credentials or provider errors may enter the client.
- Use a dedicated Google identity with GA4 property Viewer permission and analytics.readonly scope. Keep credentials encrypted on the server; no billing or advertising features.
- Show last 7/30/90 complete Los Angeles dates, compared with the preceding period; unique users/sessions/views/purchases/revenue, daily trend, traffic sources, pages and item performance. Distinguish unavailable/missing/empty data. GA4 measures consented traffic and is not Stripe's financial ledger.
- Bound report presets, rows, timeouts and cache keys; coalesce requests; preserve threshold/sampling warnings and never disguise access/metric restrictions as zero revenue.
- Test authorization, provider contract, failures, date boundaries, parsing and UI states; verify live read-only API when credentials are available, then create a draft PR with exact limitations.
