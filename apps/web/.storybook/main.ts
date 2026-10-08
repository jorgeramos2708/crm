import type { StorybookConfig } from "@storybook/vue3-vite";
import path from "node:path";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|ts)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/vue3-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  async viteFinal(cfg) {
    cfg.resolve = cfg.resolve ?? {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "../src"),
    };
    // El PWA del despliegue no aplica al catálogo: sus hooks rompen el
    // build del preview. Se elimina por nombre (coincidencia parcial,
    // recursiva por si viene anidado en arrays del config del proyecto).
    const stripPwa = (items: unknown[]): unknown[] =>
      items.flatMap((p) => {
        if (Array.isArray(p)) return stripPwa(p);
        const name = (p as { name?: unknown } | null)?.name;
        if (typeof name === "string" && name.toLowerCase().includes("pwa"))
          return [];
        return [p];
      });
    cfg.plugins = stripPwa(
      Array.isArray(cfg.plugins) ? cfg.plugins : [cfg.plugins],
    );
    return cfg;
  },
};

export default config;
