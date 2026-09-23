import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const isTest = mode === "test" || !!process.env.VITEST;
  return {
    plugins: [
      vue(),
      ...(isTest
        ? []
        : [
            VitePWA({
              registerType: "autoUpdate",
              includeAssets: ["icon.svg", "favicon.ico"],
              manifest: {
                name: "CRM",
                short_name: "CRM",
                description: "CRM de ventas, contactos y pipeline",
                lang: "es",
                start_url: "/",
                scope: "/",
                display: "standalone",
                orientation: "portrait-primary",
                background_color: "#ffffff",
                theme_color: "#2563eb",
                icons: [
                  {
                    src: "/icon.svg",
                    sizes: "any",
                    type: "image/svg+xml",
                    purpose: "any",
                  },
                  {
                    src: "/icon.svg",
                    sizes: "any",
                    type: "image/svg+xml",
                    purpose: "maskable",
                  },
                ],
              },
              workbox: {
                globPatterns: ["**/*.{js,css,html,svg,ico,woff2}"],
                navigateFallback: "/index.html",
                runtimeCaching: [
                  {
                    urlPattern: /^\/api\/.*/,
                    handler: "NetworkOnly",
                  },
                ],
              },
              devOptions: { enabled: false },
            }),
          ]),
    ],
    server: {
      port: 8081,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
