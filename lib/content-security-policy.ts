/** Per-document CSP. Callers must generate a fresh nonce and dynamically render HTML. */
export function contentSecurityPolicy(nonce: string, development = false): string {
  if (!/^[A-Za-z0-9+/=]+$/.test(nonce)) throw new Error("Invalid CSP nonce.");
  const clerk = ["https://clerk.measurejoy.org", "https://accounts.measurejoy.org", "https://*.clerk.accounts.dev"];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'", `'nonce-${nonce}'`, "'strict-dynamic'",
      ...(development ? ["'unsafe-eval'"] : []),
      ...clerk, "https://challenges.cloudflare.com", "https://*.protect.clerk.com",
      "https://js.stripe.com", "https://*.js.stripe.com", "https://checkout.stripe.com",
      "https://maps.googleapis.com", "https://va.vercel-scripts.com",
    ],
    // Clerk, Radix and animation components generate style attributes at runtime.
    "style-src": ["'self'", "'unsafe-inline'"],
    "font-src": ["'self'", "data:"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "connect-src": [
      "'self'", ...clerk, "https://*.protect.clerk.com:*", "https://clerk-telemetry.com", "https://*.clerk-telemetry.com",
      "https://*.supabase.co", "wss://*.supabase.co",
      "https://api.stripe.com", "https://checkout.stripe.com", "https://maps.googleapis.com",
      "https://m.stripe.com", "https://m.stripe.network", "https://r.stripe.com",
      "https://vitals.vercel-insights.com", "https://va.vercel-scripts.com",
      ...(development ? ["ws://localhost:*", "ws://127.0.0.1:*"] : []),
    ],
    "frame-src": [
      "'self'", ...clerk, "https://challenges.cloudflare.com", "https://*.protect.clerk.com",
      "https://js.stripe.com", "https://*.js.stripe.com", "https://checkout.stripe.com", "https://hooks.stripe.com",
    ],
    "worker-src": ["'self'", "blob:"],
    "base-uri": ["'none'"],
    "form-action": ["'self'", ...clerk, "https://checkout.stripe.com"],
    "frame-ancestors": ["'self'"],
    "object-src": ["'none'"],
    ...(!development ? { "upgrade-insecure-requests": [] } : {}),
  };
  return Object.entries(directives).map(([name, values]) => `${name}${values.length ? ` ${values.join(" ")}` : ""}`).join("; ");
}
