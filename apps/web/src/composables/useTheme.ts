import { ref, onMounted, watchEffect } from "vue";

const THEME_KEY = "crm-theme";

export function useTheme() {
  const theme = ref<"light" | "dark">("light");

  const applyTheme = (newTheme: "light" | "dark") => {
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem(THEME_KEY, newTheme);
  };

  const toggleTheme = () => {
    theme.value = theme.value === "light" ? "dark" : "light";
  };

  const setTheme = (newTheme: "light" | "dark") => {
    theme.value = newTheme;
  };

  onMounted(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") {
      theme.value = stored;
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      theme.value = prefersDark ? "dark" : "light";
    }
  });

  watchEffect(() => {
    applyTheme(theme.value);
  });

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: () => theme.value === "dark",
  };
}

export function createThemeProvider() {
  const { theme, toggleTheme, setTheme, isDark } = useTheme();

  return {
    install(app) {
      app.provide("theme", {
        theme,
        toggleTheme,
        setTheme,
        isDark,
      });
    },
  };
}

export function useThemeProvider() {
  return inject("theme");
}

import { inject } from "vue";
