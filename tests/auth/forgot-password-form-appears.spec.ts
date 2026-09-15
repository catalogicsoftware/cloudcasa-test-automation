import { test } from '@fixtures/base';

test.beforeEach(async ({ loginPage }) => {
  // 1. Navigate to /login
  await loginPage.goto('/');
});

test.describe('Forgot Password Flow', () => {
  test('Forgot password form appears after clicking the button', async ({ loginPage }) => {
    // 2. Click the "Forgot password" button
    await loginPage.clickForgotPassword();

    // Expected: password field disappears, Reset Password button appears, Go back link appears
    await loginPage.emailInput.shouldBeVisible();
    await loginPage.goBackLink.shouldBeVisible();
    await loginPage.signInButton.shouldHaveText('Reset Password');
  });
});
