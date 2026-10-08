import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import '../../src/style.css'
import { createThemeProvider } from '../../src/composables/useTheme'

const pinia = createPinia()
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

setup((app) => {
  app.use(pinia)
  app.use(router)
  app.use(createThemeProvider())
})

import * as components from '../../src/components'

Object.entries(components).forEach(([name, component]) => {
  if (component && typeof component === 'object' && 'name' in component) {
    setup((app) => {
      app.component(name, component)
    })
  }
})

const preview = {
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      const theme = context.globals.theme
      return {
        components: { story },
        template: `<div class="${theme === 'dark' ? 'dark' : ''}"><story /></div>`,
        provide: {
          theme: theme,
        },
      }
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
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' },
        { name: 'dark', value: '#0a0f1a' },
        { name: 'brand', value: '#1e3a5f' },
      ],
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
        ],
      },
    },
  },
}

module.exports = preview