import { test as base } from './base';
import { Page } from '@playwright/test';
import { LOGIN_REDIRECT_TIMEOUT } from '@data/timeouts';
import { UsersApi } from '@utils/api/users.api';
import { MailinatorInbox, mailboxAddress } from '@data/mailinator-inboxes';

type AuthFixtures = {
  loggedInPage: Page;
  cancelInvitationAfterTest: void;
  cancelSignupInvitationAfterTest: void;
  adminJwt: string;
  usersApi: UsersApi;
  cleanRegisteredUserState: void;
  createdObjectStorages: string[];
  createdPolicies: string[];
};

export const test = base.extend<AuthFixtures>({
  loggedInPage: async ({ page, loginPage }, use) => {
    const signIn = async (): Promise<void> => {
      await loginPage.goto();
      await loginPage.login(process.env.CC_EMAIL ?? '', process.env.CC_PASSWORD ?? '');
      await page.waitForURL('**/dashboard**', { timeout: LOGIN_REDIRECT_TIMEOUT });
    };

    // Staging drops a sign-in back onto the IdP form often enough that nothing but a second
    // attempt recovers it: the chain ends on the login form, so waiting longer cannot help.
    try {
      await signIn();
    } catch {
      await signIn();
    }

    await use(page);
  },

  // invitedUser/the signup-flow invitee use a FIXED Mailinator address (one inbox
  // = one owning test file), so nothing makes a run's invite unique — repeatability
  // relies entirely on cleanup running. Cleaning both before and after (like
  // cleanRegisteredUserState below) makes this self-healing: if a prior run
  // crashed/timed out before its own "after" cleanup ran, the next run's
  // "before" pass removes the stale invite instead of leaving a duplicate
  // PENDING row that would break Table row-matching assertions.
  cancelInvitationAfterTest: async ({ ccApi, invitedUser }, use) => {
    await ccApi.orgInvites.cancelByEmail(invitedUser.email);
    await use();
    await ccApi.orgInvites.cancelByEmail(invitedUser.email);
  },

  // Same self-healing cleanup for the signup-flow invitee (fixed invite-signup
  // address): it never completes signup — reCAPTCHA blocks it — so its
  // invitation stays PENDING and would shadow the next run's invitation email.
  cancelSignupInvitationAfterTest: async ({ ccApi }, use) => {
    const clean = () =>
      ccApi.orgInvites.cancelByEmail(mailboxAddress(MailinatorInbox.INVITE_SIGNUP));
    await clean();
    await use();
    await clean();
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

  // Names are pushed before the save, so a failure anywhere after it still cleans up.
  createdObjectStorages: async ({ ccApi }, use) => {
    const names: string[] = [];
    await use(names);

    // Every name is attempted before any failure is raised, so one bad delete cannot strand the rest.
    const failures: string[] = [];
    for (const name of names) {
      try {
        await ccApi.objectStores.deleteByName(name);
      } catch (error) {
        failures.push(`${name}: ${(error as Error).message}`);
      }
    }
    if (failures.length) {
      throw new Error(`Object storage teardown failed for ${failures.join('; ')}`);
    }
  },

  // Same contract as createdObjectStorages: names are pushed before the save, so a
  // failure between creating the policy and removing it through the UI still cleans up.
  createdPolicies: async ({ ccApi }, use) => {
    const names: string[] = [];
    await use(names);

    const failures: string[] = [];
    for (const name of names) {
      try {
        await ccApi.policies.deleteByName(name);
      } catch (error) {
        failures.push(`${name}: ${(error as Error).message}`);
      }
    }
    if (failures.length) {
      throw new Error(`Policy teardown failed for ${failures.join('; ')}`);
    }
  },
});

export { expect } from '@playwright/test';
