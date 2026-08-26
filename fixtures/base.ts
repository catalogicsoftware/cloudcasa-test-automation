import { test as base, request as apiRequest } from '@playwright/test';
import { LoginPage } from '@page-object-model/pages/auth/login.page';
import { DashboardPage } from '@page-object-model/pages/dashboard.page';
import { ResetPasswordPage } from '@page-object-model/pages/auth/reset-password.page';
import { SignUpPage } from '@page-object-model/pages/auth/sign-up.page';
import { ConfigurationPage } from '@page-object-model/pages/configuration/configuration.page';
import { User, InvitedUser, defaultUser, invitedUser, registeredUser } from '@data/user';
import { UsersConfigurationPage } from '@page-object-model/pages/configuration/user-configuration.page';
import { StorageConfigurationPage } from '@page-object-model/pages/configuration/storage-configuration.page';
import { Toast } from '@page-object-model/components/toast.components';
import { CcApi } from '@utils/api/cc-api';
import { apiHeaders, apiOrigin } from '@utils/api/base.api';
import { CcApiRoutes } from '@data/api-routes';
import { checkMailboxAccess } from '@utils/mailinator';

type Pages = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  resetPasswordPage: ResetPasswordPage;
  configurationPage: ConfigurationPage;
  usersConfigurationPage: UsersConfigurationPage;
  storageConfigurationPage: StorageConfigurationPage;
  toast: Toast;
  signUpPage: SignUpPage;
  adminUser: User;
  invitedUser: InvitedUser;
  registeredUser: InvitedUser;
  ccApi: CcApi;
};

type WorkerFixtures = {
  apiAuthCheck: void;
  mailboxAccess: void;
};

export const test = base.extend<Pages, WorkerFixtures>({
  adminUser: async ({}, use) => {
    await use(defaultUser);
  },
  invitedUser: async ({}, use) => {
    await use(invitedUser);
  },
  registeredUser: async ({}, use) => {
    await use(registeredUser);
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  resetPasswordPage: async ({ page }, use) => {
    await use(new ResetPasswordPage(page));
  },
  signUpPage: async ({ page }, use) => {
    await use(new SignUpPage(page));
  },
  configurationPage: async ({ page }, use) => {
    await use(new ConfigurationPage(page));
  },
  usersConfigurationPage: async ({ page }, use) => {
    await use(new UsersConfigurationPage(page));
  },
  storageConfigurationPage: async ({ page }, use) => {
    await use(new StorageConfigurationPage(page));
  },
  toast: async ({ page }, use) => {
    await use(new Toast(page));
  },

  // CloudCasa REST API client authenticated with the static CLOUDCASA_API_TOKEN.
  ccApi: async ({ request }, use) => {
    await use(new CcApi(request));
  },

  // Runs once per worker before any test: verifies the API token is valid so a
  // bad/expired token aborts the run immediately instead of failing teardowns.
  apiAuthCheck: [
    async ({}, use) => {
      const context = await apiRequest.newContext();
      const response = await context.get(`${apiOrigin()}/${CcApiRoutes.KUBECLUSTERS}`, {
        headers: apiHeaders(),
        params: { max_results: 1 },
      });
      const status = response.status();
      const body = status === 200 ? '' : await response.text();
      await context.dispose();

      if (status === 401 || status === 403) {
        throw new Error(
          `CloudCasa API token is invalid or expired (GET kubeclusters returned ${status}). ` +
            'Regenerate CLOUDCASA_API_TOKEN in the CloudCasa UI.',
        );
      }
      if (status !== 200) {
        throw new Error(`CloudCasa API auth check failed: ${status} ${body}`);
      }
      await use();
    },
    { scope: 'worker', auto: true },
  ],

  // Requested only by tests that read an inbox, so a run without Mailinator configured still
  // exercises everything else instead of failing wholesale.
  mailboxAccess: [
    async ({}, use) => {
      await checkMailboxAccess();
      await use();
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
