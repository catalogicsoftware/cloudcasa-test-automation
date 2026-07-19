import { test as base } from './base';
import { Page } from '@playwright/test';
import { UsersApi } from '@utils/api/users.api';
import { TestmailTag, testmailAddress } from '@data/testmail-tags';

type AuthFixtures = {
  loggedInPage: Page;
  cancelInvitationAfterTest: void;
  cancelSignupInvitationAfterTest: void;
  adminJwt: string;
  usersApi: UsersApi;
  cleanRegisteredUserState: void;
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

  // Same cleanup for the signup-flow invitee (fixed invite-signup address):
  // it never completes signup — reCAPTCHA blocks it — so its invitation
  // stays PENDING and would shadow the next run's invitation email.
  cancelSignupInvitationAfterTest: async ({ ccApi }, use) => {
    await use();
    await ccApi.orgInvites.cancelByEmail(testmailAddress(TestmailTag.INVITE_SIGNUP));
  },

  // The /users resource rejects the static API key, so cleanup needs the JWT
  // the admin SPA sends. The dashboard is already loaded when loggedInPage
  // resolves, so a reload is the cheapest way to observe a fresh API request
  // and read its Authorization header.
  adminJwt: async ({ loggedInPage }, use) => {
    const [apiCall] = await Promise.all([
      loggedInPage.waitForRequest(
        request =>
          request.url().includes('/api/v1/') &&
          (request.headers()['authorization'] ?? '').startsWith('Bearer '),
      ),
      loggedInPage.reload(),
    ]);
    await use(apiCall.headers()['authorization'].replace(/^Bearer /, ''));
  },

  usersApi: async ({ request, adminJwt }, use) => {
    await use(new UsersApi(request, adminJwt));
  },

  // Removes the registered user from the organization and cancels any pending
  // invitation — BOTH before the test (self-healing when a previous run died
  // between acceptance and teardown) and after it. Each half is a no-op when
  // there is nothing to clean.
  cleanRegisteredUserState: async ({ usersApi, ccApi, registeredUser }, use) => {
    const clean = async () => {
      await usersApi.removeByEmail(registeredUser.email);
      await ccApi.orgInvites.cancelByEmail(registeredUser.email);
    };
    await clean();
    await use();
    await clean();
  },
});

export { expect } from '@playwright/test';
