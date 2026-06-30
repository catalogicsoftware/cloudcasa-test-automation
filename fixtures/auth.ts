import { test as base } from './base';
import { Page } from '@playwright/test';

type AuthFixtures = {
  loggedInPage: Page;
};

export const test = base.extend<AuthFixtures>({
  loggedInPage: async ({ page, loginPage }, use) => {
    await loginPage.goto();
    await loginPage.login(process.env.CC_EMAIL ?? '', process.env.CC_PASSWORD ?? '');
    await page.waitForURL('**/dashboard**');
    await use(page);
  },
});

export { expect } from '@playwright/test';
