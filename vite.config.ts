import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
  registerType: "autoUpdate",
  includeAssets: [
    "favicon.ico",
    "apple-touch-icon.png",
    "pwa-192x192.png",
    "pwa-512x512.png",
    "maskable-icon.png",
  ],
  manifest: {
    name: "Fanta DS",
    short_name: "Fanta DS",
    description: "Il tuo direttore sportivo per il fantacalcio.",
    theme_color: "#111827",
    background_color: "#111827",
    display: "standalone",
    start_url: "/",
    scope: "/",
    icons: [
      { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/maskable-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  version: "0.0.2",
},
  workbox: {
    navigateFallback: "/index.html",
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
  },
})
,
  ],
});
