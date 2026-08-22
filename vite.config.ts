// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: [
    VitePWA({
      // Prompt the user before activating a new SW — avoids unexpected reloads
      // mid-session in a finance app.
      registerType: "prompt",

      // SSR: no static index.html exists to inject into — registration is
      // handled manually via the PWAUpdatePrompt component.
      injectRegister: null,

      strategies: "generateSW",

      manifest: {
        name: "GigSave — Financial Navigator",
        short_name: "GigSave",
        description: "Track gig earnings, control expenses and save automatically into goal jars.",
        theme_color: "#7c3aed",
        background_color: "#faf9ff",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        categories: ["finance", "productivity"],
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/maskable-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        // Precache all static assets produced by the Vite build.
        // HTML is intentionally excluded — pages are SSR and must be
        // fetched from the Nitro server, not served from the SW cache.
        globPatterns: ["**/*.{js,css,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],

        // No SPA fallback — Nitro/SSR owns navigation responses.
        navigateFallback: null,

        runtimeCaching: [
          // Google Fonts stylesheet
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts font files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      devOptions: {
        // Enables the SW in dev so you can test offline behaviour locally.
        enabled: true,
        type: "module",
      },
    }),
  ],
});
