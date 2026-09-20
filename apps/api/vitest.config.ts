import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.config.*', 'src/server.ts', 'src/migrate.ts', 'src/seed.ts'],
    },
    globals: true,
    setupFiles: ['src/test/setup.ts'],
  },
})