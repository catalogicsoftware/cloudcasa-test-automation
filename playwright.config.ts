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
    // Without these Playwright waits forever on a stuck action, so a broken
    // locator burns the whole test budget and reports only "test timeout".
    actionTimeout: 15 * 1000,
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
