// spec: specs/auth/login.md
// seed: seed.spec.ts

import { test, expect } from '../../fixtures/base';

test.describe('Field Validation', () => {
  test('Sign In button is disabled after submitting empty form', async ({ loginPage }) => {
    // 1. Navigate to /login
    await loginPage.goto();

    // 2. Leave both fields empty and click Sign In
    await loginPage.signInButton.click();

    // Expected: Sign In button becomes disabled, no redirect
    await expect(loginPage.signInButton.getLocator()).toBeDisabled();
    await loginPage.emailInput.shouldBeVisible();
  });
});
