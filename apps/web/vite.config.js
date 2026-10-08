import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

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
                name: "Varko CRM",
                short_name: "Varko",
                description: "Varko CRM de ventas, contactos y pipeline",
                lang: "es",
                start_url: "/",
                scope: "/",
                display: "standalone",
                orientation: "portrait-primary",
                background_color: "#f3f6fb",
                theme_color: "#1d4ed8",
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
                globPatterns: ["**/*.{js,html,svg,ico,woff2}"],
                globIgnores: [
                  "**/@fontsource/**",
                  "**/node_modules/@fontsource/**",
                  "**/@fontsource-variable/**",
                  "**/node_modules/@fontsource-variable/**",
                  "**/grapesjs/**",
                  "**/node_modules/grapesjs/**",
                  "**/node_modules/**/*.css",
                ],
                navigateFallback: "/index.html",
                navigateFallbackDenylist: [/^\/api\//],
                runtimeCaching: [
                  {
                    // No interceptar navegaciones a /api (redirecciones OAuth/SSO)
                    urlPattern: ({ url, request }) =>
                      url.pathname.startsWith("/api/") &&
                      request.mode !== "navigate",
                    handler: "NetworkOnly",
                  },
                ],
              },
              devOptions: { enabled: false },
            }),
          ]),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
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
      target: "es2022",
      modulePreload: {
        polyfill: true,
      },
      rollupOptions: {
        output: {
          // Solo vendors: el reparto de código de app generaba chunks
          // circulares (vendor-vue <-> vendor-utils) con TDZ en runtime.
          manualChunks: {
            "vendor-vue": ["vue", "vue-router", "pinia"],
            "vendor-ui": [
              "@lucide/vue",
              "reka-ui",
              "@formkit/auto-animate",
              "fuse.js",
              "@vueuse/core",
            ],
            "vendor-utils": ["axios", "idb"],
          },
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split(".");
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
              return `assets/images/[name]-[hash].${ext}`;
            }
            if (/\.(woff2?|ttf|eot)$/.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash].${ext}`;
            }
            return `assets/[ext]/[name]-[hash].${ext}`;
          },
        },
      },
      cssCodeSplit: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 500,
    },
  };
});
