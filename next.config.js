const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns", "framer-motion"],
  },
  transpilePackages: ["@react-pdf/renderer"],
  async headers() {
    // ─── Content Security Policy ─────────────────────────
    // Deployed in Report-Only mode first to surface violations via Sentry / browser
    // console without breaking the app. Flip the header key to "Content-Security-Policy"
    // (and remove "-Report-Only") once 24-48h of preview traffic is clean.
    //
    // Notes on chosen sources:
    //   - 'unsafe-inline' on style-src is required by Tailwind / shadcn at runtime;
    //     a nonce-based hardening pass is tracked separately.
    //   - script-src includes Google identity scripts for the Firebase Auth popup.
    //   - connect-src enumerates the Firebase + Sentry + Google APIs the client talks to.
    //   - frame-src allows the Firebase Auth popup origins.
    const csp = [
      "default-src 'self'",
      "script-src 'self' https://apis.google.com https://accounts.google.com https://maps.googleapis.com https://maps.gstatic.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://*.ingest.sentry.io",
      "frame-src https://accounts.google.com https://*.firebaseapp.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  disableServerWebpackPlugin: !process.env.NEXT_PUBLIC_SENTRY_DSN,
  disableClientWebpackPlugin: !process.env.NEXT_PUBLIC_SENTRY_DSN,
});
