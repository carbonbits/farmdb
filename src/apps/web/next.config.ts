import type { NextConfig } from "next";

// Where API calls go while `next dev` is serving the app.
//
// In normal use the API serves this app's static export, so the client's
// relative /v1 URLs are same-origin and need no configuration. `next dev` puts
// the app on :3000 instead, where those same URLs would hit the Next dev server
// and 404 — which is why the frontend could not reach the backend in dev.
//
// Proxying rather than pointing the client at http://localhost:5700 keeps dev
// same-origin, so cookies, and the passkey ceremonies that check the browser's
// origin, behave the way they do in production.
const isDev = process.env.NODE_ENV === "development";
const apiTarget = process.env.API_PROXY_TARGET || "http://localhost:5700";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  transpilePackages: ["@farmdb/ui", "@farmdb/api-client"],
  images: {
    unoptimized: true,
  },
  // Next 16 writes AGENTS.md and CLAUDE.md into this folder on every dev run.
  // Nobody here authored those, so leave the repo's agent instructions to the
  // repo; flip this to true if the team decides it wants them.
  agentRules: false,
  // Rewrites need a server to run in, so they are dev-only: `next build`
  // exports static files and never sees them.
  ...(isDev && {
    async rewrites() {
      return [
        { source: "/v1/:path*", destination: `${apiTarget}/v1/:path*` },
        { source: "/openapi.json", destination: `${apiTarget}/openapi.json` },
        { source: "/docs", destination: `${apiTarget}/docs` },
        { source: "/docs/:path*", destination: `${apiTarget}/docs/:path*` },
        { source: "/redoc", destination: `${apiTarget}/redoc` },
      ];
    },
  }),
};

export default nextConfig;
