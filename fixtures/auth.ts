import { test as base } from './base';
import { Page } from '@playwright/test';

type AuthFixtures = {
  loggedInPage: Page;
  cancelInvitationAfterTest: void;
};

export const test = base.extend<AuthFixtures>({
  loggedInPage: async ({ page, loginPage }, use) => {
    await loginPage.goto();
    await loginPage.login(process.env.CC_EMAIL ?? '', process.env.CC_PASSWORD ?? '');
    await page.waitForURL('**/dashboard**');
    await use(page);
  },

  // Cancels the pending invitation for `invitedUser.email` via API after the test,
  // so every run starts from a clean invitations list.
  cancelInvitationAfterTest: async ({ ccApi, invitedUser }, use) => {
    await use();
    await ccApi.orgInvites.cancelByEmail(invitedUser.email);
  },
});

export { expect } from '@playwright/test';
