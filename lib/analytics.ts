/** Optional commerce measurement. Never include contact data or checkout URLs. */
export type AnalyticsConsent = {
  version: 1;
  analytics: boolean;
  marketing: boolean;
};
export type AnalyticsItem = {
  item_id: string;
  price: number;
  quantity: number;
};
export type CommerceEvent = {
  currency: string;
  value: number;
  items: AnalyticsItem[];
  transaction_id?: string;
  shipping?: number;
  tax?: number;
};
export const CONSENT_KEY = "measurejoy-privacy-v1";
export const CONSENT_EVENT = "measurejoy:privacy";
export function analyticsConfig() {
  const ga4 = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "";
  const meta = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
  return {
    ga4: /^G-[A-Z0-9]+$/.test(ga4) ? ga4 : "",
    meta: /^\d{5,25}$/.test(meta) ? meta : "",
  };
}
export function parseConsent(
  raw: string | null,
  globalPrivacyControl = false,
): AnalyticsConsent {
  const denied: AnalyticsConsent = {
    version: 1,
    analytics: false,
    marketing: false,
  };
  if (globalPrivacyControl) return denied;
  try {
    const value = JSON.parse(raw || "null");
    return value?.version === 1
      ? {
          version: 1,
          analytics: value.analytics === true,
          marketing: value.marketing === true,
        }
      : denied;
  } catch {
    return denied;
  }
}
export function currentConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return parseConsent(null);
  try {
    return parseConsent(
      localStorage.getItem(CONSENT_KEY),
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl,
    );
  } catch {
    return parseConsent(null);
  }
}
export function publicAnalyticsPath(path: string): boolean {
  return /^\/(?:$|shop\/?$|cart\/?$|checkout\/?$|product\/[a-zA-Z0-9_-]+\/?$|collections(?:\/[a-zA-Z0-9_-]+)?\/?$|journal(?:\/[a-zA-Z0-9_-]+)?\/?$|about\/?$|shipping\/?$|returns\/?$)/.test(
    path,
  );
}
export function safePageLocation(href: string): string | null {
  try {
    const u = new URL(href);
    if (!["https:", "http:"].includes(u.protocol)) return null;
    return `${u.origin}${publicAnalyticsPath(u.pathname) ? u.pathname : "/checkout/return" === u.pathname ? "/checkout/return" : "/"}`;
  } catch {
    return null;
  }
}
export function safeReferrer(referrer: string): string {
  try {
    const url = new URL(referrer);
    return ["https:", "http:"].includes(url.protocol) ? url.origin : "";
  } catch {
    return "";
  }
}
const campaignFields = [
  ["utm_source", "campaign_source"],
  ["utm_medium", "campaign_medium"],
  ["utm_campaign", "campaign_name"],
  ["utm_content", "campaign_content"],
  ["utm_term", "campaign_term"],
  ["utm_id", "campaign_id"],
] as const;
export function campaignParameters(href: string): Record<string, string> {
  try {
    const u = new URL(href);
    const result: Record<string, string> = {};
    for (const [query, name] of campaignFields) {
      const value = u.searchParams.get(query);
      if (value && /^[a-z0-9_-]{1,60}$/i.test(value)) result[name] = value;
    }
    return result;
  } catch {
    return {};
  }
}
export type TrafficAttribution = {
  referrer: string;
  campaign: Record<string, string>;
};
/** Keep only bounded labels and an origin, never a raw URL or browsing history. */
export function rememberTrafficAttribution(
  previous: TrafficAttribution | null,
  href: string,
  referrer: string,
): TrafficAttribution | null {
  try {
    const url = new URL(href);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      !publicAnalyticsPath(url.pathname)
    )
      return previous;
    const campaign = campaignParameters(href);
    if (previous && !Object.keys(campaign).length) return previous;
    return { referrer: previous?.referrer ?? safeReferrer(referrer), campaign };
  } catch {
    return previous;
  }
}
/** Explicitly clear fields absent from a new campaign instead of mixing campaigns. */
export function campaignContext(
  campaign: Record<string, string> = {},
): Record<string, string | undefined> {
  return Object.fromEntries(
    campaignFields.map(([, name]) => [name, campaign[name]]),
  );
}
export function safeMetaPage(href: string, referrer = ""): boolean {
  try {
    const u = new URL(href);
    if (!publicAnalyticsPath(u.pathname) || u.search || u.hash) return false;
    if (referrer) {
      const r = new URL(referrer);
      if (r.search || r.hash || !publicAnalyticsPath(r.pathname)) return false;
    }
    return true;
  } catch {
    return false;
  }
}
export function commerceEvent(
  items: Array<{
    product: { id: string; priceInCents: number };
    quantity: number;
  }>,
): CommerceEvent | null {
  const valid = items
    .filter(
      ({ product, quantity }) =>
        /^prod_[A-Za-z0-9]+$/.test(product.id) &&
        Number.isSafeInteger(product.priceInCents) &&
        product.priceInCents >= 0 &&
        Number.isSafeInteger(quantity) &&
        quantity > 0,
    )
    .slice(0, 20);
  if (!valid.length) return null;
  return {
    currency: "USD",
    value:
      valid.reduce((sum, x) => sum + x.product.priceInCents * x.quantity, 0) /
      100,
    items: valid.map((x) => ({
      item_id: x.product.id,
      price: x.product.priceInCents / 100,
      quantity: x.quantity,
    })),
  };
}
type TrackingWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean;
};
const sentPurchases = new Set<string>();
export function trackCommerce(
  name:
    | "view_item"
    | "add_to_cart"
    | "remove_from_cart"
    | "begin_checkout"
    | "purchase",
  event: CommerceEvent | null,
) {
  if (!event || typeof window === "undefined") return false;
  try {
    if (
      !publicAnalyticsPath(location.pathname) &&
      location.pathname !== "/checkout/return"
    )
      return false;
    const consent = currentConsent();
    const config = analyticsConfig();
    const target = window as unknown as TrackingWindow;
    const gaReady =
      consent.analytics &&
      config.ga4 &&
      target.gtag &&
      target[`ga-disable-${config.ga4}`] !== true;
    if (
      !gaReady &&
      (!consent.marketing ||
        !config.meta ||
        !target.fbq ||
        !safeMetaPage(location.href, document.referrer))
    )
      return false;
    if (name === "purchase") {
      if (
        !event.transaction_id ||
        !/^mj_[a-f0-9]{32}$/.test(event.transaction_id)
      )
        return false;
      const key = `measurejoy-purchase:${event.transaction_id}`;
      if (sentPurchases.has(key)) return false;
      try {
        if (sessionStorage.getItem(key)) return false;
        sessionStorage.setItem(key, "1");
      } catch {
        /* In-memory dedupe still applies. */
      }
      sentPurchases.add(key);
    }
    if (gaReady)
      target.gtag!("event", name, {
        ...event,
        send_to: config.ga4,
        page_location: safePageLocation(location.href),
        page_referrer: safeReferrer(document.referrer),
        page_title: name === "purchase" ? "Order confirmed" : "Measure Joy",
      });
    const metaNames = {
      view_item: "ViewContent",
      add_to_cart: "AddToCart",
      begin_checkout: "InitiateCheckout",
      purchase: "Purchase",
    };
    if (
      consent.marketing &&
      config.meta &&
      target.fbq &&
      safeMetaPage(location.href, document.referrer) &&
      name in metaNames
    )
      target.fbq(
        "trackSingle",
        config.meta,
        metaNames[name as keyof typeof metaNames],
        {
          currency: event.currency,
          value: event.value,
          content_type: "product",
          contents: event.items.map((x) => ({
            id: x.item_id,
            quantity: x.quantity,
            item_price: x.price,
          })),
          content_ids: event.items.map((x) => x.item_id),
        },
        event.transaction_id ? { eventID: event.transaction_id } : {},
      );
    return true;
  } catch {
    return false; /* Measurement must never interrupt shopping. */
  }
}
