// spec: specs/auth/login.md
// seed: seed.spec.ts

import { test, expect } from '../../fixtures/base';

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto();
});

test.describe('Successful Login', () => {
  test('Login with valid credentials', async ({ page, loginPage, dashboardPage }) => {
    // 2. Fill the email field with a valid email
    await loginPage.emailInput.fill(process.env.CC_EMAIL ?? '');

    // 3. Fill the password field with the correct password
    await loginPage.passwordInput.fill(process.env.CC_PASSWORD ?? '');

    // 4. Click the Sign In button
    await loginPage.signInButton.click();

    await page.waitForURL('**/dashboard**');

    // 5 Reload the page to ensure the user is still logged in
    await dashboardPage.dashboardContainer.shouldBeVisible();
  });
});
