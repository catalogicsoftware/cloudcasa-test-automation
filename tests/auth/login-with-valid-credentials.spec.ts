// spec: specs/auth/login.md
// seed: seed.spec.ts

import { test } from '@fixtures/base';

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto();
});

test.describe('Successful Login', () => {
  test('Login with valid credentials', async ({ loginPage, dashboardPage, adminUser: user }) => {
    // 2. Fill the email field with a valid email
    await loginPage.emailInput.fill(user.email);

    // 3. Fill the password field with the correct password
    await loginPage.passwordInput.fill(user.password);

    // 4. Click the Sign In button
    await loginPage.signInButton.click();

    await dashboardPage.waitForDashboardData();

    // 5 Reload the page to ensure the user is still logged in
    await dashboardPage.dashboardContainer.shouldBeVisible();

    // 6 Close User Help Modal
    await dashboardPage.userHelpModal.closeModal();

    // 7 Open User Menu
    await dashboardPage.userMenu.open();

    // 8 Verify email
    await dashboardPage.userMenu.checkUserMenuEmail(user.email);
  });
});
