// spec: specs/auth/login.md
// seed: seed.spec.ts

import { test, expect } from '@fixtures/base';

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto();
});

test.describe('Field Validation', () => {
  test('Sign In button is disabled after submitting with email only', async ({ loginPage }) => {
    // 2. Fill only the email field
    await loginPage.emailInput.fill('test@example.com');

    // 3. Leave password empty and click Sign In
    await loginPage.signInButton.click();

    // Expected: Sign In button becomes disabled, no redirect
    await expect(loginPage.signInButton.getLocator()).toBeDisabled();
    await loginPage.emailInput.shouldBeVisible();
  });
});
