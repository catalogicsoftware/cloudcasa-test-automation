// spec: specs/auth/login.md
// seed: seed.spec.ts

import { test } from '../../fixtures/base';

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto('/');
});

test.describe('Forgot Password Flow', () => {
  test('Go back to login form', async ({ loginPage }) => {
    // 2. Click "Forgot password"
    await loginPage.forgotPasswordButton.click();

    // 3. Click "Go back to login form"
    await loginPage.goBackLink.click();
    // Expected: password field reappears, Sign In button restored, Forgot password visible
    await loginPage.signInButton.shouldBeVisible();
    await loginPage.passwordInput.shouldBeVisible();
    await loginPage.signInButton.shouldHaveText('Sign In');
    await loginPage.forgotPasswordButton.shouldBeVisible();
  });
});
