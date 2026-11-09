# Traffic sources and campaign links

The Analytics page’s “Where visits come from” table reports GA4 session source/medium: the website, search engine, app or tagged campaign that brought a measured visit to Measure Joy. It is not a list of individual visitors.

## Links Christian can use

Copy the links in **Admin → Analytics → Share links** into the corresponding social profile, post description or newsletter. They lead directly to the canonical shop and contain consistent campaign labels. Creating or copying a link does not post it to any platform.

Use `instagram`, `tiktok`, `facebook` or `youtube` as the source with `social` as the medium; use `newsletter` with `email` for email drops. The prepared profile links use campaign `profile`; the newsletter link uses `weekly_drop`. To distinguish specific drops or posts, change the campaign/content labels to a short lowercase slug such as `november_13_drop` or `camera_reel_01`. Keep source and medium consistent across posts.

The accepted fields are `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` and `utm_id`. Values must be 1–60 letters, digits, underscores or hyphens. Use source, medium and campaign together. Never put a person’s name, email, phone, order number or other private data in campaign labels. Do not tag internal links between store pages: campaign links identify traffic arriving from outside the site.

## What the measurement can and cannot know

- Analytics loads and sends events only after permission; Global Privacy Control disables optional measurement.
- Referring websites are measured by origin only. Referrer paths, query strings and fragments are excluded.
- Campaign labels are forwarded separately from the sanitized page URL. Other URL parameters, including checkout tokens and search text, are not forwarded as page locations.
- A sanitized landing campaign is retained in memory during client-side browsing so allowing analytics on a later page can still identify that arrival. No extra attribution cookie or persistent storage is written before consent. A full reload or new tab before consent can lose this in-memory context.
- Social apps, private messaging, bookmarks and browser privacy features may hide the referring site. Without a tagged link, these visits can appear as `(direct) / (none)`; the site cannot reconstruct information the browser did not provide.
- GA4 chooses the session attribution according to its own rules. The source table contains measured visits, not all traffic or Stripe’s complete order ledger.
- Reports show complete Los Angeles days ending yesterday and may change as Google processes recent events. A test visit today will not immediately appear in this table.

Meta Pixel remains deferred. This attribution setup uses GA4 and does not enable advertising personalization.

References: [Google campaign URL guidance](https://support.google.com/analytics/answer/10917952), [GA4 campaign/referrer configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config).
