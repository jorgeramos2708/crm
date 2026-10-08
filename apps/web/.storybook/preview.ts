import type { Preview } from "@storybook/vue3";
import { setup } from "@storybook/vue3";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import "@/style.css";
import { createThemeProvider } from "@/composables/useTheme";

const pinia = createPinia();
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/", component: { template: "<div />" } }],
});

setup((app) => {
  app.use(pinia);
  app.use(router);
  app.use(createThemeProvider());
});

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Tema global de los componentes",
      defaultValue: "light",
      toolbar: {
        title: "Tema",
        icon: "circlehollow",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      const theme = context.globals.theme;
      return {
        components: { story },
        template: `<div class="${theme === "dark" ? "dark" : ""}" style="padding: 1rem;"><story /></div>`,
      };
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#f8fafc" },
        { name: "dark", value: "#0a0f1a" },
        { name: "brand", value: "#1e3a5f" },
      ],
    },
  },
};

export default preview;
