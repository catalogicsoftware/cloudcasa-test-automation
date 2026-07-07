import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/auth/login.page';
import { DashboardPage } from '@pages/dashboard/dashboard.page';
import { ResetPasswordPage } from '@pages/auth/reset-password.page';
import { SignUpPage } from '@pages/sign-up/sign-up.page';

type Pages = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  resetPasswordPage: ResetPasswordPage;
  signUpPage: SignUpPage;
};

export const test = base.extend<Pages>({
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
});

export { expect } from '@playwright/test';
