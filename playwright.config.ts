import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Increase global timeout for slower environments */
  timeout: 120 * 1000,
  expect: {
    timeout: 15000,
  },
  /* 
   * In resource-constrained environments, parallel execution can lead to 
   * browser launch timeouts. Restricting to sequential execution (workers: 1) 
   * ensures maximum CPU/RAM is available for the active test.
   */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Add a retry for flakiness
  workers: 1, 
  
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    /* Increase action and navigation timeouts */
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        }
      },
      testIgnore: /integrity\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
