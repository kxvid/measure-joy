"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  analyticsConfig,
  campaignParameters,
  CONSENT_EVENT,
  CONSENT_KEY,
  currentConsent,
  publicAnalyticsPath,
  safeMetaPage,
  safePageLocation,
  safeReferrer,
  type AnalyticsConsent,
} from "@/lib/analytics";
import "./privacy-controls.css";

type Pixel = ((...args: unknown[]) => void) & {
  queue?: unknown[][];
  callMethod?: (...args: unknown[]) => void;
  loaded?: boolean;
  version?: string;
  push?: Pixel;
};
type TagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: Pixel;
  _fbq?: Pixel;
  [key: `ga-disable-${string}`]: boolean;
};
export function CommerceAnalytics({ nonce }: { nonce?: string }) {
  const path = usePathname();
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [show, setShow] = useState(false);
  const config = analyticsConfig();
  const lastGaPage = useRef<string | null>(null);
  const lastMetaPage = useRef<string | null>(null);
  useEffect(() => {
    function sync() {
      setConsent(currentConsent());
    }
    sync();
    try {
      setShow(
        !localStorage.getItem(CONSENT_KEY) &&
          !(navigator as Navigator & { globalPrivacyControl?: boolean })
            .globalPrivacyControl,
      );
    } catch {
      setShow(true);
    }
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    if (!consent) return;
    const target = window as unknown as TagWindow;
    const publicPage = publicAnalyticsPath(path) || path === "/checkout/return";
    function script(id: string, src: string) {
      if (document.getElementById(id)) return;
      const el = document.createElement("script");
      el.id = id;
      el.src = src;
      el.async = true;
      if (nonce) el.nonce = nonce;
      document.head.append(el);
    }
    if (config.ga4) {
      target[`ga-disable-${config.ga4}`] = !consent.analytics || !publicPage;
      if (consent.analytics && publicPage) {
        if (!target.gtag) {
          target.dataLayer = target.dataLayer || [];
          // Google's queue API requires Arguments objects, not arrays.
          target.gtag = function () {
            // eslint-disable-next-line prefer-rest-params
            target.dataLayer!.push(arguments);
          };
          target.gtag("consent", "default", {
            analytics_storage: "granted",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
          });
          // Set global defaults before js/config: Google can otherwise emit its
          // own initial event using the raw URL before event overrides apply.
          target.gtag("set", {
            send_page_view: false,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            page_location: safePageLocation(location.href),
            page_referrer: safeReferrer(document.referrer),
            page_title: "Measure Joy",
          });
          target.gtag("js", new Date());
          target.gtag("config", config.ga4, {
            send_page_view: false,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            page_location: safePageLocation(location.href),
            page_referrer: safeReferrer(document.referrer),
            page_title: "Measure Joy",
          });
          script(
            "measurejoy-ga4",
            `https://www.googletagmanager.com/gtag/js?id=${config.ga4}`,
          );
        }
        target.gtag("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
        target.gtag("set", {
          page_location: safePageLocation(location.href),
          page_referrer: safeReferrer(document.referrer),
          page_title: "Measure Joy",
        });
        if (lastGaPage.current !== path) {
          lastGaPage.current = path;
          target.gtag("event", "page_view", {
            page_location: safePageLocation(location.href),
            page_title: "Measure Joy",
            ...campaignParameters(location.href),
            send_to: config.ga4,
          });
        }
      } else {
        lastGaPage.current = null;
        target.gtag?.("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }
    }
    const metaAllowed =
      consent.marketing && safeMetaPage(location.href, document.referrer);
    if (config.meta && metaAllowed) {
      if (!target.fbq) {
        const pixel: Pixel = function (...args) {
          if (pixel.callMethod) pixel.callMethod(...args);
          else pixel.queue!.push(args);
        };
        pixel.queue = [];
        pixel.loaded = true;
        pixel.version = "2.0";
        pixel.push = pixel;
        target.fbq = pixel;
        target._fbq = pixel;
        pixel("set", "autoConfig", false, config.meta);
        pixel("consent", "grant");
        pixel("init", config.meta);
        script(
          "measurejoy-meta",
          "https://connect.facebook.net/en_US/fbevents.js",
        );
      }
      target.fbq("consent", "grant");
      if (lastMetaPage.current !== path) {
        lastMetaPage.current = path;
        target.fbq("trackSingle", config.meta, "PageView");
      }
    } else {
      lastMetaPage.current = null;
      target.fbq?.("consent", "revoke");
    }
    window.dispatchEvent(new Event("measurejoy:analytics-ready"));
  }, [consent, path, nonce, config.ga4, config.meta]);
  function choose(analytics: boolean, marketing: boolean) {
    const next: AnalyticsConsent = { version: 1, analytics, marketing };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    } catch {
      /* Consent remains in memory only; tracking fails closed without storage. */
    }
    setConsent(currentConsent());
    setShow(false);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }
  if (!config.ga4 && !config.meta) return null;
  return (
    <>
      <button
        className="privacy-settings"
        type="button"
        onClick={() => setShow(true)}
      >
        Privacy choices
      </button>
      {show && (
        <section className="privacy-banner" aria-label="Optional cookies">
          <strong>A little choice about cookies.</strong>
          <p>
            With your permission, we measure shopping activity
            {config.meta ? " and use Meta to measure advertising" : ""}.
            Essential checkout features work either way.{" "}
            <a href="/privacy">Privacy policy</a>
          </p>
          <div>
            <button onClick={() => choose(false, false)}>Essential only</button>
            {config.ga4 && (
              <button onClick={() => choose(true, false)}>
                Allow analytics
              </button>
            )}
            {config.meta && (
              <button onClick={() => choose(true, true)}>Allow all</button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
