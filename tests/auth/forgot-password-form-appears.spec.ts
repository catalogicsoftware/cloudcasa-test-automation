// spec: specs/auth/login.md
// seed: seed.spec.ts

import { test, expect } from '../../fixtures/base';

test.describe('Forgot Password Flow', () => {
  test('Forgot password form appears after clicking the button', async ({ loginPage }) => {
    // 1. Navigate to /login
    await loginPage.goto();

    // 2. Click the "Forgot password" button
    await loginPage.forgotPasswordButton.click();

    // Expected: password field disappears, Reset Password button appears, Go back link appears
    await expect(loginPage.passwordInput.getLocator()).not.toBeVisible();
    await loginPage.emailInput.shouldBeVisible();
    await loginPage.goBackLink.shouldBeVisible();
    await loginPage.signInButton.shouldHaveText('Reset Password');
  });
});
