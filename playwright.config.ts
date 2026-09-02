import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 60 * 1000,
  expect: {
    timeout: 5000,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Kept low in CI: the workers share one CloudCasa account (see ci/README.md).
  workers: process.env.CI ? 2 : undefined,
  // In CI the raw results are POSTed to the Allure Docker Service (see ci/README.md).
  // junit.xml is what Testmo ingests (see ci/README.md).
  reporter: [['html'], ['allure-playwright'], ['junit', { outputFile: 'test-results/junit.xml' }]],
  use: {
    baseURL: process.env.BASE_URL || 'https://home.cloudcasa.io',
    // No actionTimeout: ~20s of added latency in CI made a 15s cap fail 17 of 19 tests.
    navigationTimeout: 30 * 1000,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: !!process.env.CI,
    launchOptions: {
      slowMo: Number(process.env.SLOW_MO) || 0,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
