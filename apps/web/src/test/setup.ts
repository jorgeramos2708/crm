import { config } from "@vue/test-utils";

// Stub global de v-auto-animate: la directiva se registra en main.js (app
// real) pero no existe al montar componentes aislados en tests → Vue warn.
config.global.directives = {
  ...(config.global.directives ?? {}),
  "auto-animate": {
    mounted() {},
    unmounted() {},
  },
};
