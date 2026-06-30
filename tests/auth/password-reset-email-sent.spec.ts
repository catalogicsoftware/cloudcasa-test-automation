// spec: specs/auth/login.md
// seed: seed.spec.ts

import { test } from '../../fixtures/base';

test.describe('Forgot Password Flow', () => {
  test('Password reset email is sent for a valid email', async ({ loginPage }) => {
    // 1. Navigate to /login
    await loginPage.goto();

    // 2. Click "Forgot password"
    await loginPage.forgotPasswordButton.click();

    // 3. Fill the email field with a registered email
    await loginPage.emailInput.fill(process.env.CC_EMAIL ?? '');

    // 4. Click "Reset Password"
    await loginPage.signInButton.click();

    // Expected: green success banner appears, form stays on page (no redirect)
    await loginPage.resetSuccessMessage.shouldBeVisible();
    await loginPage.signInButton.shouldBeVisible();
  });
});
