import { test as base } from '@playwright/test';
import { LoginPage } from '@page-object-model/pages/auth/login.page';
import { DashboardPage } from '@page-object-model/pages/dashboard.page';
import { ResetPasswordPage } from '@page-object-model/pages/auth/reset-password.page';
import { SignUpPage } from '@page-object-model/pages/auth/sign-up.page';
import { ConfigurationPage } from '@page-object-model/pages/configuration/configuration.page';
import { User, InvitedUser, defaultUser, invitedUser } from '@data/user';
import { UsersConfigurationPage } from '@page-object-model/pages/configuration/user-configuration.page';

type Pages = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  resetPasswordPage: ResetPasswordPage;
  configurationPage: ConfigurationPage;
  usersConfigurationPage: UsersConfigurationPage;
  signUpPage: SignUpPage;
  adminUser: User;
  invitedUser: InvitedUser;
};

export const test = base.extend<Pages>({
  adminUser: async ({}, use) => {
    await use(defaultUser);
  },
  invitedUser: async ({}, use) => {
    await use(invitedUser);
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
});

export { expect } from '@playwright/test';
