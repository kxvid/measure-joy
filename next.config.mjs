/** @type {import('next').NextConfig} */

// A fresh enforced CSP nonce is set by middleware for each dynamic document.
const nextConfig = {
  images: {
    // Optimize images (WebP/AVIF, srcset, lazy). Product photos are served
    // from Stripe; local /public images need no remote pattern.
    remotePatterns: [
      { protocol: "https", hostname: "files.stripe.com" },
    ],
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
        ],
      },
    ]
  },
}

export default nextConfig
