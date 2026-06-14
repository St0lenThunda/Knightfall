import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { readFileSync } from 'fs'

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

  // https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  cacheDir: 'node_modules/.vite', // Explicitly use node_modules to avoid root-level lock noise
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    '__APP_VERSION__': JSON.stringify(packageJson.version),
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    watch: {
      ignored: ['**/.agent/**']
    }
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/tests/vitest.setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
    // Optimization: Avoid UI lockups during test runs
    poolOptions: {
      threads: {
        singleThread: true,
      }
    }
  } as any,
})
