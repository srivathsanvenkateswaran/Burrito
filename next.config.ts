import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Workers static assets, not Vercel: emit a plain HTML/CSS/JS
  // tree in `out/` instead of relying on a Node server or Vercel's adapter.
  output: "export",

  // No image optimization server in a static export; ship the originals.
  images: { unoptimized: true },

  // Keep asset-style URLs extensionless without a trailing slash (`/assets/eth`,
  // `/docs/charts/risk`), which next export emits as sibling `*.html` files
  // (`assets/eth.html`, `docs/charts/risk.html`) rather than `*/index.html`.
  // Cloudflare's default `html_handling: "auto-trailing-slash"` (see
  // wrangler.jsonc) serves exactly those files at their extensionless paths,
  // so this must stay false to avoid a mismatch that would redirect-loop.
  trailingSlash: false,
};

export default nextConfig;
