/** @type {import('next').NextConfig} */

// Content-Security-Policy — deployed in REPORT-ONLY mode first.
// Browsers will log violations to the console but NOT block anything.
// Review violations for a few days in production, then:
//   1. Tighten this policy based on real violations (remove 'unsafe-inline'
//      etc. if nothing needs them).
//   2. Rename the header below from `Content-Security-Policy-Report-Only`
//      to `Content-Security-Policy` to start enforcing.
const cspDirectives = {
  "default-src": ["'self'"],
  // Clerk, Stripe, Vercel Analytics all inject runtime scripts.
  // 'unsafe-inline' + 'unsafe-eval' kept for now — Next.js ships inline
  // scripts without nonces by default; remove once migrating to nonces.
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://*.clerk.accounts.dev",
    "https://js.stripe.com",
    "https://checkout.stripe.com",
    "https://va.vercel-scripts.com",
  ],
  // Tailwind and Radix emit inline styles at runtime
  "style-src": ["'self'", "'unsafe-inline'"],
  "font-src": ["'self'", "data:"],
  // Product images could come from many CDNs; restrict by protocol only
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "connect-src": [
    "'self'",
    "https://*.clerk.accounts.dev",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.stripe.com",
    "https://checkout.stripe.com",
    "https://generativelanguage.googleapis.com",
    "https://vitals.vercel-insights.com",
    "https://va.vercel-scripts.com",
  ],
  // Stripe Checkout and Clerk sign-in modals load in iframes
  "frame-src": [
    "'self'",
    "https://*.clerk.accounts.dev",
    "https://js.stripe.com",
    "https://checkout.stripe.com",
    "https://hooks.stripe.com",
  ],
  "worker-src": ["'self'", "blob:"],
  "base-uri": ["'self'"],
  "form-action": ["'self'", "https://checkout.stripe.com"],
  "frame-ancestors": ["'self'"],
  "object-src": ["'none'"],
  "upgrade-insecure-requests": [],
}

const cspHeader = Object.entries(cspDirectives)
  .map(([directive, values]) =>
    values.length ? `${directive} ${values.join(" ")}` : directive
  )
  .join("; ")

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // REPORT-ONLY for safe rollout — switch to
          // `Content-Security-Policy` to enforce after reviewing violations
          { key: "Content-Security-Policy-Report-Only", value: cspHeader },
        ],
      },
    ]
  },
}

export default nextConfig
