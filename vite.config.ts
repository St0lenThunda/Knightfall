/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import packageJson from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    '__APP_VERSION__': JSON.stringify(packageJson.version),
  },
  server: {
    host: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    // Sometimes needed for proxy environments
    allowedHosts: true
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/']
    }
  }
})
