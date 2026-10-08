const { dirname, resolve } = require('path')
const { fileURLToPath } = require('url')

function getAbsolutePath(value) {
  try {
    return dirname(require.resolve(`${value}/package.json`))
  } catch {
    return resolve(__dirname, '..', 'node_modules', value)
  }
}

/** @type { import('@storybook/vue3-vite').StorybookConfig } */
const config = {
  stories: [
    '../../src/**/*.mdx',
    '../../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    require.resolve('@storybook/addon-essentials'),
    require.resolve('@storybook/addon-interactions'),
    require.resolve('@storybook/addon-links'),
    require.resolve('@storybook/addon-a11y'),
    require.resolve('@storybook/addon-docs'),
    require.resolve('@storybook/addon-onboarding')
  ],
  framework: {
    name: require.resolve('@storybook/vue3-vite'),
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
}

module.exports = config