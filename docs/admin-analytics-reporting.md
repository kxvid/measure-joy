# Admin analytics reports

`/admin/analytics` gives existing Measure Joy administrators a read-only GA4 report. Christian is already in the site's admin allowlist; this feature does not add website roles, content editing or infrastructure controls. The page and `/api/admin/analytics?days=30` authorize independently using the existing verified Clerk primary-email allowlist. Unauthorized requests never call Google or read cached reports.

## Reporting connection

The website's measurement tag and its server reporting identity are separate:

- Measurement ID `G-W9W8G08X29` collects consented storefront events.
- Numeric property ID `563411747` selects the reporting dataset.
- `GA4_PROPERTY_ID` and `GA4_SERVICE_ACCOUNT_JSON` are server-only environment variables. Never add `NEXT_PUBLIC_` or commit a downloaded JSON key.

Use a dedicated service account with **Viewer** access to this GA4 property and no Google Cloud project roles. Enable the Google Analytics Data API in its Cloud project. No domain-wide delegation, Ads access, edit roles or additional human accounts are required. The application requests only `https://www.googleapis.com/auth/analytics.readonly`, uses Google's supported authentication library, and sends reports to the fixed Analytics Data API endpoint. It ignores credential-provided token endpoints and impersonation fields.

Keep the key encrypted in Vercel. For a draft preview, scope the credential to the reporting branch rather than all previews. Before publishing, configure Production separately. When rotating, create/securely configure the replacement, verify a read-only report, then revoke the old key. Do not paste key contents into issues, PRs, logs, browser code or customer-facing error messages.

## Data shown

The 7/30/90-day selections end yesterday in `America/Los_Angeles` and compare with the equally long preceding period. Excluding the current partial day makes comparisons more useful. All queries filter to `www.measurejoy.org` and `measurejoy.org` so protected preview traffic is excluded. USD and Los Angeles property metadata are checked before rendering.

Reports include:

- Active users, sessions, page views, measured purchases and purchase revenue.
- Daily traffic and a keyboard-accessible table of exact values.
- Top session sources/mediums, pages and products.
- Product views, additions, purchased units and item revenue; item-scoped metrics are queried separately from event-scoped purchase metrics.

GA4 reflects visitors who allow analytics and can be affected by blocked tags, incomplete browser purchase events, processing delays and Google's privacy thresholds. Recent data can change for 24–48 hours. Empty reports show a distinct “no activity” state; connection, quota, schema and permission errors never appear as fabricated zero sales. Restricted revenue metrics fail explicitly. Sampling, truncation and threshold warnings are carried into the view. Refunds can make revenue negative.

Use Stripe Orders for fulfillment and financial totals. Do not sum daily/source active-user values to infer period-wide unique users, or treat item units as a user conversion funnel. Historical product IDs remain visible when a catalog name is unavailable. For source attribution and the prepared social/email links, see [Traffic sources and campaign links](traffic-attribution.md).

## Limits and verification

There are six fixed report presets, sent in two sequential batches (Google's maximum is five requests per batch), at most 90 daily rows and 10 rows per detail table. Requests use an 8-second timeout and no automatic retry loop. Each server worker caches successful results for 5 minutes and errors for 30 seconds, and coalesces concurrent reads. Browser/API responses remain private and uncached. This is not a real-time dashboard.

Before enabling a new credential, run the six exact presets against the intended property and confirm the response headers/metric combinations, currency/time zone, permissions and production-host filter. A new property may legitimately return no rows until collection has processed. Unit fixtures test contract and UI behavior but do not prove live Google access.

Official references: [Data API quickstart](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart), [batchRunReports request contract](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/batchRunReports), [dimensions and metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema), [response metadata](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/ResponseMetaData), and [data freshness](https://support.google.com/analytics/answer/11198161).
