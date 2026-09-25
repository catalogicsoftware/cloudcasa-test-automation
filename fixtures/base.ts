import { test as base, request as apiRequest } from '@playwright/test';
import { LoginPage } from '@page-object-model/pages/auth/login.page';
import { DashboardPage } from '@page-object-model/pages/dashboard.page';
import { ClustersPage } from '@page-object-model/pages/clusters.page';
import { DatabasesPage } from '@page-object-model/pages/databases.page';
import { DrPage } from '@page-object-model/pages/dr.page';
import { ReportsPage } from '@page-object-model/pages/reports.page';
import { ResetPasswordPage } from '@page-object-model/pages/auth/reset-password.page';
import { SignUpPage } from '@page-object-model/pages/auth/sign-up.page';
import { ConfigurationPage } from '@page-object-model/pages/configuration/configuration.page';
import { User, InvitedUser, defaultUser, invitedUser, registeredUser } from '@data/user';
import { UsersConfigurationPage } from '@page-object-model/pages/configuration/user-configuration.page';
import { StorageConfigurationPage } from '@page-object-model/pages/configuration/storage-configuration.page';
import { PoliciesConfigurationPage } from '@page-object-model/pages/configuration/policies-configuration.page';
import { PricingPlansPage } from '@page-object-model/pages/configuration/pricing-plans.page';
import { Toast } from '@page-object-model/components/toast.components';
import { CcApi } from '@utils/api/cc-api';
import { apiHeaders, apiOrigin } from '@utils/api/base.api';
import { CcApiRoutes } from '@data/api-routes';
import { checkMailboxAccess } from '@utils/mailinator';
import { acquireLock } from '@utils/mailinator-lock';

type Pages = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  clustersPage: ClustersPage;
  databasesPage: DatabasesPage;
  drPage: DrPage;
  reportsPage: ReportsPage;
  resetPasswordPage: ResetPasswordPage;
  configurationPage: ConfigurationPage;
  usersConfigurationPage: UsersConfigurationPage;
  storageConfigurationPage: StorageConfigurationPage;
  policiesConfigurationPage: PoliciesConfigurationPage;
  pricingPlansPage: PricingPlansPage;
  toast: Toast;
  signUpPage: SignUpPage;
  adminUser: User;
  invitedUser: InvitedUser;
  registeredUser: InvitedUser;
  ccApi: CcApi;
  resetPwdAccountLock: void;
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
  clustersPage: async ({ page }, use) => {
    await use(new ClustersPage(page));
  },
  databasesPage: async ({ page }, use) => {
    await use(new DatabasesPage(page));
  },
  drPage: async ({ page }, use) => {
    await use(new DrPage(page));
  },
  reportsPage: async ({ page }, use) => {
    await use(new ReportsPage(page));
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
  policiesConfigurationPage: async ({ page }, use) => {
    await use(new PoliciesConfigurationPage(page));
  },
  pricingPlansPage: async ({ page }, use) => {
    await use(new PricingPlansPage(page));
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

  // MailinatorInbox.RESET_PWD backs one fixed CloudCasa account shared by every
  // tests/auth/password-reset-* file, so two of those files running on different workers at the
  // same time can steal each other's reset email or stomp each other's password change. Requested
  // only by those files — every other test is unaffected and keeps running fully in parallel.
  resetPwdAccountLock: async ({}, use) => {
    const release = await acquireLock('reset-pwd-account');
    await use();
    release();
  },

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
